import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all sessions ordered by last modified
export const getAllSessions = query({
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_updated")
      .order("desc")
      .collect();
    
    return sessions;
  },
});

// Get single session by ID
export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

// Get the most recent session
export const getLastSession = query({
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_updated")
      .order("desc")
      .first();
    
    return sessions;
  },
});

// Create new session
export const createSession = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.optional(v.array(v.any())),
    edges: v.optional(v.array(v.any())),
  },
  handler: async (ctx, { name, description, nodes = [], edges = [] }) => {
    const now = Date.now();
    
    // Calculate stats from nodes
    const stats = {
      documents: nodes.filter((n: any) => n.type === 'documentNode').length,
      textNodes: nodes.filter((n: any) => n.type === 'textNode').length,
      images: nodes.filter((n: any) => n.type === 'imageNode').length,
      websites: nodes.filter((n: any) => n.type === 'websiteNode').length,
      totalWords: nodes.reduce((sum: number, n: any) => {
        const content = n.data?.content || n.data?.textContent || '';
        return sum + content.split(/\s+/).filter((w: string) => w.length > 0).length;
      }, 0),
    };
    
    const sessionId = await ctx.db.insert("sessions", {
      name,
      description: description || `Created ${new Date(now).toLocaleDateString()}`,
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      lastModified: now,
      stats,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log(`✅ Created new session: ${name} (${sessionId})`);
    return sessionId;
  },
});

// Update existing session
export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    nodes: v.optional(v.array(v.any())),
    edges: v.optional(v.array(v.any())),
  },
  handler: async (ctx, { sessionId, name, description, nodes, edges }) => {
    const existing = await ctx.db.get(sessionId);
    if (!existing) throw new Error("Session not found");
    
    const now = Date.now();
    const updatedNodes = nodes || existing.nodes;
    const updatedEdges = edges || existing.edges;
    
    // Recalculate stats if nodes changed
    const stats = nodes ? {
      documents: nodes.filter((n: any) => n.type === 'documentNode').length,
      textNodes: nodes.filter((n: any) => n.type === 'textNode').length,
      images: nodes.filter((n: any) => n.type === 'imageNode').length,
      websites: nodes.filter((n: any) => n.type === 'websiteNode').length,
      totalWords: nodes.reduce((sum: number, n: any) => {
        const content = n.data?.content || n.data?.textContent || '';
        return sum + content.split(/\s+/).filter((w: string) => w.length > 0).length;
      }, 0),
    } : existing.stats;
    
    await ctx.db.patch(sessionId, {
      ...(name && { name }),
      ...(description && { description }),
      nodes: updatedNodes,
      edges: updatedEdges,
      nodeCount: updatedNodes.length,
      edgeCount: updatedEdges.length,
      lastModified: now,
      stats,
      updatedAt: now,
    });
    
    console.log(`✅ Updated session: ${name || existing.name} (${sessionId})`);
    return sessionId;
  },
});

// Delete session
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.delete(sessionId);
    console.log(`🗑️ Deleted session: ${sessionId}`);
  },
});

// Get aggregated data from all sessions (for Second Brain feature)
export const getAllSessionsData = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    
    // Aggregate all nodes and edges from all sessions
    const allNodes: any[] = [];
    const allEdges: any[] = [];
    const sessionMap = new Map();
    
    sessions.forEach(session => {
      // Store session info
      sessionMap.set(session._id, {
        name: session.name,
        description: session.description,
        stats: session.stats,
      });
      
      // Collect all nodes with session reference
      session.nodes.forEach((node: any) => {
        allNodes.push({
          ...node,
          _sessionId: session._id,
          _sessionName: session.name,
        });
      });
      
      // Collect all edges with session reference
      session.edges.forEach((edge: any) => {
        allEdges.push({
          ...edge,
          _sessionId: session._id,
        });
      });
    });
    
    return {
      sessions: Array.from(sessionMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      })),
      allNodes,
      allEdges,
      totalSessions: sessions.length,
      totalNodes: allNodes.length,
      totalEdges: allEdges.length,
    };
  },
});

// Get stats for all sessions (for Second Brain visualization)
export const getSessionsStats = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    
    return sessions.map(session => ({
      id: session._id,
      name: session.name,
      description: session.description,
      nodeCount: session.nodeCount,
      edgeCount: session.edgeCount,
      stats: session.stats,
      lastModified: session.lastModified,
      createdAt: session.createdAt,
    }));
  },
});
