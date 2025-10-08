import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get chat messages for a canvas
 * Returns messages in chronological order
 */
export const getMessagesByCanvas = query({
  args: { canvasId: v.string() },
  handler: async (ctx, { canvasId }) => {
    // For now, return empty array since we don't have proper canvas IDs yet
    // In production, this would query the chatMessages table
    return [];
  },
});

/**
 * Create a new chat message
 */
export const createMessage = mutation({
  args: {
    canvasId: v.string(),
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
    // For now, just log the message
    // In production with auth, this would save to the database
    console.log("Chat message:", args.role, args.content.substring(0, 50));
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
    };
  },
});

/**
 * Clear chat history for a canvas
 */
export const clearChatHistory = mutation({
  args: { canvasId: v.string() },
  handler: async (ctx, { canvasId }) => {
    // In production, this would delete messages from the database
    console.log("Clearing chat history for canvas:", canvasId);
    
    return { deleted: 0 };
  },
});
