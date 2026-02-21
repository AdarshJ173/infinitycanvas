# Session Management Architecture

## 🏗️ Architecture Overview

This document explains the **proper architecture** for session management in Neuron Canvas using **Convex** as the backend.

## ❌ Why NOT localStorage?

The initial implementation used localStorage as a workaround. This was **WRONG** for the following reasons:

1. **No Real-time Sync**: Cannot share sessions across devices or collaborate
2. **Data Loss Risk**: Browser data can be cleared, losing all work
3. **Limited Storage**: ~5-10MB limit unsuitable for rich canvas data
4. **No Backend Logic**: Cannot run server-side queries, aggregations, or AI processing
5. **Security Issues**: All data exposed in browser, no authentication
6. **Poor Scalability**: Doesn't scale beyond single-user, single-device usage
7. **No Analytics**: Cannot track usage, performance metrics
8. **Missing Features**: Cannot implement "Second Brain" aggregation across all sessions

## ✅ Proper Solution: Convex Backend

### Why Convex?

1. **Real-time Sync**: Automatic live updates across all clients
2. **Serverless**: No infrastructure management
3. **Type-Safe**: Full TypeScript support with generated types
4. **Scalable**: Handles millions of documents
5. **Reactive Queries**: UI automatically updates when data changes
6. **Built-in Auth**: User authentication and authorization
7. **File Storage**: Integrated file/image storage
8. **Edge Functions**: Server-side logic for complex operations

## 📊 Database Schema

### Sessions Table

```typescript
sessions: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  
  // Complete canvas state
  nodes: v.array(v.any()),      // All ReactFlow nodes
  edges: v.array(v.any()),      // All ReactFlow edges
  
  // Metadata
  nodeCount: v.number(),
  edgeCount: v.number(),
  lastModified: v.number(),
  
  // Statistics for visualization
  stats: v.object({
    documents: v.number(),
    textNodes: v.number(),
    images: v.number(),
    websites: v.number(),
    totalWords: v.number(),
  }),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_updated", ["updatedAt"])
  .index("by_created", ["createdAt"])
```

## 🔄 Data Flow

### Creating a Session

```
User Input (SessionDialog)
  ↓
handleCreateNewSession()
  ↓
createSessionMutation()
  ↓
Convex Backend (sessions.createSession)
  ↓
Database Insert
  ↓
Real-time Update
  ↓
UI Auto-Refreshes (useQuery)
```

### Auto-Save Flow

```
User Edits Canvas (adds/modifies nodes)
  ↓
useEffect() detects changes
  ↓
Wait 3 seconds (debounce)
  ↓
updateSessionMutation()
  ↓
Convex Backend (sessions.updateSession)
  ↓
Database Update with stats calculation
  ↓
Real-time sync to all clients
```

### Second Brain Visualization

```
SecondBrain Page Load
  ↓
useQuery(api.sessions.getSessionsStats)
  ↓
Convex aggregates all sessions
  ↓
Returns session stats
  ↓
Force-directed graph renders
  ↓
Auto-updates on any session change
```

## 🚀 Setup Instructions

### 1. Start Development Environment

**Option A: Start Everything** (Recommended)
```bash
npm run dev:full
```

This starts:
- Convex backend (in separate window)
- Vite frontend (in current window)

**Option B: Start Separately**

Terminal 1 - Convex Backend:
```bash
npm run convex
# OR
npx convex dev
```

Terminal 2 - Vite Frontend:
```bash
npm run dev
```

### 2. Verify Setup

1. **Check Convex Dashboard**: 
   - Open https://dashboard.convex.dev
   - Verify functions are deployed
   - Check that `sessions` table exists

2. **Check Browser Console**:
   - Look for: "✅ Created new session: [name]"
   - Look for: "💾 Session auto-saved to Convex"

3. **Check Network Tab**:
   - Should see WebSocket connection to Convex
   - Real-time updates via WebSocket

## 🎯 Key Features

### 1. Auto-Save (Every 3 seconds)
- Detects canvas changes (nodes/edges)
- Debounced to prevent excessive saves
- Calculates and stores statistics
- Updates timestamp automatically

### 2. Session Dialog
- Create new sessions with name/description
- Continue last session (most recent)
- Select from existing sessions
- Shows session stats (node count, dates)

### 3. Second Brain Visualization
- Force-directed graph of all sessions
- Central "Second Brain" node
- Session nodes orbit around center
- Interactive hover info
- Click to open session
- Real-time updates

### 4. "From My Second Brain" Toggle (Coming Soon)
- Aggregate data from ALL sessions
- Feed into AI chat context
- Cross-session knowledge retrieval

## 🔧 API Reference

### Queries (Read Data)

