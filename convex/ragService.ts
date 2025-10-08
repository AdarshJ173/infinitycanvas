import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Add document chunks to RAG system
export const addDocumentToRAG = action({
  args: { 
    nodeId: v.string(), // We'll pass as string and convert
    chunks: v.array(v.object({
      content: v.string(),
      chunkIndex: v.number(),
      embedding: v.array(v.number()),
    })),
    fileName: v.string(),
  },
  handler: async (ctx, { nodeId, chunks, fileName }) => {
    console.log(`🔄 Adding ${chunks.length} chunks to RAG system...`);
    
    try {
      // Get node to verify it exists
      const node = await ctx.runQuery(api.nodes.getNode, { nodeId: nodeId as any });
      if (!node) throw new Error('Node not found');

      // Add each chunk to RAG system and database
      for (const chunk of chunks) {
        const chunkId = `${nodeId}_chunk_${chunk.chunkIndex}`;
        
        // Store chunk in database with embedding
        await ctx.runMutation(api.ragService.createDocumentChunk, {
          nodeId: nodeId as any,
          canvasId: node.canvasId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          wordCount: chunk.content.split(/\s+/).length,
          startChar: chunk.chunkIndex * 450, // Approximate
          endChar: (chunk.chunkIndex * 450) + chunk.content.length,
          metadata: {
            fileName,
            chunkType: "semantic",
          },
          embeddingId: chunkId,
          embedding: chunk.embedding,
        });
      }

      // Update node status
      await ctx.runMutation(api.nodes.updateProcessingStatus, {
        nodeId: nodeId as any,
        status: "ready",
        chunkCount: chunks.length,
        embeddingGenerated: true,
      });

      console.log(`✅ Successfully added ${chunks.length} chunks to RAG system`);
      return { success: true, chunksAdded: chunks.length };

    } catch (error) {
      console.error('❌ Failed to add document to RAG:', error);
      
      // Update node with error status
      await ctx.runMutation(api.nodes.updateProcessingStatus, {
        nodeId: nodeId as any,
        status: "error",
        processingError: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  },
});

// Search RAG system for relevant context (using vector similarity)
export const searchRAG = action({
  args: { 
    query: v.string(),
    queryEmbedding: v.array(v.number()),
    canvasId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, queryEmbedding, canvasId, limit = 8 }): Promise<any[]> => {
    try {
      console.log(`🔍 Searching RAG system for: "${query.substring(0, 50)}..."`);
      
      // Get all chunks for this canvas
      const allChunks: any[] = await ctx.runQuery(api.ragService.getChunksByCanvas, {
        canvasId: canvasId as any
      });

      // Calculate similarity scores
      const results: any[] = allChunks.map((chunk: any) => {
        const score = cosineSimilarity(queryEmbedding, chunk.embedding || []);
        return {
          text: chunk.content,
          score,
          metadata: chunk.metadata,
          chunkId: chunk._id,
          nodeId: chunk.nodeId,
        };
      });

      // Sort by score and take top results
      const topResults: any[] = results
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);

      console.log(`✅ Found ${topResults.length} relevant chunks (avg score: ${
        topResults.reduce((sum: number, r: any) => sum + r.score, 0) / topResults.length || 0
      })`);

      return topResults;

    } catch (error) {
      console.error('❌ RAG search failed:', error);
      return [];
    }
  },
});

// Helper function: cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

// Generate AI response with RAG context using Gemini
export const generateRAGResponse = action({
  args: {
    userQuestion: v.string(),
    queryEmbedding: v.array(v.number()),
    canvasId: v.string(),
    connectedNodeIds: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, { userQuestion, queryEmbedding, canvasId, connectedNodeIds, userId }): Promise<any> => {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Generating RAG response for: "${userQuestion.substring(0, 50)}..."`);
      
      // Search for relevant context
      const searchResults: any[] = await ctx.runAction(api.ragService.searchRAG, {
        query: userQuestion,
        queryEmbedding,
        canvasId,
        limit: 6,
      });

      // Get connected nodes for additional context
      const connectedNodes: any[] = await Promise.all(
        connectedNodeIds.map((id: string): Promise<any> => ctx.runQuery(api.nodes.getNode, { nodeId: id as any }))
      );

      // Build comprehensive context
      const ragContext: string = searchResults
        .filter((result: any) => result.score > 0.1) // Filter low-relevance results
        .map((result: any) => 
          `[Source: ${result.metadata?.fileName}]\n${result.text}`
        ).join('\n\n---\n\n');

      const nodeContext: string = connectedNodes
        .filter((node: any) => node != null)
        .map((node: any) => 
          `[${node!.type} Node: ${node!.name}]\n${node!.content || node!.extractedText || 'No content'}`
        ).join('\n\n');

      // Build system prompt
      const systemPrompt: string = `You are Neuron AI, an intelligent learning assistant that helps users understand and connect their knowledge.

AVAILABLE CONTEXT FROM DOCUMENTS:
${ragContext || 'No relevant documents found.'}

CONNECTED NODES IN WORKFLOW:
${nodeContext || 'No connected nodes.'}

INSTRUCTIONS:
- Answer using ONLY the provided context from the user's documents and nodes
- Be precise, educational, and insightful
- Reference specific sources when possible: "According to [Source: filename.pdf]..."
- If the context doesn't contain the answer, clearly state: "Based on your uploaded documents, I don't have information about..."
- Connect concepts across different sources when relevant
- Maintain academic rigor while being conversational
- Focus on helping the user learn and understand`;

      // Call Gemini API using fetch
      // In Convex, environment variables should be accessed differently
      // For now, using a placeholder - configure via Convex dashboard
      const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY || '';
      if (!apiKey) {
        console.warn('⚠️ GEMINI_API_KEY not configured - using mock response');
        // Return mock response when API key is not available
        const mockResponse = "I'm currently running without an AI backend. Please configure GEMINI_API_KEY in your Convex environment variables to enable AI responses.";
        
        const processingTime = Date.now() - startTime;
        const messageId: any = await ctx.runMutation(api.ragService.createChatMessage, {
          canvasId: canvasId as any,
          userId: userId as any,
          role: "assistant",
          content: mockResponse,
          processingTimeMs: processingTime,
        });
        
        return {
          response: mockResponse,
          messageId,
          contextsUsed: searchResults.length,
          sourcesReferenced: [],
          avgRelevanceScore: 0,
          processingTimeMs: processingTime,
        };
      }

      const response: Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUSER QUESTION: ${userQuestion}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1200,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const aiResponse: string = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I apologize, but I couldn't generate a response.";

      const processingTime = Date.now() - startTime;

      // Save chat message
      const messageId: any = await ctx.runMutation(api.ragService.createChatMessage, {
        canvasId: canvasId as any,
        userId: userId as any,
        role: "assistant",
        content: aiResponse,
        retrievedChunks: searchResults.map((r: any) => r.chunkId),
        contextScore: searchResults.length > 0 ? 
          searchResults.reduce((sum: number, r: any) => sum + r.score, 0) / searchResults.length : 0,
        sourcesUsed: [...new Set(searchResults.map((r: any) => r.metadata?.fileName).filter(Boolean))],
        model: "gemini-1.5-flash",
        tokenCount: data.usageMetadata?.totalTokenCount || 0,
        processingTimeMs: processingTime,
      });

      console.log(`✅ RAG response generated in ${processingTime}ms using ${searchResults.length} chunks`);

      return {
        response: aiResponse,
        messageId,
        contextsUsed: searchResults.length,
        sourcesReferenced: [...new Set(searchResults.map((r: any) => r.metadata?.fileName).filter(Boolean))],
        avgRelevanceScore: searchResults.length > 0 ? 
          searchResults.reduce((sum: number, r: any) => sum + r.score, 0) / searchResults.length : 0,
        processingTimeMs: processingTime,
      };

    } catch (error) {
      console.error('❌ RAG response generation failed:', error);
      
      // Save error message
      await ctx.runMutation(api.ragService.createChatMessage, {
        canvasId: canvasId as any,
        userId: userId as any,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your question. Please try rephrasing or check if your documents are properly loaded.",
        processingTimeMs: Date.now() - startTime,
      });

      throw error;
    }
  },
});

// Database mutations and queries
export const createDocumentChunk = mutation({
  args: {
    nodeId: v.id("nodes"),
    canvasId: v.id("canvases"),
    chunkIndex: v.number(),
    content: v.string(),
    wordCount: v.number(),
    startChar: v.number(),
    endChar: v.number(),
    metadata: v.object({
      fileName: v.string(),
      chunkType: v.string(),
    }),
    embeddingId: v.optional(v.string()),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documentChunks", {
      nodeId: args.nodeId,
      canvasId: args.canvasId,
      chunkIndex: args.chunkIndex,
      content: args.content,
      wordCount: args.wordCount,
      startChar: args.startChar,
      endChar: args.endChar,
      metadata: args.metadata,
      embeddingId: args.embeddingId,
      lastEmbedded: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const getChunksByCanvas = query({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    return await ctx.db
      .query("documentChunks")
      .withIndex("by_canvas", (q) => q.eq("canvasId", canvasId))
      .collect();
  },
});

export const createChatMessage = mutation({
  args: {
    canvasId: v.id("canvases"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    retrievedChunks: v.optional(v.array(v.string())),
    contextScore: v.optional(v.number()),
    sourcesUsed: v.optional(v.array(v.string())),
    model: v.optional(v.string()),
    tokenCount: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getChatMessages = query({
  args: { canvasId: v.id("canvases"), limit: v.optional(v.number()) },
  handler: async (ctx, { canvasId, limit = 50 }) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_canvas", (q) => q.eq("canvasId", canvasId))
      .order("desc")
      .take(limit);
  },
});
