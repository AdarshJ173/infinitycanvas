# Convex Action Hook Fix

## Problem
The application was attempting to call Convex server actions using `convex.action()` directly on the `ConvexReactClient` instance. However, the Convex React client does not expose an `action()` method, leading to runtime errors: `"Cannot read properties of undefined (reading 'action')"`.

## Root Cause
In Convex React applications, server actions must be invoked using React hooks (`useAction`) rather than directly on the client instance. This ensures proper integration with React's component lifecycle and state management.

## Solution Overview
Refactored all service classes and components to use the official Convex React hooks pattern:

### 1. **DocumentService** (`src/services/documentService.ts`)
**Changes:**
- Removed `ConvexReactClient` import and dependency
- Updated `processDocument()` method signature to accept action/mutation functions as parameters:
  - `uploadAction` - result of `useAction(api.ragie.uploadDocument)`
  - `getStatusAction` - result of `useAction(api.ragie.getDocumentStatus)`
  - `updateMutation` - result of `useMutation(api.nodes.updateNodeWithRagie)`
- Replaced all `convex.action()` and `convex.mutation()` calls with direct function invocations

**Before:**
```typescript
static async processDocument(
  file: File,
  nodeId: string,
  canvasId: string,
  convex: ConvexReactClient,
  onProgress: (progress: DocumentProcessingProgress) => void
): Promise<ProcessedDocument>
```

**After:**
```typescript
static async processDocument(
  file: File,
  nodeId: string,
  canvasId: string,
  uploadAction: any,
  getStatusAction: any,
  updateMutation: any,
  onProgress: (progress: DocumentProcessingProgress) => void
): Promise<ProcessedDocument>
```

### 2. **AIService** (`src/services/aiService.ts`)
**Changes:**
- Removed `ConvexReactClient` import
- Updated `generateResponse()` to accept `generateAction` parameter instead of `convex`
- Updated `testRagieConnection()` to accept `testAction` parameter
- Replaced `convex.action()` calls with direct action invocations

**Before:**
```typescript
static async generateResponse(
  userQuestion: string,
  canvasId: string,
  hasDocuments: boolean = false,
  convex?: ConvexReactClient
): Promise<AIResponse>
```

**After:**
```typescript
static async generateResponse(
  userQuestion: string,
  canvasId: string,
  hasDocuments: boolean = false,
  generateAction?: any
): Promise<AIResponse>
```

### 3. **IntelligentChatBox** (`src/components/chat/IntelligentChatBox.tsx`)
**Changes:**
- Added `useAction` hook at component level
- Passed action function to `AIService.generateResponse()`

**Implementation:**
```typescript
export function IntelligentChatBox({ ... }) {
  const generateRagieResponse = useAction(api.ragie.generateResponse);
  
  // ... later in handleSendMessage
  const aiResponse = await AIService.generateResponse(
    userMessage,
    canvasId,
    hasDocuments,
    generateRagieResponse // Pass action function
  );
}
```

### 4. **Home Page** (`src/pages/Home.tsx`)
**Changes:**
- Added imports for `useAction` and `useMutation`
- Created action and mutation hooks at component level
- Passed all required functions to `DocumentService.processDocument()`

**Implementation:**
```typescript
export function HomePage() {
  const uploadDocumentAction = useAction(api.ragie.uploadDocument);
  const getDocumentStatusAction = useAction(api.ragie.getDocumentStatus);
  const updateNodeMutation = useMutation(api.nodes.updateNodeWithRagie);
  
  // ... later in handleDocumentUpload
  await DocumentService.processDocument(
    file,
    nodeId,
    canvasId,
    uploadDocumentAction,
    getDocumentStatusAction,
    updateNodeMutation,
    (progress) => { /* ... */ }
  );
}
```

## Benefits of This Approach

1. **Official Pattern:** Uses the officially supported Convex React hooks pattern
2. **Type Safety:** Better integration with TypeScript when properly typed
3. **React Integration:** Properly integrated with React lifecycle and state management
4. **Error Handling:** Better error boundaries and error handling capabilities
5. **Testing:** Easier to test by mocking action/mutation functions

## Testing Checklist

- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] Production build successful (`npm run build`)
- [ ] Document upload flow works end-to-end
- [ ] Ragie status polling works correctly
- [ ] AI chat integration with Ragie context works
- [ ] Error states handled properly

## Related Files Modified

1. `src/services/documentService.ts`
2. `src/services/aiService.ts`
3. `src/components/chat/IntelligentChatBox.tsx`
4. `src/pages/Home.tsx`

## Next Steps

1. Start development server and test document upload
2. Verify Ragie integration works properly
3. Test AI chat with and without document context
4. Check error handling for failed uploads
5. Verify status polling mechanism

## References

- [Convex React Hooks Documentation](https://docs.convex.dev/client/react)
- [useAction Hook](https://docs.convex.dev/client/react/use-action)
- [useMutation Hook](https://docs.convex.dev/client/react/use-mutation)
