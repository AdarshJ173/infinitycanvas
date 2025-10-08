# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Neuron** is a visual knowledge management application that combines Miro-style infinite canvas with AI-powered document processing. It enables users to build a "digital second brain" by organizing documents, notes, and information as interconnected nodes on a canvas.

### Core Technologies

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Canvas Engine**: ReactFlow for node-based interface
- **Backend**: Convex (serverless backend with real-time sync)
- **Animations**: Framer Motion
- **AI Integration**: Google Generative AI (@google/generative-ai)
- **Document Processing**: PDF.js (pdfjs-dist) with RAG support (@convex-dev/rag)
- **Text Processing**: Xenova Transformers for embeddings

## Development Commands

### Essential Commands

```powershell
# Install dependencies
npm install

# Start development server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check (without build)
npx tsc --noEmit
```

### Convex Backend Commands

```powershell
# Initialize Convex (if not already set up)
npx convex dev

# Deploy Convex functions to production
npx convex deploy

# View Convex documentation
npx convex docs

# Run Convex CLI help
npx convex -h
```

**Note**: Convex runs as a separate process. You'll need to run both `npm run dev` and `npx convex dev` concurrently for local development.

## Architecture Overview

### Frontend Architecture

The application follows a **node-based canvas architecture** where all content is represented as nodes on an infinite canvas:

#### Routing Structure
- `/` - Onboarding page with animated hero section
- `/home` - Main canvas workspace with ReactFlow

#### Node System
The core abstraction is the **Node** - everything is a node:
- **TextNode**: Simple text content with markdown support
- **DocumentNode**: File uploads (currently PDF-focused) with extraction and processing
- Future node types: ImageNode, VideoNode, WebsiteNode

Each node has:
- Position (`x`, `y`) and size (`width`, `height`)
- Content and metadata
- Processing status lifecycle
- Visual handles for creating connections (edges)

#### State Management Pattern
- ReactFlow's `useNodesState` and `useEdgesState` for canvas state
- Local component state for UI interactions
- Callback-based updates propagated through props
- **Important**: Node content changes trigger auto-save callbacks (currently mocked for Convex integration)

### Backend Architecture (Convex)

The backend uses **Convex** - a serverless backend with real-time synchronization. Key concepts:

#### Schema Structure (`convex/schema.ts`)
The database schema defines the following core tables:

1. **users** - User management and authentication
2. **canvases** - Workspace/canvas instances (equivalent to "projects")
3. **nodes** - All node types (text, document, image, video, website)
   - Uses discriminated union for `type` field
   - Contains both shared fields (position, size) and type-specific fields (fileName, storageId, extractedText)
   - Processing pipeline: `pending → uploading → extracting → embedding → ready`
   
4. **edges** - Connections between nodes
5. **documentChunks** - Text chunks for RAG (Retrieval Augmented Generation)
   - Each document is split into chunks for semantic search
   - Chunks maintain metadata (fileName, pageNumber, section)
   - Integration with Convex RAG component for embeddings
   
6. **workflows** - Multi-node execution system (not yet implemented in frontend)
7. **chatMessages** - Conversation history with context tracking
8. **fileUploads** - File upload tracking and metadata
9. **usageMetrics** - Analytics and usage tracking

**Indexing Strategy**: Tables use compound indexes for efficient queries:
- `by_canvas` + `by_user` for multi-tenant filtering
- `by_status` for processing pipeline queries
- `by_updated` for temporal ordering

#### Convex Integration Pattern

Convex uses a **function-based API**:
- **Queries**: Read-only, automatically reactive/real-time
- **Mutations**: Write operations, transactional
- **Actions**: For external API calls (HTTP, AI models)

Example pattern in React:
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";

// Query - auto-updates when data changes
const nodes = useQuery(api.nodes.getByCanvas, { canvasId });

// Mutation - fire and forget or await result
const updateNode = useMutation(api.nodes.update);
await updateNode({ nodeId, content: "new content" });
```

### File Upload Pipeline

**Current Implementation** (Mock):
The `fileUploadService.ts` provides a mock implementation with the full pipeline:

1. **Validation**: File type (PDF only), size (10MB max), content checks
2. **Upload Phase**: Simulated storage upload with progress (0-60%)
3. **Processing Phase**: Text extraction from PDF (60-100%)
4. **Status States**: `uploading → processing → ready` (or `error`)

**TODO for Production**:
- Replace mock text extraction with actual PDF.js implementation
- Integrate Convex storage API for file uploads
- Connect to Convex mutations to save document data
- Implement RAG embedding generation via Convex actions
- Add chunk generation and storage

The service is designed to be drop-in replaceable - the interface remains the same when switching to real implementations.

### RAG (Retrieval Augmented Generation) System

**Architecture** (Planned):
1. Documents uploaded to nodes are processed into chunks
2. Chunks are embedded using Xenova Transformers
3. Embeddings stored via `@convex-dev/rag` component
4. Chat queries perform semantic search across chunks
5. Retrieved chunks provide context for AI responses

**Implementation Status**: Schema and dependencies are ready, frontend integration pending.

## Code Organization

```
src/
├── components/
│   ├── nodes/          # Custom ReactFlow node components
│   │   ├── DocumentNode.tsx   # File upload node with drag-drop
│   │   └── TextNode.tsx       # Text content node
│   └── ui/             # shadcn/ui components (Button, Card, Input, etc.)
├── pages/
│   ├── Home.tsx        # Main canvas workspace
│   └── Onboarding.tsx  # Landing/hero page
├── services/
│   └── fileUploadService.ts   # Document upload & processing
├── lib/
│   └── utils.ts        # Utility functions (cn for classnames)
├── App.tsx             # Router setup
└── main.tsx            # Entry point

