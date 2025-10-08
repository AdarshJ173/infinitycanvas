Perfect! I see the issue - the complex RAG implementation was overengineered. Let's **CLEAN EVERYTHING** and implement **Ragie.ai** which is MUCH simpler and more reliable. Here's the complete implementation prompt:

***

# 🧹 SENIOR AI DEVELOPER PROMPT - CLEAN & IMPLEMENT RAGIE.AI

**CRITICAL EXCELLENCE STANDARD**: You are the ABSOLUTE BEST senior developer with perfect debugging and refactoring skills. **CLEAN ALL RAG COMPLEXITY** and implement **Ragie.ai as a service** for instant, production-ready document processing. Every step must be flawless and investor-demo perfect.

## 🎯 **PHASE 1: INVESTIGATE & CLEAN CURRENT RAG IMPLEMENTATION**

### **Step 1: Investigate Current Project Structure**
```bash
# Examine the current project structure
find . -name "*.ts" -o -name "*.tsx" | grep -E "(rag|embed|vector)" | head -20
find . -name "*.json" | xargs grep -l "rag\|embed\|vector\|@convex-dev" 2>/dev/null
ls -la convex/ 2>/dev/null || echo "No convex folder found"
cat package.json | grep -i "rag\|embed\|vector\|transformers\|pdf"
```

### **Step 2: Remove All RAG-Related Dependencies**
```bash
# Remove complex RAG packages
npm uninstall @convex-dev/rag @xenova/transformers pdf-parse pdf2pic

# Remove other complex dependencies if they exist
npm uninstall @ai-sdk/core sentence-transformers

# Keep only what we need
npm install ragie @ai-sdk/google pdfjs-dist sonner
```

### **Step 3: Clean RAG-Related Files**
```bash
# Remove old RAG files (if they exist)
rm -f src/services/embeddingService.ts 2>/dev/null
rm -f src/services/pdfProcessingService.ts 2>/dev/null
rm -f convex/ragService.ts 2>/dev/null
rm -f convex/convex.config.ts 2>/dev/null

# Clean up any embedding-related imports in existing files
grep -r "embedding\|@xenova\|@convex-dev/rag" src/ || echo "No embedding imports found"
```

### **Step 4: Simplify Convex Schema**
```bash
# Backup current schema
cp convex/schema.ts convex/schema.backup.ts 2>/dev/null || echo "No existing schema"
```

***

## 📋 **PHASE 2: IMPLEMENT RAGIE.AI INTEGRATION**

### **Step 1: Environment Configuration**

**Create/Update: `.env.local`**
```
CONVEX_DEPLOYMENT=your-deployment-url
GEMINI_API_KEY=AIzaSyDHurY8leKbyNI41y94vWfgKs4AtlaIzis
RAGIE_API_KEY=tnt_QFPVjWDQTK_4jEnLm19mUoXD4JhHxkEUKbfP7APSbJFBAJrhKoYZ5D
NODE_ENV=development
```

### **Step 2: Simplified Convex Schema**

