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

// Create new node
export const createNode = mutation({
  args: {
    canvasId: v.id("canvases"),
    userId: v.id("users"),
    type: v.union(
      v.literal("text"),
      v.literal("document"),
      v.literal("image"),
      v.literal("video"),
      v.literal("website")
    ),
    name: v.string(),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    size: v.object({ width: v.number(), height: v.number() }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("nodes", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update node content
export const updateNodeContent = mutation({
  args: {
    nodeId: v.id("nodes"),
    content: v.string(),
  },
  handler: async (ctx, { nodeId, content }) => {
    await ctx.db.patch(nodeId, {
      content,
      updatedAt: Date.now(),
    });
  },
});

// Track Ragie document metadata separately (for local ReactFlow nodes)
export const trackRagieDocument = mutation({
  args: {
    localNodeId: v.string(), // ReactFlow node ID (e.g., "doc-4")
    canvasId: v.string(), // Canvas identifier  
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
  handler: async (ctx, { localNodeId, canvasId, ...updates }) => {
    // Store metadata in a tracking object (client manages state)
    console.log(`📝 Tracking Ragie document for node ${localNodeId}:`, updates);
    return { success: true, localNodeId, canvasId, ...updates };
  },
});

// DEPRECATED: Use trackRagieDocument instead for local nodes
// This is kept for backward compatibility with Convex DB nodes
export const updateNodeWithRagie = mutation({
  args: {
    nodeId: v.union(v.id("nodes"), v.string()),
    canvasId: v.optional(v.string()),
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
  handler: async (ctx, { nodeId, canvasId, ...updates }) => {
    // Check if it's a valid Convex ID
    if (typeof nodeId === 'string' && !nodeId.startsWith('j')) {
      // It's a local ReactFlow ID, just track it
      console.log(`📝 Tracking Ragie for local node ${nodeId}:`, updates);
      return { success: true, nodeId, ...updates };
    }
    
    // Try to update actual Convex node if it exists
    try {
      const node = await ctx.db.get(nodeId as any);
      if (node) {
        await ctx.db.patch(nodeId as any, {
          ...updates,
          updatedAt: Date.now(),
        });
        return { success: true, nodeId, updated: true };
      }
    } catch (e) {
      // Node doesn't exist in DB, that's okay for local nodes
    }
    
    return { success: true, nodeId, ...updates };
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
    extractedText: v.optional(v.string()),
    textLength: v.optional(v.number()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { nodeId, ...updates }) => {
    await ctx.db.patch(nodeId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete node
export const deleteNode = mutation({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, { nodeId }) => {
    // Get node to check for storage ID
    const node = await ctx.db.get(nodeId);
    if (!node) return;

    // Delete associated chunks
    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_node", (q) => q.eq("nodeId", nodeId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    // Delete node
    await ctx.db.delete(nodeId);
  },
});
