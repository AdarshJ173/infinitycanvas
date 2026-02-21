# Ragie AI Integration - Testing Guide

## Pre-Testing Checklist

### ✅ Environment Setup
- [x] Convex functions deployed (`npx convex dev`)
- [x] Environment variables configured:
  - `RAGIE_API_KEY` in `.env.local` (server-side)
  - `VITE_GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` (client-side)
- [x] TypeScript compilation passes
- [x] Production build successful

### ✅ Code Changes
- [x] `DocumentService` refactored to use action/mutation parameters
- [x] `AIService` refactored to use action parameters
- [x] `IntelligentChatBox` uses `useAction` hook
- [x] `Home.tsx` uses `useAction` and `useMutation` hooks

---

## Test Plan

### 1. Basic Application Launch

**Test:** Start the development server
```bash
npm run dev
```

**Expected Result:**
- Application loads without errors
- Canvas renders with initial nodes
- Intelligent chat box visible at bottom
- No console errors

**Status:** ⏳ Pending

---

### 2. Document Upload Flow

**Test Case 2.1: Upload PDF to Document Node**

**Steps:**
1. Click "Add Document" button
2. A new document node appears on canvas
3. Click on the document node
4. Upload a PDF file (< 10MB)

**Expected Result:**
- File upload starts immediately
- Node shows "Uploading..." status
- Progress indicator appears
- Node transitions to "Processing..." status
- After processing completes (may take 10-30s), node shows "Ready" status with green checkmark
- File name and size displayed
- Console shows Ragie API calls:
  ```
  📤 Uploading to Ragie...
  ⏳ Polling Ragie status...
  ✅ Document ready in Ragie!
  ```

**Status:** ⏳ Pending

---

**Test Case 2.2: Check Node State After Upload**

**Steps:**
1. After successful upload, inspect the node data
2. Check if `ragieDocumentId` is populated
3. Verify `ragieStatus` is 'ready'

**Expected Result:**
- Node data contains:
  ```javascript
  {
    fileName: "document.pdf",
    fileSize: 123456,
    ragieDocumentId: "doc_xxxx",
    ragieStatus: "ready",
    status: "ready"
  }
  ```

**Status:** ⏳ Pending

---

**Test Case 2.3: Upload Error Handling**

**Steps:**
1. Try uploading a file > 10MB
2. OR: Temporarily set invalid Ragie API key
3. Attempt upload

**Expected Result:**
- Error toast appears
- Node status shows "error"
- Console shows error details
- Node can be retried or removed

**Status:** ⏳ Pending

---

### 3. AI Chat Integration

**Test Case 3.1: Chat Without Documents (General Mode)**

**Steps:**
1. Before uploading any documents
2. Open chat (should already be visible)
3. Type a general question: "What is machine learning?"
4. Send message

**Expected Result:**
- Chat box header shows "General assistant"
- No "Context Mode" badge visible
- Response generated using Gemini
- Response is generic, not document-specific
- Console shows:
  ```
  💬 Using general Gemini response...
  ```
- No "contexts used" or "sources" displayed

**Status:** ⏳ Pending

---

**Test Case 3.2: Chat With Documents (Context Mode)**

**Steps:**
1. Upload and process at least one document
2. Wait for "Ready" status
3. Ask a question related to the uploaded document
4. Example: If uploaded a ML paper, ask "What is the main hypothesis?"

**Expected Result:**
- Chat box header shows "Powered by Ragie RAG"
- "Context Mode" badge visible with lightning icon
- Response generation calls Ragie API
- Console shows:
  ```
  🧠 Using Ragie for context-aware response...
  ```
- Response includes relevant context from document
- Message shows "N chunks" badge
- Sources referenced displayed below message
- Processing time shown

**Status:** ⏳ Pending

---

**Test Case 3.3: Chat Fallback to Gemini**

**Steps:**
1. Upload a document about Topic A (e.g., biology)
2. Wait for "Ready" status
3. Ask a question about Topic B (e.g., "What is quantum computing?")

**Expected Result:**
- Ragie returns no relevant chunks (contextsUsed: 0)
- System falls back to general Gemini response
- Response acknowledges lack of relevant context
- Suggests uploading more relevant documents

**Status:** ⏳ Pending

---

### 4. Status Indicators

**Test Case 4.1: AI Context Status in Sidebar**

**Steps:**
1. Check sidebar stats before and after uploading documents

**Expected Result Before Upload:**
- Documents: 0
- AI Context: General

**Expected Result After Upload:**
- Documents: 1 (or more)
- AI Context: Active

**Status:** ⏳ Pending

---

**Test Case 4.2: Chat Connection Indicator**

**Steps:**
1. Look at chat box bottom left corner indicator

**Expected Result:**
- Shows "General AI" with yellow dot when no documents
- Shows "Ragie AI Active" with purple dot when documents ready

