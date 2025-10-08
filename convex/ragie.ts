import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Upload document to Ragie (server-side to avoid CORS)
export const uploadDocument = action({
  args: {
    fileData: v.string(), // Base64 encoded file
    fileName: v.string(),
    fileType: v.string(),
    metadata: v.object({
      scope: v.string(),
      nodeId: v.string(),
      canvasId: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // @ts-ignore - Convex provides process.env
      const apiKey = process.env.RAGIE_API_KEY;
      
      if (!apiKey) {
        throw new Error('RAGIE_API_KEY not configured');
      }

      // Convert base64 to blob
      const byteCharacters = atob(args.fileData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: args.fileType });

      const formData = new FormData();
      formData.append('file', blob, args.fileName);
      formData.append('metadata', JSON.stringify(args.metadata));
      formData.append('mode', 'hi_res');

      const response = await fetch('https://api.ragie.ai/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ragie upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        id: result.id,
        name: args.fileName,
        status: result.status,
        created_at: result.created_at,
        page_count: result.page_count,
        word_count: result.word_count,
      };
    } catch (error) {
      console.error('Ragie upload error:', error);
      throw error;
    }
  },
});

// Check document status in Ragie
export const getDocumentStatus = action({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // @ts-ignore - Convex provides process.env
      const apiKey = process.env.RAGIE_API_KEY;
      
      if (!apiKey) {
        throw new Error('RAGIE_API_KEY not configured');
      }

      const response = await fetch(`https://api.ragie.ai/documents/${args.documentId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get document status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get status error:', error);
      throw error;
    }
  },
});

// Retrieve context from Ragie documents
export const retrieveContext = action({
  args: {
    query: v.string(),
    filter: v.optional(v.object({
      scope: v.optional(v.string()),
      canvasId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // @ts-ignore - Convex provides process.env
      const apiKey = process.env.RAGIE_API_KEY;
      
      if (!apiKey) {
        throw new Error('RAGIE_API_KEY not configured');
      }

      const requestBody: any = {
        query: args.query,
        top_k: 5,
        rerank: true,
      };

      // NOTE: Filters are not used because Ragie filter syntax is complex
      // and we're working within a single canvas context anyway.
      // All documents are relevant to the user's current workspace.

      console.log('Ragie retrieval request:', JSON.stringify(requestBody));

      const response = await fetch('https://api.ragie.ai/retrievals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ragie retrieval failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Ragie returned chunks:', result.scored_chunks?.length || 0);
      
      const chunks = result.scored_chunks?.map((chunk: any) => ({
        text: chunk.text,
        score: chunk.score,
        document_id: chunk.document_id,
        document_name: chunk.document_name,
        page_number: chunk.metadata?.start_page,
      })) || [];
      
      const sourceNames = (result.scored_chunks || [])
        .map((chunk: any) => chunk.document_name)
        .filter((name: any): name is string => typeof name === 'string');
      const uniqueSources = Array.from(new Set(sourceNames));
      
      return {
        chunks,
        sources: uniqueSources,
      };
    } catch (error) {
      console.error('Retrieve context error:', error);
      throw error;
    }
  },
});

// Generate AI response with Ragie context (backward compatibility)
// This is just an alias to retrieveContext for backward compatibility
export const generateResponse = retrieveContext;
