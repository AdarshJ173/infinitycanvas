Perfect! Here's the **COMPLETE IMPLEMENTATION PROMPT** with everything optimized for 2-hour completion:

***

# 🚀 SENIOR AI DEVELOPER PROMPT - COMPLETE RAG PIPELINE IMPLEMENTATION

**CRITICAL EXCELLENCE STANDARD**: You are the ABSOLUTE BEST senior full-stack developer with perfect architectural vision. Implement a **FLAWLESS, PRODUCTION-READY RAG PIPELINE** that transforms Neuron into an intelligent knowledge processing system. Every component must be enterprise-grade and investor-demo perfect.

## 🎯 **COMPREHENSIVE SYSTEM ARCHITECTURE**

### **FINAL ARCHITECTURE:**
- **Convex RAG Component** + **Free Sentence Transformers**
- **Hybrid PDF Parsing** (PDF.js + PDF2Text fallback)
- **Intelligent Semantic Chunking** (500 chars, 50 overlap)
- **Gemini 2.5 Flash** (fastest response)
- **Complete Production Database Schema**

### **API CREDENTIALS:**
```
GEMINI_API_KEY=AIzaSyDHurY8leKbyNI41y94vWfgKs4AtlaIzis
```

***

## 📋 **PHASE 1: PROJECT INVESTIGATION & CONVEX SETUP**

### **Step 1: Investigate Current Project Structure**
```bash
# First, examine the current project structure
ls -la
find . -name "*.json" -o -name "*.tsx" -o -name "*.ts" | head -20
cat package.json | grep -A 10 -B 5 "dependencies"
```

### **Step 2: Create New Convex Project**
```bash
# Install Convex CLI if not already installed
npm install -g convex

# Initialize Convex in your existing project
npx convex dev --once

# This will:
# 1. Create convex/ folder
# 2. Generate convex.json config
# 3. Set up authentication
# 4. Create deployment

# Follow the prompts:
# - Create new project: YES
# - Project name: neuron-canvas
# - Team: your-team (or create new)
```

### **Step 3: Install Required Dependencies**
```bash
# Core RAG dependencies
npm install @convex-dev/rag

# PDF processing (hybrid approach)
npm install pdf-parse pdfjs-dist pdf2pic

# Sentence Transformers (free embeddings)
npm install @xenova/transformers

# AI SDK for Gemini
npm install @ai-sdk/google @ai-sdk/core

# Additional utilities
npm install sonner clsx tailwind-merge

# Development dependencies
npm install -D @types/pdf-parse
```

***

## 📋 **PHASE 2: COMPLETE DATABASE SCHEMA**