**Status:** ⏳ Pending

---

### 5. Multiple Documents

**Test Case 5.1: Upload Multiple Documents**

**Steps:**
1. Add 2-3 document nodes
2. Upload different PDF files to each
3. Wait for all to reach "Ready" status

**Expected Result:**
- All documents process independently
- Status polling works for each
- All show green checkmarks when ready
- Sidebar shows correct document count

**Status:** ⏳ Pending

---

**Test Case 5.2: Ask Questions Across Multiple Documents**

**Steps:**
1. With multiple documents uploaded
2. Ask a question that could be answered by any document
3. Ask a question requiring info from multiple documents

**Expected Result:**
- Ragie returns chunks from relevant documents
- Sources list shows multiple document names
- Answer synthesizes information from multiple sources

**Status:** ⏳ Pending

---

### 6. Edge Cases

**Test Case 6.1: Remove Document**

**Steps:**
1. Upload and process a document
2. Click remove/delete on the document node
3. Check AI context status

**Expected Result:**
- Document removed from node
- If last document, AI context switches back to "General"
- Node can accept new document upload

**Status:** ⏳ Pending

---

**Test Case 6.2: Network Error During Upload**

**Steps:**
1. Start document upload
2. Simulate network interruption (dev tools offline mode)

**Expected Result:**
- Error caught gracefully
- Error message shown to user
- Node status set to "error"
- Can retry upload

**Status:** ⏳ Pending

---

**Test Case 6.3: Ragie API Rate Limiting**

**Steps:**
1. Upload many documents in quick succession

**Expected Result:**
- Rate limit errors caught
- Retry logic activates
- User sees appropriate status messages
- Eventually all documents process

**Status:** ⏳ Pending

---

## Performance Benchmarks

### Document Upload Times
- Small PDF (< 1MB): Expected ~5-15 seconds
- Medium PDF (1-5MB): Expected ~15-30 seconds
- Large PDF (5-10MB): Expected ~30-60 seconds

### Chat Response Times
- General mode (Gemini only): Expected ~1-3 seconds
- Context mode (Ragie + Gemini): Expected ~2-5 seconds

---

## Debugging Tips

### Console Logs to Watch
```javascript
// Document Upload
📤 Uploading to Ragie...
⏳ Polling Ragie status...
✅ Document ready in Ragie!

// AI Chat
🧠 Using Ragie for context-aware response...
💬 Using general Gemini response...
```

### Common Issues

**Issue:** "Cannot read properties of undefined (reading 'action')"
**Solution:** ✅ Fixed! Services now use action/mutation parameters

**Issue:** Documents stuck in "Processing" status
**Check:**
- Ragie dashboard for document status
- Console for polling logs
- Network tab for API calls

**Issue:** AI responses don't use document context
**Check:**
- Document `ragieStatus` is 'ready'
- `hasDocuments` prop is true
- Console shows "Using Ragie..." log

---

## Success Criteria

### ✅ Core Functionality
- [ ] Documents upload successfully
- [ ] Ragie processing completes
- [ ] Status updates reflect actual state
- [ ] AI chat switches between general and context modes
- [ ] Ragie RAG returns relevant chunks
- [ ] Sources are properly attributed

### ✅ User Experience
- [ ] No confusing error messages
- [ ] Loading states are clear
- [ ] Status indicators are accurate
- [ ] Performance is acceptable
- [ ] UI is responsive during processing

### ✅ Error Handling
- [ ] Upload errors are caught
- [ ] Processing errors are handled
- [ ] Network errors don't crash app
- [ ] User can recover from errors

---

## Next Steps After Testing

1. **If all tests pass:**
   - Prepare demo for investors
   - Document any performance optimizations
   - Create user guide

2. **If issues found:**
   - Document specific failures
   - Create bug reports with reproduction steps
   - Prioritize fixes

3. **Performance optimization opportunities:**
   - Implement caching for repeated queries
   - Add request debouncing
   - Optimize polling intervals
   - Add pagination for large result sets

---

## Demo Script for Investors

### Setup (2 minutes)
1. Open application
2. Show clean canvas
3. Explain node-based knowledge graph concept

### Document Upload Demo (3 minutes)
1. Click "Add Document"
2. Upload a relevant PDF (e.g., AI research paper)
3. Show real-time status updates
4. Explain Ragie integration and processing

### AI Chat Demo (5 minutes)
1. Ask general question first → show generic AI response
2. Wait for document to be ready
3. Ask document-specific question → show contextual response
4. Highlight:
   - Number of contexts used
   - Source attribution
   - Processing speed
   - Accuracy improvement

### Value Proposition (2 minutes)
- Traditional note-taking: static, disconnected
- Neuron: dynamic, AI-powered, connected knowledge
- Ragie RAG: accurate, source-attributed answers
- Perfect for students, researchers, professionals

**Total Time:** ~12 minutes + Q&A