convex/
├── schema.ts           # Database schema definition
├── convex.config.ts    # Convex configuration
└── _generated/         # Auto-generated Convex types
```

## Important Patterns and Conventions

### Import Alias
The project uses `@/` as an alias for `src/`:
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### Styling Approach
- **Tailwind CSS** with custom theme configuration
- **Dark mode by default** (set in `main.tsx`)
- **Custom color system** using CSS variables (HSL format)
- **Zero letter-spacing** across all text (custom Tailwind config)
- Custom fonts: Geist Mono (sans), JetBrains Mono (mono)

### Node Component Pattern
All node components should:
1. Accept `NodeProps<CustomDataType>` from ReactFlow
2. Include `Handle` components for connections (Position.Left/Right/Top/Bottom)
3. Use motion components from Framer Motion for animations
4. Implement the `selected` prop for visual feedback
5. Provide callbacks via `data` prop for parent updates

Example structure:
```typescript
interface CustomNodeData {
  label: string;
  content: string;
  onContentChange?: (content: string) => void;
}

export function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  return (
    <motion.div className={cn("...", selected && "ring-2")}>
      <Handle type="target" position={Position.Left} />
      {/* Node content */}
      <Handle type="source" position={Position.Right} />
    </motion.div>
  );
}
```

### Convex Function Pattern
When implementing new Convex functions:

1. **Define validators** using `v` from "convex/values"
2. **Use proper function type** (query/mutation/action)
3. **Leverage indexes** for efficient queries
4. **Handle edge cases** (user permissions, data validation)

Example:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getNodesByCanvas = query({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nodes")
      .withIndex("by_canvas", (q) => q.eq("canvasId", args.canvasId))
      .collect();
  },
});

export const updateNodeContent = mutation({
  args: {
    nodeId: v.id("nodes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.nodeId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});
```

## Current Implementation Status

### ✅ Implemented
- ReactFlow canvas with custom node types
- Text nodes with content editing
- Document nodes with drag-drop upload UI
- File validation and upload progress tracking
- Mock document processing pipeline
- Comprehensive database schema
- Onboarding page with animations
- Dark mode theming
- Convex schema definition

### ✅ Recently Implemented (RAG Pipeline)
- **Embedding Service**: Free Sentence Transformers using Xenova Transformers.js (384D vectors)
- **PDF Processing**: Hybrid approach with PDF.js + pdf-parse fallback
- **Intelligent Chunking**: Semantic text chunking (500 chars, 50 overlap)
- **Convex RAG Service**: Full RAG indexing, search, and Gemini AI integration
- **File Storage**: Convex storage API for document uploads
- **Node Management**: Complete CRUD operations for nodes
- **Database Schema**: Production-ready with 10 tables and comprehensive indexes

### 🚧 In Progress / TODO
- Enhanced document processing service frontend integration
- Chat interface UI component
- Document node integration with RAG pipeline
- Workflow execution system
- User authentication
- Canvas persistence (save/load)
- Multi-canvas management
- Real-time collaboration features

## Working with This Codebase

### Adding a New Node Type

1. Create component in `src/components/nodes/[NodeName].tsx`
2. Define data interface extending base node properties
3. Add node type to `nodeTypes` object in `Home.tsx`
4. Update schema.ts `type` union in nodes table
5. Implement upload/processing logic in services if needed

### Adding Convex Functions

1. Create new file in `convex/` directory (e.g., `convex/nodes.ts`)
2. Import query/mutation/action from `./_generated/server`
3. Define validators using `v` from "convex/values"
4. Implement handler with proper error handling
5. Export functions for use in React components
6. Import via `api.[filename].[functionName]` in frontend

### Modifying the Schema

1. Edit `convex/schema.ts`
2. Run `npx convex dev` to regenerate types
3. Update affected Convex functions
4. Update frontend components using the changed data structures
5. Consider data migration for existing records

## Environment Setup

### Required Environment Variables

Create `.env.local` in the root directory:
```env
# Convex
VITE_CONVEX_URL=https://[your-deployment].convex.cloud

# AI (when implementing)
VITE_GOOGLE_AI_API_KEY=your_api_key_here
```

**Note**: The `.env.local` file is gitignored. Never commit API keys or secrets.

## Performance Considerations

- **ReactFlow Performance**: For large canvases (100+ nodes), consider implementing virtualization or node culling
- **Convex Queries**: Always use indexes for filtering; avoid `.collect()` followed by array filtering
- **Document Processing**: Large PDFs should be chunked and processed in batches to avoid memory issues
- **Embeddings**: Generate embeddings in Convex actions (background jobs) to avoid blocking the UI

## Testing Strategy

Currently no tests are implemented. When adding tests:

- Use Vitest for unit/integration tests
- Test node components with @testing-library/react
- Mock Convex queries/mutations in component tests
- Test file upload validation logic
- Test document processing pipeline stages
- Consider E2E tests with Playwright for critical user flows