### **Create: `convex/schema.ts`**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User management
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_email", ["email"]),

  // Canvas/workspace management
  canvases: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    nodeCount: v.number(),
    lastModified: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

  // Node system (all node types)
  nodes: defineTable({
    canvasId: v.id("canvases"),
    userId: v.id("users"),
    type: v.union(
      v.literal("text"), 
      v.literal("document"), 
      v.literal("image"), 
      v.literal("video"), 
      v.literal("website")
    ),
    
    // Core properties
    name: v.string(),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    size: v.object({ width: v.number(), height: v.number() }),
    
    // Document-specific fields
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    
    // Text extraction and processing
    extractedText: v.optional(v.string()),
    textLength: v.optional(v.number()),
    processingStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("extracting"),
      v.literal("embedding"),
      v.literal("ready"),
      v.literal("error")
    )),
    processingError: v.optional(v.string()),
    
    // RAG integration
    embeddingGenerated: v.boolean(),
    chunkCount: v.optional(v.number()),
    lastProcessed: v.optional(v.number()),
    
    // Metadata
    metadata: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_canvas", ["canvasId"])
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["processingStatus"])
    .index("by_updated", ["updatedAt"]),

  // Connection system between nodes
  edges: defineTable({
    canvasId: v.id("canvases"),
    sourceNodeId: v.id("nodes"),
    targetNodeId: v.id("nodes"),
    edgeType: v.optional(v.string()),
    label: v.optional(v.string()),
    style: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_canvas", ["canvasId"])
    .index("by_source", ["sourceNodeId"])
    .index("by_target", ["targetNodeId"]),

  // Document chunks for RAG
  documentChunks: defineTable({
    nodeId: v.id("nodes"),
    canvasId: v.id("canvases"),
    chunkIndex: v.number(),
    content: v.string(),
    wordCount: v.number(),
    
    // Chunk boundaries
    startChar: v.number(),
    endChar: v.number(),
    
    // Metadata for retrieval
    metadata: v.object({
      fileName: v.string(),
      pageNumber: v.optional(v.number()),
      section: v.optional(v.string()),
      chunkType: v.string(), // "paragraph", "sentence", "semantic"
    }),
    
    // RAG fields (managed by Convex RAG component)
    embeddingId: v.optional(v.string()),
    lastEmbedded: v.optional(v.number()),
    
    createdAt: v.number(),
  }).index("by_node", ["nodeId"])
    .index("by_canvas", ["canvasId"])
    .index("by_embedding", ["embeddingId"]),

  // Workflow execution system
  workflows: defineTable({
    canvasId: v.id("canvases"),
    userId: v.id("users"),
    name: v.string(),
    
    // Connected nodes in workflow
    connectedNodeIds: v.array(v.id("nodes")),
    outputNodeId: v.optional(v.id("nodes")),
    
    // Execution context
    contextSummary: v.string(),
    totalTokensUsed: v.number(),
    processingTimeMs: v.number(),
    
    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("executing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    
    executedAt: v.number(),
    createdAt: v.number(),
  }).index("by_canvas", ["canvasId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Chat/conversation system
  chatMessages: defineTable({
    canvasId: v.id("canvases"),
    workflowId: v.optional(v.id("workflows")),
    userId: v.id("users"),
    
    // Message content
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    
    // RAG context tracking
    retrievedChunks: v.optional(v.array(v.id("documentChunks"))),
    contextScore: v.optional(v.number()),
    sourcesUsed: v.optional(v.array(v.string())),
    
    // AI model info
    model: v.optional(v.string()),
    tokenCount: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
    
    timestamp: v.number(),
  }).index("by_canvas", ["canvasId"])
    .index("by_workflow", ["workflowId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // File storage metadata
  fileUploads: defineTable({
    nodeId: v.id("nodes"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    
    // File information
    originalName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    
    // Processing status
    uploadStatus: v.union(
      v.literal("uploading"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processingLogs: v.optional(v.array(v.string())),
    
    createdAt: v.number(),
  }).index("by_node", ["nodeId"])
    .index("by_user", ["userId"])
    .index("by_status", ["uploadStatus"]),

  // System analytics and usage
  usageMetrics: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    
    // Usage counts
    documentsProcessed: v.number(),
    questionsAsked: v.number(),
    workflowsExecuted: v.number(),
    tokensUsed: v.number(),
    
    // Performance metrics
    avgProcessingTime: v.number(),
    successRate: v.number(),
    
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_date", ["date"]),
});
```

***

## 📋 **PHASE 3: CONVEX RAG CONFIGURATION**

### **Create: `convex/convex.config.ts`**
```typescript
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config";

const app = defineApp();
app.use(rag);

export default app;
```

### **Create: `.env.local`**
```
CONVEX_DEPLOYMENT=your-deployment-url-from-convex-dev
GEMINI_API_KEY=AIzaSyDHurY8leKbyNI41y94vWfgKs4AtlaIzis
NODE_ENV=development
```

***

## 📋 **PHASE 4: FREE SENTENCE TRANSFORMERS INTEGRATION**

### **Create: `src/services/embeddingService.ts`**
```typescript
import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js to run in browser
env.allowRemoteModels = true;
env.remoteURL = 'https://huggingface.co/';

class EmbeddingService {
  private static instance: EmbeddingService;
  private embedder: any = null;
  private isLoading = false;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  // Initialize the embedding model (run once)
  async initialize(): Promise<void> {
    if (this.embedder || this.isLoading) return;
    
    this.isLoading = true;
    console.log('Loading Sentence Transformer model...');
    
    try {
      // Use all-MiniLM-L6-v2 (384 dimensions, 23MB)
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      console.log('✅ Embedding model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Generate embeddings for text
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.initialize();
    }

    try {
      // Clean and prepare text
      const cleanText = text.trim().substring(0, 512); // Limit to 512 chars
      
      // Generate embedding
      const output = await this.embedder(cleanText, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Convert tensor to array
      const embedding = Array.from(output.data);
      
      console.log(`✅ Generated embedding (${embedding.length} dimensions)`);
      return embedding;
      
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  // Generate embeddings for multiple texts (batch processing)
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return embeddings;
  }

  // Calculate cosine similarity between two embeddings
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

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

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

export default EmbeddingService;
```

***

## 📋 **PHASE 5: HYBRID PDF PROCESSING SERVICE**

### **Create: `src/services/pdfProcessingService.ts`**
```typescript
import * as pdfjsLib from 'pdfjs-dist';
import pdfParse from 'pdf-parse';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface PDFProcessingResult {
  text: string;
  pageCount: number;
  wordCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
  };
  processingMethod: 'pdfjs' | 'pdf-parse' | 'hybrid';
  processingTimeMs: number;
}

export class PDFProcessingService {
  
  // Main processing method with hybrid approach
  static async extractTextFromPDF(file: File): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    let primaryResult: PDFProcessingResult | null = null;
    let fallbackResult: PDFProcessingResult | null = null;

    try {
      console.log('🔄 Starting PDF processing with hybrid approach...');
      
      // Method 1: PDF.js (primary - better for complex layouts)
      try {
        primaryResult = await this.extractWithPDFjs(file);
        console.log('✅ PDF.js extraction successful');
      } catch (error) {
        console.warn('⚠️ PDF.js extraction failed:', error);
      }

      // Method 2: pdf-parse (fallback - more reliable for simple PDFs)
      try {
        fallbackResult = await this.extractWithPdfParse(file);
        console.log('✅ pdf-parse extraction successful');
      } catch (error) {
        console.warn('⚠️ pdf-parse extraction failed:', error);
      }

      // Choose best result
      const result = this.selectBestResult(primaryResult, fallbackResult);
      
      if (!result) {
        throw new Error('Both PDF extraction methods failed');
      }

      result.processingTimeMs = Date.now() - startTime;
      console.log(`✅ PDF processing completed in ${result.processingTimeMs}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ PDF processing completely failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // PDF.js extraction method
  private static async extractWithPDFjs(file: File): Promise<PDFProcessingResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const pageTexts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str.trim())
        .filter(str => str.length > 0)
        .join(' ');
      
      if (pageText.trim()) {
        pageTexts.push(pageText);
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }
    }

    // Get PDF metadata
    const metadata = await pdf.getMetadata();
    
    return {
      text: fullText.trim(),
      pageCount: pdf.numPages,
      wordCount: fullText.split(/\s+/).length,
      metadata: {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        creator: metadata.info?.Creator,
        producer: metadata.info?.Producer,
        creationDate: metadata.info?.CreationDate,
      },
      processingMethod: 'pdfjs',
      processingTimeMs: 0, // Will be set by caller
    };
  }

  // pdf-parse extraction method
  private static async extractWithPdfParse(file: File): Promise<PDFProcessingResult> {
    const buffer = await file.arrayBuffer();
    const pdfData = await pdfParse(buffer);
    
    return {
      text: pdfData.text.trim(),
      pageCount: pdfData.numpages,
      wordCount: pdfData.text.split(/\s+/).length,
      metadata: {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        creator: pdfData.info?.Creator,
        producer: pdfData.info?.Producer,
        creationDate: pdfData.info?.CreationDate,
      },
      processingMethod: 'pdf-parse',
      processingTimeMs: 0, // Will be set by caller
    };
  }

  // Select the best extraction result
  private static selectBestResult(
    primary: PDFProcessingResult | null,
    fallback: PDFProcessingResult | null
  ): PDFProcessingResult | null {
    
    if (!primary && !fallback) return null;
    if (!primary) return { ...fallback!, processingMethod: 'pdf-parse' };
    if (!fallback) return { ...primary, processingMethod: 'pdfjs' };

    // Compare results and choose the better one
    const primaryScore = this.scoreExtractionResult(primary);
    const fallbackScore = this.scoreExtractionResult(fallback);

    console.log(`📊 Extraction scores - PDF.js: ${primaryScore}, pdf-parse: ${fallbackScore}`);

    if (primaryScore >= fallbackScore) {
      return { ...primary, processingMethod: primary.wordCount > fallback.wordCount ? 'pdfjs' : 'hybrid' };
    } else {
      return { ...fallback, processingMethod: 'hybrid' };
    }
  }

  // Score extraction result quality
  private static scoreExtractionResult(result: PDFProcessingResult): number {
    let score = 0;
    
    // Word count (more is generally better)
    score += Math.min(result.wordCount * 0.1, 100);
    
    // Text quality indicators
    const text = result.text;
    
    // Check for meaningful sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    score += Math.min(sentences.length * 2, 50);
    
    // Check for proper spacing (not all text jammed together)
    const avgWordLength = result.wordCount > 0 ? text.length / result.wordCount : 0;
    if (avgWordLength > 3 && avgWordLength < 15) score += 20;
    
    // Penalize if too many special characters (indicates poor extraction)
    const specialCharRatio = (text.match(/[^\w\s]/g) || []).length / text.length;
    if (specialCharRatio < 0.1) score += 10;
    
    return score;
  }

  // Intelligent text chunking with semantic boundaries
  static chunkText(text: string, maxChars: number = 500, overlap: number = 50): string[] {
    if (text.length <= maxChars) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChars;
      
      if (end >= text.length) {
        // Last chunk
        chunks.push(text.slice(start).trim());
        break;
      }

      // Try to break at sentence boundary
      let breakPoint = this.findSemanticBreakpoint(text, start, end);
      
      if (breakPoint === -1) {
        // No good break point found, use maxChars
        breakPoint = end;
      }

      const chunk = text.slice(start, breakPoint).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = Math.max(start + 1, breakPoint - overlap);
    }

    return chunks.filter(chunk => chunk.length > 20); // Filter out tiny chunks
  }

  // Find the best semantic breakpoint for chunking
  private static findSemanticBreakpoint(text: string, start: number, maxEnd: number): number {
    const searchArea = text.slice(start, maxEnd);
    
    // Priority 1: Sentence ending with period, exclamation, or question mark
    const sentenceEnds = ['.', '!', '?'];
    for (const punct of sentenceEnds) {
      const lastIndex = searchArea.lastIndexOf(punct);
      if (lastIndex > searchArea.length * 0.6) { // Don't break too early
        return start + lastIndex + 1;
      }
    }

    // Priority 2: Paragraph break (double newline)
    const paragraphBreak = searchArea.lastIndexOf('\n\n');
    if (paragraphBreak > searchArea.length * 0.5) {
      return start + paragraphBreak + 2;
    }

    // Priority 3: Single newline
    const lineBreak = searchArea.lastIndexOf('\n');
    if (lineBreak > searchArea.length * 0.6) {
      return start + lineBreak + 1;
    }

    // Priority 4: Word boundary
    const spaceIndex = searchArea.lastIndexOf(' ');
    if (spaceIndex > searchArea.length * 0.7) {
      return start + spaceIndex + 1;
    }

    // No good breakpoint found
    return -1;
  }
}
```

***

## 📋 **PHASE 6: COMPLETE RAG INTEGRATION**

### **Create: `convex/ragService.ts`**
```typescript
import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { google } from "@ai-sdk/google";
import { generateText } from "@ai-sdk/core";
import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Initialize RAG component with custom embedding dimensions
const rag = new RAG(components.rag, {
  embeddingDimension: 384, // all-MiniLM-L6-v2 dimensions
});

// Add document chunks to RAG system
export const addDocumentToRAG = action({
  args: { 
    nodeId: v.id("nodes"),
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
      // Get canvas ID from node
      const node = await ctx.runQuery(api.nodes.getNode, { nodeId });
      if (!node) throw new Error('Node not found');

      // Add each chunk to RAG system and database
      for (const chunk of chunks) {
        const chunkId = `${nodeId}_chunk_${chunk.chunkIndex}`;
        
        // Add to RAG component
        await rag.embed(ctx, {
          id: chunkId,
          text: chunk.content,
          embedding: chunk.embedding,
          metadata: {
            nodeId,
            fileName,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunks.length,
            canvasId: node.canvasId,
          }
        });
        
        // Store chunk in database
        await ctx.runMutation(api.ragService.createDocumentChunk, {
          nodeId,
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
        });
      }

      // Update node status
      await ctx.runMutation(api.nodes.updateProcessingStatus, {
        nodeId,
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
        nodeId,
        status: "error",
        processingError: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  },
});

// Search RAG system for relevant context
export const searchRAG = action({
  args: { 
    query: v.string(),
    queryEmbedding: v.array(v.number()),
    canvasId: v.id("canvases"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, queryEmbedding, canvasId, limit = 8 }) => {
    try {
      console.log(`🔍 Searching RAG system for: "${query.substring(0, 50)}..."`);
      
      // Search using embedding
      const results = await rag.search(ctx, queryEmbedding, limit * 2); // Get extra for filtering
      
      // Filter results to only include chunks from this canvas
      const relevantResults = results.filter(result => {
        return result.metadata?.canvasId === canvasId;
      });

      // Sort by relevance score and take top results
      const topResults = relevantResults
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);

      console.log(`✅ Found ${topResults.length} relevant chunks (avg score: ${
        topResults.reduce((sum, r) => sum + (r.score || 0), 0) / topResults.length || 0
      })`);

      return topResults.map(result => ({
        text: result.text,
        score: result.score || 0,
        metadata: result.metadata,
        chunkId: result.id,
      }));

    } catch (error) {
      console.error('❌ RAG search failed:', error);
      return [];
    }
  },
});

// Generate AI response with RAG context
export const generateRAGResponse = action({
  args: {
    userQuestion: v.string(),
    queryEmbedding: v.array(v.number()),
    canvasId: v.id("canvases"),
    connectedNodeIds: v.array(v.id("nodes")),
    userId: v.id("users"),
  },
  handler: async (ctx, { userQuestion, queryEmbedding, canvasId, connectedNodeIds, userId }) => {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Generating RAG response for: "${userQuestion.substring(0, 50)}..."`);
      
      // Search for relevant context
      const searchResults = await ctx.runAction(api.ragService.searchRAG, {
        query: userQuestion,
        queryEmbedding,
        canvasId,
        limit: 6,
      });

      // Get connected nodes for additional context
      const connectedNodes = await Promise.all(
        connectedNodeIds.map(id => ctx.runQuery(api.nodes.getNode, { id }))
      );

      // Build comprehensive context
      const ragContext = searchResults
        .filter(result => result.score > 0.1) // Filter low-relevance results
        .map(result => 
          `[Source: ${result.metadata?.fileName}]\n${result.text}`
        ).join('\n\n---\n\n');

      const nodeContext = connectedNodes
        .filter(node => node != null)
        .map(node => 
          `[${node!.type} Node: ${node!.name}]\n${node!.content || node!.extractedText || 'No content'}`
        ).join('\n\n');

      // Build system prompt
      const systemPrompt = `You are Neuron AI, an intelligent learning assistant that helps users understand and connect their knowledge.

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
- Focus on helping the user learn and understand

USER QUESTION: ${userQuestion}`;

      // Generate response using Gemini Flash
      const model = google('gemini-1.5-flash', {
        apiKey: process.env.GEMINI_API_KEY,
      });

      const result = await generateText({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion }
        ],
        maxTokens: 1200,
        temperature: 0.1, // Low temperature for factual responses
      });

      const processingTime = Date.now() - startTime;

      // Save chat message
      const messageId = await ctx.runMutation(api.ragService.createChatMessage, {
        canvasId,
        userId,
        role: "assistant",
        content: result.text,
        retrievedChunks: searchResults.map(r => r.chunkId).filter(Boolean),
        contextScore: searchResults.length > 0 ? 
          searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length : 0,
        sourcesUsed: [...new Set(searchResults.map(r => r.metadata?.fileName).filter(Boolean))],
        model: "gemini-1.5-flash",
        tokenCount: result.usage?.totalTokens || 0,
        processingTimeMs: processingTime,
      });

      console.log(`✅ RAG response generated in ${processingTime}ms using ${searchResults.length} chunks`);

      return {
        response: result.text,
        messageId,
        contextsUsed: searchResults.length,
        sourcesReferenced: [...new Set(searchResults.map(r => r.metadata?.fileName).filter(Boolean))],
        avgRelevanceScore: searchResults.length > 0 ? 
          searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length : 0,
        processingTimeMs: processingTime,
      };

    } catch (error) {
      console.error('❌ RAG response generation failed:', error);
      
      // Save error message
      await ctx.runMutation(api.ragService.createChatMessage, {
        canvasId,
        userId,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your question. Please try rephrasing or check if your documents are properly loaded.",
        processingTimeMs: Date.now() - startTime,
      });

      throw error;
    }
  },
});

// Database mutations
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documentChunks", {
      ...args,
      lastEmbedded: Date.now(),
      createdAt: Date.now(),
    });
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
```

***

## 📋 **PHASE 7: ENHANCED DOCUMENT PROCESSING SERVICE**

### **Update: `src/services/enhancedDocumentService.ts`**
```typescript
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { PDFProcessingService, type PDFProcessingResult } from './pdfProcessingService';
import EmbeddingService from './embeddingService';
import { toast } from 'sonner';

export interface DocumentProcessingProgress {
  stage: 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface ProcessedDocument {
  fileName: string;
  fileSize: number;
  textContent: string;
  fileUrl: string;
  chunksCreated: number;
  processingTimeMs: number;
  metadata: any;
}

export class EnhancedDocumentService {
  
  // Main document processing pipeline
  static async processDocument(
    file: File,
    nodeId: string,
    canvasId: string,
    convex: ConvexReactClient,
    onProgress: (progress: DocumentProcessingProgress) => void
  ): Promise<ProcessedDocument> {
    
    const startTime = Date.now();
    let uploadedFileUrl = '';
    
    try {
      // Stage 1: File Upload
      onProgress({
        stage: 'uploading',
        progress: 5,
        message: 'Uploading file to secure storage...'
      });

      uploadedFileUrl = await this.uploadToConvexStorage(file, convex);
      
      onProgress({
        stage: 'uploading', 
        progress: 15,
        message: 'File uploaded successfully'
      });

      // Stage 2: Text Extraction
      onProgress({
        stage: 'extracting',
        progress: 20,
        message: 'Extracting text from PDF...'
      });

      const extractionResult = await PDFProcessingService.extractTextFromPDF(file);
      
      onProgress({
        stage: 'extracting',
        progress: 40,
        message: `Extracted ${extractionResult.wordCount} words from ${extractionResult.pageCount} pages`
      });

      // Stage 3: Text Chunking
      onProgress({
        stage: 'chunking',
        progress: 45,
        message: 'Splitting document into semantic chunks...'
      });

      const chunks = PDFProcessingService.chunkText(extractionResult.text, 500, 50);
      
      onProgress({
        stage: 'chunking',
        progress: 55,
        message: `Created ${chunks.length} intelligent chunks`
      });

      // Stage 4: Initialize Embedding Service
      onProgress({
        stage: 'embedding',
        progress: 60,
        message: 'Loading AI embedding model...'
      });

      const embeddingService = EmbeddingService.getInstance();
      await embeddingService.initialize();

      // Stage 5: Generate Embeddings
      onProgress({
        stage: 'embedding',
        progress: 65,
        message: 'Generating semantic embeddings...'
      });

      const embeddings = await embeddingService.generateBatchEmbeddings(chunks);
      
      onProgress({
        stage: 'embedding',
        progress: 80,
        message: `Generated ${embeddings.length} embeddings`
      });

      // Stage 6: Index in RAG System
      onProgress({
        stage: 'indexing',
        progress: 85,
        message: 'Adding to knowledge base...'
      });

      const chunksWithEmbeddings = chunks.map((content, index) => ({
        content,
        chunkIndex: index,
        embedding: embeddings[index],
      }));

      await convex.action(api.ragService.addDocumentToRAG, {
        nodeId,
        chunks: chunksWithEmbeddings,
        fileName: file.name,
      });

      // Stage 7: Complete
      onProgress({
        stage: 'complete',
        progress: 100,
        message: 'Document processing complete!'
      });

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Document processed successfully in ${processingTime}ms`);
      
      toast.success(`Successfully processed ${file.name}`, {
        description: `${chunks.length} chunks indexed for AI search`
      });

      return {
        fileName: file.name,
        fileSize: file.size,
        textContent: extractionResult.text,
        fileUrl: uploadedFileUrl,
        chunksCreated: chunks.length,
        processingTimeMs: processingTime,
        metadata: extractionResult.metadata,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.error('❌ Document processing failed:', error);
      
      onProgress({
        stage: 'error',
        progress: 0,
        message: 'Processing failed',
        error: errorMessage
      });

      toast.error('Document processing failed', {
        description: errorMessage
      });

      // Update node with error status
      try {
        await convex.mutation(api.nodes.updateProcessingStatus, {
          nodeId,
          status: "error",
          processingError: errorMessage,
        });
      } catch (updateError) {
        console.error('Failed to update node error status:', updateError);
      }

      throw error;
    }
  }

  // Upload file to Convex storage
  private static async uploadToConvexStorage(file: File, convex: ConvexReactClient): Promise<string> {
    try {
      // Generate upload URL
      const uploadUrl = await convex.mutation(api.files.generateUploadUrl);
      
      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { storageId } = await uploadResponse.json();
      
      // Get public URL
      const fileUrl = await convex.query(api.files.getFileUrl, { storageId });
      
      return fileUrl;

    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Validate file before processing
  static validateFile(file: File): { valid: boolean; error?: string } {
    // File type validation
    if (file.type !== 'application/pdf') {
      return { 
        valid: false, 
        error: 'Only PDF files are supported. Please convert your document to PDF first.' 
      };
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds the 10MB limit.` 
      };
    }

    // File name validation
    if (file.name.length > 100) {
      return { 
        valid: false, 
        error: 'File name is too long. Please use a shorter name.' 
      };
    }

    return { valid: true };
  }

  // Get processing statistics
  static async getProcessingStats(canvasId: string, convex: ConvexReactClient) {
    try {
      const nodes = await convex.query(api.nodes.getNodesByCanvas, { canvasId });
      const documentNodes = nodes.filter(node => node.type === 'document');
      
      const stats = {
        totalDocuments: documentNodes.length,
        processedDocuments: documentNodes.filter(node => node.processingStatus === 'ready').length,
        processingDocuments: documentNodes.filter(node => 
          ['uploading', 'extracting', 'embedding'].includes(node.processingStatus || '')
        ).length,
        errorDocuments: documentNodes.filter(node => node.processingStatus === 'error').length,
        totalChunks: documentNodes.reduce((sum, node) => sum + (node.chunkCount || 0), 0),
        totalWords: documentNodes.reduce((sum, node) => sum + (node.textLength || 0), 0),
      };

      return stats;
      
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return null;
    }
  }
}
```

***

## 📋 **PHASE 8: REQUIRED CONVEX API FUNCTIONS**

### **Create: `convex/files.ts`**
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL from storage ID
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
```

### **Create: `convex/nodes.ts`**
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get single node
export const getNode = query({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, { nodeId }) => {
    return await ctx.db.get(nodeId);
  },
});

// Get nodes by canvas
export const getNodesByCanvas = query({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    return await ctx.db
      .query("nodes")
      .withIndex("by_canvas", (q) => q.eq("canvasId", canvasId))
      .collect();
  },
});

// Update node processing status
export const updateProcessingStatus = mutation({
  args: {
    nodeId: v.id("nodes"),
    status: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("extracting"),
      v.literal("embedding"),
      v.literal("ready"),
      v.literal("error")
    ),
    processingError: v.optional(v.string()),
    chunkCount: v.optional(v.number()),
    embeddingGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, { nodeId, ...updates }) => {
    return await ctx.db.patch(nodeId, {
      ...updates,
      updatedAt: Date.now(),
      lastProcessed: Date.now(),
    });
  },
});
```

***

## 🎯 **PHASE 9: FINAL INTEGRATION COMMANDS**

### **1. Push Convex Schema**
```bash
npx convex dev
# This will:
# - Deploy your schema
# - Set up RAG component
# - Generate API types
```

### **2. Start Development Server**
```bash
npm run dev
```

### **3. Test the Complete Pipeline**
```bash
# In browser console, test embedding service:
const embeddingService = EmbeddingService.getInstance();
await embeddingService.initialize();
const embedding = await embeddingService.generateEmbedding("Test document processing");
console.log('Embedding generated:', embedding.length, 'dimensions');
```

***

## 🎯 **SUCCESS CRITERIA & VALIDATION**

### **Immediate Tests (Next 30 Minutes):**
1. ✅ **Upload PDF** → Processing pipeline starts automatically
2. ✅ **Text Extraction** → Both PDF.js and pdf-parse work
3. ✅ **Chunking** → Intelligent semantic chunks created
4. ✅ **Embeddings** → Free Sentence Transformers generate 384D vectors
5. ✅ **RAG Indexing** → Chunks stored in Convex RAG system
6. ✅ **Search** → Semantic search returns relevant chunks

### **Advanced Tests (Next Hour):**
1. ✅ **Ask Questions** → Gemini generates contextual answers
2. ✅ **Source Attribution** → AI references specific documents
3. ✅ **Multi-Document** → Search across multiple uploaded PDFs
4. ✅ **Error Handling** → Graceful failures with clear messages
5. ✅ **Performance** → Complete pipeline in <30 seconds
6. ✅ **UI Integration** → Seamless canvas experience

***

## 💎 **CRITICAL SUCCESS FACTORS**

1. **Zero Configuration** - Everything works out of the box
2. **100% Free** - No API costs for embeddings
3. **Production Ready** - Handles edge cases gracefully
4. **Lightning Fast** - Local embeddings, optimized chunking
5. **Investor Demo Perfect** - Flawless user experience

**This implementation will transform Neuron from a canvas tool into an intelligent knowledge processing system that rivals ChatGPT, Notion, and specialized RAG platforms. Users will upload documents and immediately get AI-powered insights based on their own knowledge base.**

**Execute this implementation with absolute precision. This is the core differentiator that makes Neuron the future of learning. 🌟**

**Start with Phase 1 and work through sequentially. Each phase builds on the previous one. Report progress and any issues immediately.**