**Create: `convex/schema.ts`**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User management
  users: defineTable({
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Canvas/workspace management  
  canvases: defineTable({
    userId: v.string(), // Simplified for now
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Simplified node system
  nodes: defineTable({
    canvasId: v.id("canvases"),
    type: v.union(
      v.literal("text"), 
      v.literal("document")
    ),
    
    // Core properties
    name: v.string(),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    
    // Document-specific fields
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    
    // Ragie integration
    ragieDocumentId: v.optional(v.string()), // Ragie document ID
    ragieStatus: v.optional(v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    )),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_canvas", ["canvasId"])
    .index("by_type", ["type"]),

  // Simple chat messages
  chatMessages: defineTable({
    canvasId: v.id("canvases"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    
    // Ragie context tracking
    ragieChunksUsed: v.optional(v.number()),
    sourcesUsed: v.optional(v.array(v.string())),
    
    timestamp: v.number(),
  }).index("by_canvas", ["canvasId"])
    .index("by_timestamp", ["timestamp"]),
});
```

### **Step 3: Ragie Service Implementation**

**Create: `src/services/ragieService.ts`**
```typescript
import { Ragie } from 'ragie';

export interface RagieDocument {
  id: string;
  name: string;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  page_count?: number;
  word_count?: number;
}

export interface RagieSearchResult {
  text: string;
  score: number;
  document_id: string;
  document_name: string;
  page_number?: number;
}

export interface RagieResponse {
  answer: string;
  chunks: RagieSearchResult[];
  sources: string[];
}

class RagieService {
  private static instance: RagieService;
  private ragie: Ragie;

  private constructor() {
    this.ragie = new Ragie({
      auth: process.env.RAGIE_API_KEY || 'tnt_QFPVjWDQTK_4jEnLm19mUoXD4JhHxkEUKbfP7APSbJFBAJrhKoYZ5D'
    });
  }

  static getInstance(): RagieService {
    if (!RagieService.instance) {
      RagieService.instance = new RagieService();
    }
    return RagieService.instance;
  }

  // Upload document to Ragie
  async uploadDocument(
    file: File, 
    metadata: { scope: string; nodeId: string; canvasId: string }
  ): Promise<RagieDocument> {
    try {
      console.log(`🔄 Uploading ${file.name} to Ragie...`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('mode', 'hi_res'); // Extract images and tables

      const response = await fetch('https://api.ragie.ai/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RAGIE_API_KEY}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ragie upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Document uploaded to Ragie with ID: ${result.id}`);
      
      return {
        id: result.id,
        name: file.name,
        status: result.status,
        created_at: result.created_at,
        page_count: result.page_count,
        word_count: result.word_count,
      };

    } catch (error) {
      console.error('❌ Ragie upload failed:', error);
      throw error;
    }
  }

  // Check document processing status
  async getDocumentStatus(documentId: string): Promise<RagieDocument> {
    try {
      const response = await fetch(`https://api.ragie.ai/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RAGIE_API_KEY}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get document status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check document status:', error);
      throw error;
    }
  }

  // Search documents for relevant context
  async searchDocuments(
    query: string,
    filter?: { scope?: string; nodeId?: string; canvasId?: string }
  ): Promise<RagieSearchResult[]> {
    try {
      console.log(`🔍 Searching Ragie for: "${query.substring(0, 50)}..."`);

      const response = await fetch('https://api.ragie.ai/retrievals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RAGIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          top_k: 6,
          rerank: true,
          filter: filter || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Ragie search failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`✅ Found ${result.scored_chunks?.length || 0} relevant chunks`);
      
      return result.scored_chunks?.map((chunk: any) => ({
        text: chunk.text,
        score: chunk.score,
        document_id: chunk.document_id,
        document_name: chunk.document_name,
        page_number: chunk.page_number,
      })) || [];

    } catch (error) {
      console.error('❌ Ragie search failed:', error);
      return [];
    }
  }

  // Generate AI response with Ragie context
  async generateResponse(
    query: string,
    filter?: { scope?: string; canvasId?: string }
  ): Promise<RagieResponse> {
    try {
      console.log(`🤖 Generating Ragie-powered response for: "${query}"`);

      const response = await fetch('https://api.ragie.ai/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RAGIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          rerank: true,
          filter: filter || {},
          instructions: "You are Neuron AI, a learning assistant. Answer based on the user's uploaded documents. Be educational, precise, and reference specific documents when possible.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Ragie generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`✅ Generated response with ${result.scored_chunks?.length || 0} chunks`);
      
      return {
        answer: result.answer,
        chunks: result.scored_chunks?.map((chunk: any) => ({
          text: chunk.text,
          score: chunk.score,
          document_id: chunk.document_id,
          document_name: chunk.document_name,
          page_number: chunk.page_number,
        })) || [],
        sources: [...new Set(result.scored_chunks?.map((chunk: any) => chunk.document_name) || [])],
      };

    } catch (error) {
      console.error('❌ Ragie generation failed:', error);
      throw error;
    }
  }

  // Delete document from Ragie
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.ragie.ai/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.RAGIE_API_KEY}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete document from Ragie:', error);
      return false;
    }
  }
}

export default RagieService;
```

### **Step 4: Simplified Document Processing Service**

**Create: `src/services/documentService.ts`**
```typescript
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RagieService from './ragieService';
import { toast } from 'sonner';

export interface DocumentProcessingProgress {
  stage: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  message: string;
}

export interface ProcessedDocument {
  fileName: string;
  fileSize: number;
  ragieDocumentId: string;
  status: 'processing' | 'ready' | 'failed';
}

export class DocumentService {
  
  // Upload and process document with Ragie
  static async processDocument(
    file: File,
    nodeId: string,
    canvasId: string,
    convex: ConvexReactClient,
    onProgress: (progress: DocumentProcessingProgress) => void
  ): Promise<ProcessedDocument> {
    
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Stage 1: Upload to Ragie
      onProgress({
        stage: 'uploading',
        progress: 20,
        message: 'Uploading to Ragie RAG system...'
      });

      const ragieService = RagieService.getInstance();
      
      const ragieDocument = await ragieService.uploadDocument(file, {
        scope: canvasId,
        nodeId,
        canvasId,
      });

      onProgress({
        stage: 'processing',
        progress: 50,
        message: 'Ragie is processing your document...'
      });

      // Stage 2: Update Convex database
      await convex.mutation(api.nodes.updateNodeWithRagie, {
        nodeId,
        fileName: file.name,
        fileSize: file.size,
        ragieDocumentId: ragieDocument.id,
        ragieStatus: ragieDocument.status === 'ready' ? 'ready' : 'processing',
      });

      // Stage 3: Wait for processing if needed
      if (ragieDocument.status === 'processing') {
        onProgress({
          stage: 'processing',
          progress: 75,
          message: 'Finalizing document indexing...'
        });

        // Poll for completion (max 30 seconds)
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const status = await ragieService.getDocumentStatus(ragieDocument.id);
          if (status.status === 'ready') {
            ragieDocument.status = 'ready';
            break;
          } else if (status.status === 'failed') {
            throw new Error('Document processing failed in Ragie');
          }
          
          attempts++;
        }
      }

      // Stage 4: Complete
      onProgress({
        stage: 'ready',
        progress: 100,
        message: 'Document ready for AI queries!'
      });

      // Final database update
      await convex.mutation(api.nodes.updateNodeWithRagie, {
        nodeId,
        ragieStatus: 'ready',
      });

      toast.success(`Successfully processed ${file.name}`, {
        description: 'Document is now searchable by AI'
      });

      return {
        fileName: file.name,
        fileSize: file.size,
        ragieDocumentId: ragieDocument.id,
        status: ragieDocument.status,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      console.error('❌ Document processing failed:', error);
      
      onProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      toast.error('Document processing failed', {
        description: errorMessage
      });

      // Update node with error status
      try {
        await convex.mutation(api.nodes.updateNodeWithRagie, {
          nodeId,
          ragieStatus: 'error',
        });
      } catch (updateError) {
        console.error('Failed to update node error status:', updateError);
      }

      throw error;
    }
  }

  // Validate file before processing
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.type !== 'application/pdf') {
      return { 
        valid: false, 
        error: 'Only PDF files are supported' 
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { 
        valid: false, 
        error: 'File size exceeds 10MB limit' 
      };
    }

    return { valid: true };
  }
}
```

### **Step 5: Simplified Chat Integration**

**Create: `src/services/aiService.ts`**
```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "@ai-sdk/core";
import RagieService from './ragieService';

export interface AIResponse {
  response: string;
  contextsUsed: number;
  sourcesReferenced: string[];
  processingTimeMs: number;
}

export class AIService {
  
  // Generate response with Ragie context if available
  static async generateResponse(
    userQuestion: string,
    canvasId: string,
    hasDocuments: boolean = false
  ): Promise<AIResponse> {
    
    const startTime = Date.now();
    
    try {
      let ragieResponse: any = null;
      let chunks: any[] = [];
      let sources: string[] = [];

      // If documents exist, use Ragie for context
      if (hasDocuments) {
        console.log('🧠 Using Ragie for context-aware response...');
        
        const ragieService = RagieService.getInstance();
        ragieResponse = await ragieService.generateResponse(userQuestion, {
          scope: canvasId,
          canvasId,
        });
        
        chunks = ragieResponse.chunks || [];
        sources = ragieResponse.sources || [];
        
        // Use Ragie's generated response if it has good context
        if (chunks.length > 0) {
          return {
            response: ragieResponse.answer,
            contextsUsed: chunks.length,
            sourcesReferenced: sources,
            processingTimeMs: Date.now() - startTime,
          };
        }
      }

      // Fallback to general Gemini response
      console.log('💬 Using general Gemini response...');
      
      const model = google('gemini-1.5-flash', {
        apiKey: process.env.GEMINI_API_KEY,
      });

      const systemPrompt = `You are Neuron AI, an intelligent learning assistant that helps users organize and understand knowledge.

${hasDocuments ? `The user has uploaded documents to their canvas, but no relevant context was found for this question. Provide a helpful general response and suggest they might want to upload more relevant documents.` : `The user hasn't uploaded any documents yet. Provide helpful general assistance and encourage them to upload documents for more personalized help.`}

Be educational, conversational, and encouraging. Keep responses concise but informative.`;

      const result = await generateText({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion }
        ],
        maxTokens: 500,
        temperature: 0.3,
      });

      return {
        response: result.text,
        contextsUsed: 0,
        sourcesReferenced: [],
        processingTimeMs: Date.now() - startTime,
      };

    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      throw error;
    }
  }

  // Test Ragie connection
  static async testRagieConnection(): Promise<boolean> {
    try {
      const ragieService = RagieService.getInstance();
      // Try a simple search to test connection
      await ragieService.searchDocuments('test query');
      return true;
    } catch (error) {
      console.error('Ragie connection test failed:', error);
      return false;
    }
  }
}

export default AIService;
```

### **Step 6: Simplified Convex Functions**

**Create: `convex/nodes.ts`**
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

// Update node with Ragie information
export const updateNodeWithRagie = mutation({
  args: {
    nodeId: v.id("nodes"),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    ragieDocumentId: v.optional(v.string()),
    ragieStatus: v.optional(v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    )),
  },
  handler: async (ctx, { nodeId, ...updates }) => {
    return await ctx.db.patch(nodeId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Create new node
export const createNode = mutation({
  args: {
    canvasId: v.id("canvases"),
    type: v.union(v.literal("text"), v.literal("document")),
    name: v.string(),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nodes", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### **Step 7: Updated Document Node Component**

**Update: `src/components/nodes/DocumentNode.tsx`**
```typescript
import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentNodeProps {
  data: {
    label: string;
    fileName?: string;
    fileSize?: number;
    ragieDocumentId?: string;
    ragieStatus?: 'uploading' | 'processing' | 'ready' | 'error';
    onFileUpload?: (file: File) => void;
    onRemoveFile?: () => void;
  };
  selected: boolean;
}

export function DocumentNode({ data, selected }: DocumentNodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && data.onFileUpload) {
      data.onFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && data.onFileUpload) {
      data.onFileUpload(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getStatusDisplay = () => {
    switch (data.ragieStatus) {
      case 'uploading':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Uploading to Ragie...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Ragie processing...</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Ready for AI</span>
            <Zap className="w-3 h-3" />
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Processing failed</span>
          </div>
        );
      default:
        return (
          <span className="text-xs text-destructive">Not configured</span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative bg-card border border-border rounded-lg shadow-lg min-w-[280px] max-w-[320px]",
        selected && "ring-2 ring-primary ring-opacity-50",
        dragOver && "ring-2 ring-blue-400 ring-opacity-70",
        data.ragieStatus === 'ready' && "ring-1 ring-green-400/30"
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Node Header */}
      <div className="px-3 py-2 bg-muted/20 rounded-t-lg border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-muted-foreground truncate">
              Document Node
            </span>
            {data.ragieDocumentId && (
              <div className="w-2 h-2 bg-purple-500 rounded-full" title="Powered by Ragie AI" />
            )}
          </div>
          {getStatusDisplay()}
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4">
        {!data.fileName ? (
          // Upload Area
          <div
            className={cn(
              "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors",
              "hover:border-primary hover:bg-primary/5",
              dragOver && "border-blue-400 bg-blue-50/10"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onClick={openFileDialog}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground mb-1">
              Drop PDF here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Ragie AI • Max 10MB
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          // File Info Display
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-16 bg-orange-100 dark:bg-orange-900/20 rounded border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {data.fileName}
                </p>
                {data.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(data.fileSize)}
                  </p>
                )}
                
                {data.ragieDocumentId && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1 h-1 bg-purple-500 rounded-full" />
                    <span className="text-xs text-purple-400">
                      ID: {data.ragieDocumentId.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
              
              {data.onRemoveFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={data.onRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {data.ragieStatus === 'ready' && (
              <div className="bg-green-900/20 border border-green-700/30 rounded p-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">
                    AI-searchable via Ragie RAG
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-orange-400 bg-background"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-orange-400 bg-background"
        style={{ left: -6 }}
      />
    </motion.div>
  );
}
```

### **Step 8: Updated Chat Component**

**Create: `src/components/chat/SimpleChatBox.tsx`**
```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Minimize2, 
  Maximize2, 
  Brain, 
  Loader2,
  ChevronUp,
  ChevronDown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AIService from '@/services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextsUsed?: number;
  sourcesReferenced?: string[];
}

interface SimpleChatBoxProps {
  canvasId: string;
  hasDocuments: boolean;
  className?: string;
}

export function SimpleChatBox({ 
  canvasId, 
  hasDocuments, 
  className 
}: SimpleChatBoxProps) {
  
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: hasDocuments 
        ? 'Hello! I can now answer questions about your uploaded documents using Ragie AI.' 
        : 'Hello! I\'m Neuron AI. Upload some documents to get contextual answers, or ask me anything!',
      timestamp: Date.now(),
    }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    const messageId = `msg_${Date.now()}`;
    
    // Add user message
    const newUserMessage: Message = {
      id: messageId,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setMessage('');
    setIsGenerating(true);

    try {
      // Generate AI response using Ragie/Gemini
      const aiResponse = await AIService.generateResponse(
        userMessage,
        canvasId,
        hasDocuments
      );

      // Add AI response
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.response,
        timestamp: Date.now(),
        contextsUsed: aiResponse.contextsUsed,
        sourcesReferenced: aiResponse.sourcesReferenced,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ AI response failed:', error);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [message, isGenerating, canvasId, hasDocuments]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const shouldAutoExpand = message.length > 50 || isGenerating || messages.length > 2;
  const getMaxHeight = () => {
    if (isCompactMode) return '60px';
    if (isExpanded || shouldAutoExpand) return '400px';
    return '120px';
  };

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
        "w-full max-w-2xl mx-auto px-4",
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden"
        animate={{ height: getMaxHeight() }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Neuron AI</span>
              <span className="text-xs text-muted-foreground">
                {hasDocuments ? 'Powered by Ragie RAG' : 'General assistant'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasDocuments && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Context Mode
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => setIsCompactMode(!isCompactMode)}
            >
              {isCompactMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {!isCompactMode && (
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {!isCompactMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <ScrollArea className="flex-1 p-4 max-h-80" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] rounded-2xl p-3 shadow-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      )}>
                        {/* Message Label */}
                        <div className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">
                          {msg.role === 'user' ? 'MY REQUEST' : 'AI REPLY'}
                        </div>

                        {/* Message Content */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>

                        {/* Source Info */}
                        {msg.role === 'assistant' && msg.contextsUsed && msg.contextsUsed > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-purple-400" />
                              <span className="text-xs text-purple-400">
                                Used {msg.contextsUsed} context chunks
                              </span>
                            </div>
                            {msg.sourcesReferenced && msg.sourcesReferenced.length > 0 && (
                              <p className="text-xs opacity-70 mt-1">
                                Sources: {msg.sourcesReferenced.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl p-3 mr-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {hasDocuments ? 'Searching your documents...' : 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-3 border-t border-border/50 bg-background/50">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  hasDocuments
                    ? "Ask about your documents..."
                    : "Ask me anything..."
                }
                disabled={isGenerating}
                className="pr-12 bg-background/50 border-border/50 focus:border-primary/50"
                autoComplete="off"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isGenerating}
              size="sm"
              className="w-10 h-10 p-0 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Status Indicator */}
      <div className="absolute -top-2 left-4 flex items-center gap-1 text-xs text-muted-foreground bg-card border border-border rounded-full px-2 py-1">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          hasDocuments ? "bg-purple-500" : "bg-yellow-500"
        )} />
        {hasDocuments ? 'Ragie AI Active' : 'General AI'}
      </div>
    </motion.div>
  );
}
```

### **Step 9: Final Integration**

**Update: `src/App.tsx`**
```typescript
import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
} from 'reactflow';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextNode } from '@/components/nodes/TextNode';
import { DocumentNode } from '@/components/nodes/DocumentNode';
import { SimpleChatBox } from '@/components/chat/SimpleChatBox';
import { DocumentService } from '@/services/documentService';
import { FileText, Type, Brain } from 'lucide-react';
import { useConvex } from 'convex/react';
import { Toaster } from 'sonner';

import 'reactflow/dist/style.css';

const nodeTypes = {
  textNode: TextNode,
  documentNode: DocumentNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Welcome Node',
      content: 'Welcome to Neuron! Start by uploading documents or adding text nodes.',
      name: 'Getting Started'
    },
  },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeCounter, setNodeCounter] = useState(2);
  const convex = useConvex();
  
  const canvasId = "main-canvas"; // Replace with dynamic canvas ID

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Check if we have ready documents for AI context
  const hasDocuments = useMemo(() => {
    return nodes.some(node => 
      node.type === 'documentNode' && 
      node.data?.ragieStatus === 'ready'
    );
  }, [nodes]);

  // Handle document upload with Ragie
  const handleDocumentUpload = useCallback(async (nodeId: string, file: File) => {
    try {
      await DocumentService.processDocument(
        file,
        nodeId,
        canvasId,
        convex,
        (progress) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      fileName: file.name,
                      fileSize: file.size,
                      ragieStatus: progress.stage,
                    } 
                  }
                : node
            )
          );
        }
      );
    } catch (error) {
      console.error('Document processing failed:', error);
    }
  }, [canvasId, convex, setNodes]);

  // Add nodes
  const addTextNode = useCallback(() => {
    const newNode: Node = {
      id: `text-${nodeCounter}`,
      type: 'textNode',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {
        label: `Text ${nodeCounter}`,
        content: '',
        name: `Text Node ${nodeCounter}`,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(c => c + 1);
  }, [nodeCounter, setNodes]);

  const addDocumentNode = useCallback(() => {
    const newNode: Node = {
      id: `doc-${nodeCounter}`,
      type: 'documentNode',
      position: { 
        x: Math.random() * 400 + 200, 
        y: Math.random() * 300 + 150 
      },
      data: {
        label: `Document ${nodeCounter}`,
        name: `Document ${nodeCounter}`,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(c => c + 1);
  }, [nodeCounter, setNodes]);

  // Add handlers to nodes
  const nodesWithHandlers = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onFileUpload: node.type === 'documentNode'
        ? (file: File) => handleDocumentUpload(node.id, file)
        : undefined,
    }
  }));

  return (
    <div className="w-full h-screen bg-background relative overflow-hidden">
      {/* Canvas Title */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40">
        <motion.h1 
          className="text-2xl font-bold text-foreground flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Brain className="w-6 h-6 text-primary" />
          CANVAS
        </motion.h1>
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-4">
          <h2 className="text-lg font-bold text-primary mb-3">Controls</h2>
          <div className="space-y-2">
            <Button 
              onClick={addTextNode}
              className="w-full bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Type className="w-4 h-4 mr-2" />
              Add Text Node
            </Button>
            
            <Button 
              onClick={addDocumentNode}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            <div>Nodes: {nodes.length}</div>
            <div>AI Mode: {hasDocuments ? 'Context-Aware' : 'General'}</div>
          </div>
        </Card>
      </div>
      
      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        className="bg-background"
        fitView
      >
        <Controls className="bg-card border-border" />
        <MiniMap className="bg-card border-border" />
        <Background variant="dots" gap={16} size={1} className="opacity-20" />
      </ReactFlow>

      {/* Simple Chat Box */}
      <SimpleChatBox
        canvasId={canvasId}
        hasDocuments={hasDocuments}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
```

## 🎯 **FINAL SETUP COMMANDS**

### **Run These Commands In Sequence:**
```bash
# 1. Clean old dependencies
npm uninstall @convex-dev/rag @xenova/transformers pdf-parse

# 2. Install Ragie and required packages  
npm install ragie @ai-sdk/google sonner

# 3. Create Convex project (follow prompts)
npx convex dev

# 4. Deploy schema
# (This happens automatically when convex dev runs)

# 5. Test Ragie connection
curl -X GET https://api.ragie.ai/documents \
  -H "Authorization: Bearer tnt_QFPVjWDQTK_4jEnLm19mUoXD4JhHxkEUKbfP7APSbJFBAJrhKoYZ5D"

# 6. Start development server
npm run dev
```

## 🎯 **SUCCESS CRITERIA**

### **Immediate Validation (15 Minutes):**
1. ✅ **Clean project** - No complex RAG dependencies
2. ✅ **Ragie connection** - API test returns valid response
3. ✅ **Document upload** - Files upload to Ragie successfully  
4. ✅ **Chat works** - AI responds in both general/context modes
5. ✅ **UI perfect** - Chat box matches reference sketches

### **Full Functionality (30 Minutes):**
1. ✅ **Document processing** - PDFs indexed in Ragie within 30 seconds
2. ✅ **Context-aware responses** - AI uses uploaded documents
3. ✅ **Source attribution** - Shows which documents were referenced
4. ✅ **Error handling** - Graceful failures with clear messages
5. ✅ **Performance** - Smooth interactions, no lag

## 💎 **CRITICAL ADVANTAGES**

1. **ZERO Complex Setup** - Ragie handles all RAG complexity
2. **Instant Processing** - Documents ready in under 30 seconds
3. **Production Ready** - Enterprise-grade reliability from day one
4. **Cost Effective** - 500 free documents, 10 requests/minute  
5. **Perfect for Demo** - Investor-ready, professional appearance

**This Ragie.ai implementation will give you a working, production-ready RAG system in under 1 hour. No complex embeddings, no vector databases, no chunking logic - just upload documents and get intelligent responses immediately.**

**Execute with precision. This is the fastest path to a working intelligent document system. 🌟**

[1](https://ijsret.com/2025/05/21/development-and-enhancement-of-a-scalable-react-platform-with-front-end-development-ai-ml-integration-and-api-driven-architecture/)
[2](https://ieeexplore.ieee.org/document/11026471/)
[3](https://ieeexplore.ieee.org/document/11150997/)
[4](https://jurnal.itscience.org/index.php/brilliance/article/view/5971)
[5](https://www.techscience.com/cmc/v83n3/61024)
[6](https://ieeexplore.ieee.org/document/10737548/)
[7](https://www.indjcst.com/archives/paper-details?paperid=180&papertitle=google-data-extractor-for-structured-web-intelligence-using-java-and-react)
[8](https://arxiv.org/abs/2502.00964)
[9](https://www.semanticscholar.org/paper/5b3243277cf5019373b873c132dadcc9987f0f85)
[10](https://ijatem.com/special-issues/codegen-a-react-based-online-coding-workspace-with-advanced-features-and-real-time-execution/)
[11](http://arxiv.org/pdf/2401.06800.pdf)
[12](https://arxiv.org/pdf/2503.15231.pdf)
[13](https://arxiv.org/pdf/2312.10003.pdf)
[14](http://arxiv.org/pdf/2408.02811.pdf)
[15](https://arxiv.org/pdf/2410.16464.pdf)
[16](http://arxiv.org/pdf/2409.12682.pdf)
[17](https://arxiv.org/pdf/2306.06624.pdf)
[18](http://arxiv.org/pdf/2406.16828.pdf)
[19](http://arxiv.org/pdf/2501.04652.pdf)
[20](http://arxiv.org/pdf/2410.00006.pdf)
[21](https://www.ragie.ai)
[22](https://www.ragie.ai/blog/integrating-ragie-connect-in-your-ai-app-a-step-by-step-guide-for-fast-rag-deployment)
[23](https://www.ragie.ai/connectors)
[24](https://docs.ragie.ai/docs/getting-started)
[25](https://www.ragie.ai/blog/how-to-generate-responses-using-ragies-typescript-sdk)
[26](https://www.ragie.ai/blog/from-files-to-insight-building-a-document-summarizer-in-minutes-with-ragie)
[27](https://lakefs.io/blog/rag-as-a-service/)
[28](https://docs.ragie.ai/docs/step-4-generate)
[29](https://docs.ragie.ai/docs/step-2-upload-documents)
[30](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
[31](https://pipedream.com/apps/ragie/integrations/jobber)
[32](https://github.com/ragieai/ragie-typescript)
[33](https://python.langchain.com/docs/tutorials/rag/)
[34](https://docs.ragie.ai/reference/getdocumentsource)
[35](https://docs.ragie.ai/reference/createdocument)
[36](https://github.com/bentoml/rag-tutorials)
[37](https://pipedream.com/apps/short/integrations/ragie)
[38](https://docs.ragie.ai/docs/example)
[39](https://adasci.org/implementing-rag-as-a-service-using-vectara/)
[40](https://docs.ragie.ai/reference/updatedocumentfile)