```typescript
// Get all sessions
const sessions = useQuery(api.sessions.getAllSessions);

// Get single session
const session = useQuery(api.sessions.getSession, { 
  sessionId: "..." 
});

// Get last session
const lastSession = useQuery(api.sessions.getLastSession);

// Get stats for visualization
const stats = useQuery(api.sessions.getSessionsStats);

// Get aggregated data from all sessions
const allData = useQuery(api.sessions.getAllSessionsData);
```

### Mutations (Write Data)

```typescript
// Create session
const createSession = useMutation(api.sessions.createSession);
const sessionId = await createSession({
  name: "My Session",
  description: "Description",
  nodes: [],
  edges: [],
});

// Update session
const updateSession = useMutation(api.sessions.updateSession);
await updateSession({
  sessionId: "...",
  nodes: [...],
  edges: [...],
});

// Delete session
const deleteSession = useMutation(api.sessions.deleteSession);
await deleteSession({ sessionId: "..." });
```

## 📁 File Structure

```
convex/
  ├── schema.ts                 # Database schema definitions
  ├── sessions.ts              # Session CRUD operations
  └── _generated/
      ├── api.ts               # Auto-generated API types
      └── server.ts            # Auto-generated server types

src/
  ├── pages/
  │   ├── Home.tsx             # Main canvas + session management
  │   └── SecondBrain.tsx      # Visualization page
  └── components/
      └── SessionDialog.tsx    # Session creation/selection UI
```

## 🎨 UI/UX Flow

### First Visit
1. User lands on home page
2. SessionDialog appears automatically
3. Options: "Create New Session" or "Continue Last"
4. User creates first session
5. Canvas initializes empty
6. User adds nodes/edges
7. Auto-save kicks in after 3 seconds

### Subsequent Visits
1. User lands on home page
2. SessionDialog appears
3. "Continue Last Session" shows recent session
4. User continues or creates new
5. Canvas loads with saved state
6. Changes auto-save continuously

### Second Brain Page
1. User clicks "My Second Brain" button
2. Navigates to /second-brain
3. Force-directed graph loads
4. Shows all sessions as nodes
5. Hover for details
6. Click to open session
7. Real-time updates as sessions change

## 🐛 Troubleshooting

### "Session management will be available after running: npx convex dev"

**Problem**: Convex backend not running

**Solution**:
```bash
npm run dev:full
# OR in separate terminal
npx convex dev
```

### "Failed to create session"

**Problem**: Convex API not generated

**Solution**:
1. Stop all servers
2. Run: `npx convex dev` (wait for "Convex functions ready")
3. Check that `convex/_generated/api.ts` exists
4. Restart Vite: `npm run dev`

### Sessions not appearing in Second Brain

**Problem**: Data not syncing or query not loading

**Solution**:
1. Check browser console for errors
2. Verify Convex WebSocket connection (Network tab)
3. Check Convex dashboard for data
4. Ensure `sessionsData` is not null/undefined

### Auto-save not working

**Problem**: Mutation failing or timeout not firing

**Solution**:
1. Check console for "💾 Session auto-saved to Convex"
2. Verify `currentSessionId` is set
3. Ensure Convex backend is running
4. Check Network tab for mutation calls

## 🚀 Performance Considerations

### Auto-Save Debouncing
- 3-second delay prevents excessive writes
- Only saves when data actually changes
- Efficient for large canvas states

### Query Optimization
- Indexes on `updatedAt` and `createdAt` for fast sorting
- Reactive queries only re-fetch when data changes
- Convex handles caching automatically

### Statistics Calculation
- Stats calculated server-side during save
- Prevents expensive client-side computation
- Pre-computed for instant visualization

## 🔐 Future Enhancements

1. **User Authentication**: Tie sessions to users
2. **Session Sharing**: Share sessions with other users
3. **Version History**: Track session snapshots over time
4. **Export/Import**: Export sessions as JSON
5. **Session Templates**: Start from pre-built templates
6. **Tags/Categories**: Organize sessions
7. **Search**: Full-text search across all sessions
8. **AI Analysis**: Analyze patterns across sessions

## 📝 Best Practices

1. **Always run Convex in development**: `npm run dev:full`
2. **Never mock/stub Convex calls**: Use real backend or nothing
3. **Use TypeScript types**: Import from `convex/_generated/api`
4. **Handle loading states**: Check `sessionsData !== undefined`
5. **Provide error feedback**: Toast notifications for failures
6. **Test real-time sync**: Open multiple browser tabs
7. **Monitor console logs**: Look for auto-save confirmations

## 🎯 Success Criteria

✅ Sessions persist across page reloads
✅ Auto-save works every 3 seconds
✅ Second Brain shows all sessions in real-time
✅ No localStorage usage (except for UI preferences)
✅ Proper error handling with user feedback
✅ Type-safe API calls with generated types
✅ Real-time updates across multiple clients

---

**Remember**: Always use the proper backend (Convex). Never compromise on architecture for quick hacks. Build it right the first time.
