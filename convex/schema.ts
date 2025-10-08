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
    retrievedChunks: v.optional(v.array(v.string())),
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
