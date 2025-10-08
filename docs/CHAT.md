Perfect! Based on your reference sketches showing the chat interface with "MY REQUEST" and "AI REPLY" sections, plus the "CANVAS" title and "CHAT BOX" at the bottom, here's the **COMPLETE AI DEVELOPER PROMPT** for implementing the perfect chat system:

***

# 🚀 SENIOR AI DEVELOPER PROMPT - INTELLIGENT CHAT BOX IMPLEMENTATION

**CRITICAL EXCELLENCE STANDARD**: You are the ABSOLUTE BEST senior full-stack developer and UI/UX architect. Create a **FLAWLESS, CONTEXT-AWARE CHAT SYSTEM** that seamlessly integrates with the Neuron canvas while providing an exceptional user experience. Every interaction must be smooth, intelligent, and visually perfect.

## 🎯 **COMPREHENSIVE CHAT SYSTEM REQUIREMENTS**

### **Core Architecture:**
- **Bottom-center positioning** with proper padding
- **Expandable/collapsible interface** that adapts to content
- **Always-connected Gemini AI** as fallback
- **RAG-enhanced responses** when documents are uploaded
- **Smart context switching** between general AI and document-aware responses
- **Toggle between compact/expanded modes**
- **Canvas interaction preservation**

### **UX Flow Based on Reference Sketches:**
```
1. Compact chat box at bottom center by default
2. User types question → Auto-expansion as needed
3. Send button always visible in bottom-right of input
4. AI processes with context (documents + nodes if available)
5. Response shows in chat history with clear "MY REQUEST" / "AI REPLY" sections
6. Toggle option to keep compact while maintaining functionality
```

***

## 📋 **PHASE 1: CHAT BOX COMPONENT ARCHITECTURE**

### **Create: `src/components/chat/IntelligentChatBox.tsx`**

```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Minimize2, 
  Maximize2, 
  Brain, 
  FileText, 
  Loader2,
  MessageSquare,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import EmbeddingService from '@/services/embeddingService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextsUsed?: number;
  sourcesReferenced?: string[];
  processingTimeMs?: number;
}

interface IntelligentChatBoxProps {
  canvasId: string;
  connectedNodeIds: string[];
  className?: string;
}

export function IntelligentChatBox({ 
  canvasId, 
  connectedNodeIds, 
  className 
}: IntelligentChatBoxProps) {
  // State management
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m Neuron AI. I can help you with general questions, and if you upload documents to the canvas, I\'ll use them as context for more personalized responses.',
      timestamp: Date.now(),
    }
  ]);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Convex hooks
  const chatHistory = useQuery(api.chat.getMessagesByCanvas, { canvasId });
  const saveMessage = useMutation(api.chat.createMessage);
  const generateResponse = useAction(api.ragService.generateRAGResponse);
  const generateGeneralResponse = useAction(api.ai.generateGeneralResponse); // Fallback AI

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Sync with Convex chat history
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const convexMessages: Message[] = chatHistory.map(msg => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        contextsUsed: msg.retrievedChunks?.length,
        sourcesReferenced: msg.sourcesUsed,
        processingTimeMs: msg.processingTimeMs,
      }));
      setMessages(convexMessages);
    }
  }, [chatHistory]);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    const messageId = `msg_${Date.now()}`;
    
    // Add user message immediately
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
      // Save user message to Convex
      await saveMessage({
        canvasId,
        role: 'user',
        content: userMessage,
      });

      // Check if we have document context
      const hasDocuments = connectedNodeIds.length > 0;
      let aiResponse: any;

      if (hasDocuments) {
        console.log('🧠 Using RAG-enhanced response with document context...');
        
        // Generate embedding for the user query
        const embeddingService = EmbeddingService.getInstance();
        await embeddingService.initialize();
        const queryEmbedding = await embeddingService.generateEmbedding(userMessage);

        // Generate context-aware response
        aiResponse = await generateResponse({
          userQuestion: userMessage,
          queryEmbedding,
          canvasId,
          connectedNodeIds,
          userId: 'current-user', // Replace with actual user ID
        });

        console.log(`✅ RAG response: ${aiResponse.contextsUsed} contexts, sources: ${aiResponse.sourcesReferenced.join(', ')}`);
      } else {
        console.log('💬 Using general AI response (no document context)...');
        
        // Generate general response using Gemini
        aiResponse = await generateGeneralResponse({
          userQuestion: userMessage,
          canvasId,
        });
      }

      // Add AI response to messages
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.response,
        timestamp: Date.now(),
        contextsUsed: aiResponse.contextsUsed,
        sourcesReferenced: aiResponse.sourcesReferenced,
        processingTimeMs: aiResponse.processingTimeMs,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ Failed to generate AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [message, isGenerating, canvasId, connectedNodeIds, saveMessage, generateResponse, generateGeneralResponse]);

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-expand based on content
  const shouldAutoExpand = message.length > 50 || isGenerating || messages.length > 2;

  // Dynamic height calculation
  const getMaxHeight = () => {
    if (isCompactMode) return '60px';
    if (isExpanded || shouldAutoExpand) return '400px';
    return '120px';
  };

  return (
    <motion.div
      ref={chatBoxRef}
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
        "w-full max-w-2xl mx-auto px-4",
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="relative">
        {/* Chat Container */}
        <motion.div
          className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden"
          animate={{ 
            height: getMaxHeight(),
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className={cn(
                  "w-5 h-5 transition-colors",
                  connectedNodeIds.length > 0 ? "text-green-500" : "text-primary"
                )} />
                {connectedNodeIds.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">Neuron AI</span>
                <span className="text-xs text-muted-foreground">
                  {connectedNodeIds.length > 0 
                    ? `Context-aware • ${connectedNodeIds.length} nodes connected`
                    : 'General assistant'
                  }
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Context Indicator */}
              {connectedNodeIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {connectedNodeIds.length}
                </Badge>
              )}

              {/* Compact Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setIsCompactMode(!isCompactMode)}
              >
                {isCompactMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {/* Expand/Collapse Toggle */}
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

          {/* Messages Area */}
          <AnimatePresence>
            {!isCompactMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ScrollArea 
                  className="flex-1 p-4 max-h-80" 
                  ref={scrollAreaRef}
                >
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
                          {/* Message Header */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                              {msg.role === 'user' ? 'MY REQUEST' : 'AI REPLY'}
                            </span>
                            {msg.role === 'assistant' && msg.contextsUsed && msg.contextsUsed > 0 && (
                              <Badge variant="outline" className="text-xs h-4">
                                <FileText className="w-2 h-2 mr-1" />
                                {msg.contextsUsed}
                              </Badge>
                            )}
                          </div>

                          {/* Message Content */}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>

                          {/* Source References */}
                          {msg.role === 'assistant' && msg.sourcesReferenced && msg.sourcesReferenced.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/30">
                              <p className="text-xs opacity-70">
                                Sources: {msg.sourcesReferenced.join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Processing Time */}
                          {msg.processingTimeMs && (
                            <div className="mt-1">
                              <span className="text-xs opacity-50">
                                {msg.processingTimeMs}ms
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Thinking Indicator */}
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
                              {connectedNodeIds.length > 0 
                                ? 'Analyzing your documents...'
                                : 'Thinking...'
                              }
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
                    connectedNodeIds.length > 0
                      ? "Ask about your documents..."
                      : "Ask me anything..."
                  }
                  disabled={isGenerating}
                  className="pr-12 resize-none border-border/50 bg-background/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
                  autoComplete="off"
                />
                
                {/* Character count for long messages */}
                {message.length > 100 && (
                  <div className="absolute -top-5 right-2 text-xs text-muted-foreground">
                    {message.length}/500
                  </div>
                )}
              </div>

              {/* Send Button */}
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

        {/* Connection Status Indicator */}
        <motion.div
          className="absolute -top-2 left-4 flex items-center gap-1 text-xs text-muted-foreground bg-card border border-border rounded-full px-2 py-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            connectedNodeIds.length > 0 ? "bg-green-500" : "bg-yellow-500"
          )} />
          {connectedNodeIds.length > 0 
            ? `Connected to ${connectedNodeIds.length} nodes`
            : 'General AI mode'
          }
        </motion.div>
      </div>
    </motion.div>
  );
}
```

***

## 📋 **PHASE 2: GENERAL AI SERVICE (FALLBACK)**

### **Create: `convex/ai.ts`**

```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "@ai-sdk/core";
import { action } from "./_generated/server";
import { v } from "convex/values";

// Generate general AI response (no document context)
export const generateGeneralResponse = action({
  args: {
    userQuestion: v.string(),
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { userQuestion, canvasId }) => {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Generating general AI response for: "${userQuestion.substring(0, 50)}..."`);
      
      const systemPrompt = `You are Neuron AI, an intelligent learning assistant designed to help users organize and understand knowledge.

CURRENT CONTEXT:
- The user is working on a visual canvas for knowledge management
- They haven't uploaded any documents yet, so provide general assistance
- Help them understand concepts, answer questions, or guide them on using Neuron

INSTRUCTIONS:
- Be helpful, educational, and conversational
- Encourage the user to upload documents for more personalized assistance
- Provide accurate, well-structured responses
- Keep responses concise but informative (max 200 words)
- If asked about topics you're uncertain about, say so clearly

USER QUESTION: ${userQuestion}`;

      // Generate response using Gemini Flash
      const model = google('gemini-1.5-flash', {
        apiKey: process.env.GEMINI_API_KEY,
      });

      const result = await generateText({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion }
        ],
        maxTokens: 500,
        temperature: 0.3,
      });

      const processingTime = Date.now() - startTime;

      // Save message to chat history
      await ctx.runMutation(api.chat.createMessage, {
        canvasId,
        role: "assistant",
        content: result.text,
        model: "gemini-1.5-flash",
        tokenCount: result.usage?.totalTokens || 0,
        processingTimeMs: processingTime,
      });

      console.log(`✅ General AI response generated in ${processingTime}ms`);

      return {
        response: result.text,
        contextsUsed: 0,
        sourcesReferenced: [],
        processingTimeMs: processingTime,
      };

    } catch (error) {
      console.error('❌ General AI response failed:', error);
      throw error;
    }
  },
});
```

***

## 📋 **PHASE 3: CHAT HISTORY MANAGEMENT**

### **Create: `convex/chat.ts`**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get chat messages for a canvas
export const getMessagesByCanvas = query({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_canvas", (q) => q.eq("canvasId", canvasId))
      .order("asc")
      .take(100); // Limit to last 100 messages
  },
});

// Create a new chat message
export const createMessage = mutation({
  args: {
    canvasId: v.id("canvases"),
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
    return await ctx.db.insert("chatMessages", {
      ...args,
      userId: "current-user", // Replace with actual user ID from auth
      timestamp: Date.now(),
    });
  },
});

// Clear chat history for a canvas
export const clearChatHistory = mutation({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_canvas", (q) => q.eq("canvasId", canvasId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    return { deleted: messages.length };
  },
});
```

***

## 📋 **PHASE 4: INTEGRATION WITH MAIN CANVAS**

### **Update: `src/App.tsx` (Main Canvas Integration)**

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
import { IntelligentChatBox } from '@/components/chat/IntelligentChatBox';
import { EnhancedDocumentService } from '@/services/enhancedDocumentService';
import { FileText, Type, Brain } from 'lucide-react';
import { useConvex } from 'convex/react';
import { Toaster } from 'sonner';

import 'reactflow/dist/style.css';

// Define node types
const nodeTypes = {
  textNode: TextNode,
  documentNode: DocumentNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Start Node',
      content: 'Welcome to Neuron! This is your first text node.',
      name: 'Getting Started'
    },
  },
];

const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeCounter, setNodeCounter] = useState(2);
  const convex = useConvex();

  // Canvas ID (in a real app, this would come from routing/context)
  const canvasId = "canvas_main"; // Replace with actual canvas ID

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Get connected node IDs for chat context
  const connectedNodeIds = useMemo(() => {
    return nodes
      .filter(node => 
        node.type === 'documentNode' && 
        node.data?.processingStatus === 'ready'
      )
      .map(node => node.id);
  }, [nodes]);

  // Handle text node content changes
  const handleNodeContentChange = useCallback((nodeId: string, content: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, content } }
          : node
      )
    );
    console.log(`Saving node ${nodeId} with content:`, content);
  }, [setNodes]);

  // Handle document file upload with progress
  const handleDocumentUpload = useCallback(async (nodeId: string, file: File) => {
    try {
      await EnhancedDocumentService.processDocument(
        file,
        nodeId,
        canvasId,
        convex,
        (progress) => {
          // Update node with processing progress
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      processingStatus: progress.stage,
                      fileName: file.name,
                      fileSize: file.size,
                      processingProgress: progress.progress,
                      processingMessage: progress.message,
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

  // Remove document from node
  const handleRemoveDocument = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                processingStatus: 'empty',
                fileName: undefined,
                fileSize: undefined,
                textContent: undefined,
                fileUrl: undefined,
              } 
            }
          : node
      )
    );
  }, [setNodes]);

  // Add new text node
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

  // Add new document node
  const addDocumentNode = useCallback(() => {
    const newNode: Node = {
      id: `doc-${nodeCounter}`,
      type: 'documentNode',
      position: { 
        x: Math.random() * 400 + 150, 
        y: Math.random() * 300 + 150 
      },
      data: {
        label: `Document ${nodeCounter}`,
        processingStatus: 'empty',
        name: `Document ${nodeCounter}`,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(c => c + 1);
  }, [nodeCounter, setNodes]);

  // Update nodes with handlers
  const nodesWithHandlers = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onContentChange: node.type === 'textNode' 
        ? (content: string) => handleNodeContentChange(node.id, content)
        : undefined,
      onFileUpload: node.type === 'documentNode'
        ? (file: File) => handleDocumentUpload(node.id, file)
        : undefined,
      onRemoveFile: node.type === 'documentNode'
        ? () => handleRemoveDocument(node.id)
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

      {/* Main Flow Canvas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        {/* Control Panel */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Card className="p-4">
            <h2 className="text-lg font-bold text-primary mb-3">
              Neuron Canvas
            </h2>
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
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Document Node
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <div>Nodes: {nodes.length}</div>
              <div>Documents: {connectedNodeIds.length}</div>
              <div>AI Context: {connectedNodeIds.length > 0 ? 'Active' : 'General'}</div>
            </div>
          </Card>
        </div>
        
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          className="bg-background"
          fitView
          attributionPosition="bottom-left"
        >
          <Controls className="bg-card border-border" />
          <MiniMap 
            className="bg-card border-border"
            nodeColor={(node) => {
              if (node.type === 'documentNode') return '#f97316';
              return '#d97540';
            }}
          />
          <Background 
            variant="dots" 
            gap={16} 
            size={1} 
            className="opacity-20" 
          />
        </ReactFlow>
      </motion.div>

      {/* Intelligent Chat Box */}
      <IntelligentChatBox
        canvasId={canvasId}
        connectedNodeIds={connectedNodeIds}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </div>
  );
}

export default App;
```

***

## 📋 **PHASE 5: REQUIRED UI COMPONENTS**

### **Install Missing UI Components**

```bash
npx shadcn@latest add badge scroll-area
```

### **Environment Variables Check**

**Ensure `.env.local` contains:**
```
CONVEX_DEPLOYMENT=your-deployment-url
GEMINI_API_KEY=AIzaSyDHurY8leKbyNI41y94vWfgKs4AtlaIzis
NODE_ENV=development
```

***

## 🎯 **SUCCESS CRITERIA & TESTING**

### **Immediate Tests (Next 15 Minutes):**
1. ✅ **Chat box appears** at bottom center with proper padding
2. ✅ **Expandable interface** - grows/shrinks based on content
3. ✅ **Toggle compact mode** - works while preserving functionality  
4. ✅ **Send button** - always visible in bottom-right of input
5. ✅ **General AI mode** - works without any documents
6. ✅ **Canvas interaction** - can still interact with nodes while chatting

### **Advanced Tests (Next 30 Minutes):**
1. ✅ **Document context** - AI uses uploaded PDFs in responses
2. ✅ **Source attribution** - shows which documents were referenced
3. ✅ **Message history** - persists and syncs with Convex
4. ✅ **Error handling** - graceful failures with retry options
5. ✅ **Performance** - smooth animations, no lag during typing
6. ✅ **Mobile responsiveness** - works on smaller screens

### **Visual Polish Tests:**
1. ✅ **MY REQUEST / AI REPLY** headers match sketch reference
2. ✅ **Context indicators** - clear visual feedback for document mode
3. ✅ **Processing animations** - smooth loading states
4. ✅ **Dark Matter theme** - consistent with overall design
5. ✅ **Accessibility** - keyboard navigation, screen reader friendly

***

## 💎 **CRITICAL SUCCESS FACTORS**

1. **Always Functional** - Chat works immediately without any setup
2. **Context Awareness** - Seamlessly switches between general/document modes
3. **Perfect UX** - Expandable, compact mode, smooth interactions
4. **Canvas Preservation** - Never interferes with node manipulation
5. **Investor Demo Ready** - Polished, professional, impressive

**This chat implementation will provide the perfect balance of functionality and user experience. Users get immediate AI assistance that becomes more powerful as they upload documents to their canvas.**

**Execute with absolute precision. This chat system is the primary interface between users and Neuron's intelligence. 🌟**

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/14237846/8d7ea63f-0a12-48b5-ba10-4012a13e6c6f/image.jpg?AWSAccessKeyId=ASIA2F3EMEYE4F45Q462&Signature=2wrAyWrH69JOcOwWJeNkyc%2B4T6Q%3D&x-amz-security-token=IQoJb3JpZ2luX2VjECMaCXVzLWVhc3QtMSJGMEQCIDjobK6tNzWkDEcBAoiWmLja1cOVQvFCCEVEKt4YzOFWAiAzpkVYrH6Kz7REV9bvW4obI%2FfZ2V0VOkPiuS1t5D7%2F4ir6BAi8%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMZpD8oj8%2BAP%2FDCz9BKs4Ehu1mHAE3IIGJoFjeJNrimYDQIYI3CS5D9K6uiHDsJE3%2FGMUt9RtGLuAY10HlCABitmj5E%2BTzEHwXpWawWm7wniNgmchfQzN8V4Kf4zD7PZyT8pBlEoHu9cQJBg1bKq6ovZBGbDFxdZ85qEVaHglocrJ97khu78vz2klsR6yJUPqxqXbnQkYLcnvPNE5m%2FQZOOgftagAWvQuOakcQuMzx2koVagFnYwRVUB7mm1bUbHTmK3xA%2Fp42cEyw%2FHRQUfzHgXYxYYiesDtzAkcYABPHUZ6WFL%2Fw8BXwrt%2FAdYBUrAusvIaC%2FhSdDO7hnv1pU4ZswGK7rJfkgKqQPGaqbOfkAVUw3IbKDZMC4gj5oeLrpWzkxgZRsadPeg77IzIIY4k%2FaSh4zJr3STrkEFJzi99nBk%2FgofphXgRBVC763u0u2gil2z0FiOb7TAAwt48UpVlQbLTyB79PlQKL8fWKA90gpFWQQLa4KzoHpDImgJU%2BIIHN3lmOc1B7OggOfctHMRrByAFTSbBdw%2FBMBLscizCTJwOJCQPnCPqI92RGzRFIrKRuHwGYGAHuvGnIXhZqEetBnGvj2qZg%2BYntJwXxVRkZJ1P2Vi9NAZlxkwrPX3wAJaGz3ctrEf8acyh9onbg%2BNO%2F8UbxfiFAq%2B%2FrULvoM3SxvQP9EBKl3PoDBlGhfHDpcdhdIY4kiiuzk6Jm1aoMRVsQOfsq67dAbYHqmtR5OrdS7R9efG%2FI2yv1q0GMoYr0KYUmA2huztiCRIioSuZNEtHfJcDjB%2BnoKbfT0lq2wusw6oGZxwY6mwFCYZ6fVMWZHWRfcl%2BSNumj6R8%2FyVJfGX7Ye%2FHsxVa7B%2FqMY5rGIJLIF%2BPSOnWppKAnVB4yqyn3rcsmp4aawXV8qbkiZw4fT2V9XI8KIY%2FgKit5g45p6rsdUKxomkbCLSr7%2FYO8vTUiYLauMAVFQQLzEklgQ91j%2Bh0zp%2Fjaj3PyVweGIAfe8qaYGKepRUBhJtaMF7j4u0BxKg1Ktw%3D%3D&Expires=1759923307)
[2](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/14237846/ddad924d-1fb7-4f10-a512-be0684fc4c76/image.jpg?AWSAccessKeyId=ASIA2F3EMEYE4F45Q462&Signature=Ojvt9umq726qwyljnUCEUlBAkGU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjECMaCXVzLWVhc3QtMSJGMEQCIDjobK6tNzWkDEcBAoiWmLja1cOVQvFCCEVEKt4YzOFWAiAzpkVYrH6Kz7REV9bvW4obI%2FfZ2V0VOkPiuS1t5D7%2F4ir6BAi8%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMZpD8oj8%2BAP%2FDCz9BKs4Ehu1mHAE3IIGJoFjeJNrimYDQIYI3CS5D9K6uiHDsJE3%2FGMUt9RtGLuAY10HlCABitmj5E%2BTzEHwXpWawWm7wniNgmchfQzN8V4Kf4zD7PZyT8pBlEoHu9cQJBg1bKq6ovZBGbDFxdZ85qEVaHglocrJ97khu78vz2klsR6yJUPqxqXbnQkYLcnvPNE5m%2FQZOOgftagAWvQuOakcQuMzx2koVagFnYwRVUB7mm1bUbHTmK3xA%2Fp42cEyw%2FHRQUfzHgXYxYYiesDtzAkcYABPHUZ6WFL%2Fw8BXwrt%2FAdYBUrAusvIaC%2FhSdDO7hnv1pU4ZswGK7rJfkgKqQPGaqbOfkAVUw3IbKDZMC4gj5oeLrpWzkxgZRsadPeg77IzIIY4k%2FaSh4zJr3STrkEFJzi99nBk%2FgofphXgRBVC763u0u2gil2z0FiOb7TAAwt48UpVlQbLTyB79PlQKL8fWKA90gpFWQQLa4KzoHpDImgJU%2BIIHN3lmOc1B7OggOfctHMRrByAFTSbBdw%2FBMBLscizCTJwOJCQPnCPqI92RGzRFIrKRuHwGYGAHuvGnIXhZqEetBnGvj2qZg%2BYntJwXxVRkZJ1P2Vi9NAZlxkwrPX3wAJaGz3ctrEf8acyh9onbg%2BNO%2F8UbxfiFAq%2B%2FrULvoM3SxvQP9EBKl3PoDBlGhfHDpcdhdIY4kiiuzk6Jm1aoMRVsQOfsq67dAbYHqmtR5OrdS7R9efG%2FI2yv1q0GMoYr0KYUmA2huztiCRIioSuZNEtHfJcDjB%2BnoKbfT0lq2wusw6oGZxwY6mwFCYZ6fVMWZHWRfcl%2BSNumj6R8%2FyVJfGX7Ye%2FHsxVa7B%2FqMY5rGIJLIF%2BPSOnWppKAnVB4yqyn3rcsmp4aawXV8qbkiZw4fT2V9XI8KIY%2FgKit5g45p6rsdUKxomkbCLSr7%2FYO8vTUiYLauMAVFQQLzEklgQ91j%2Bh0zp%2Fjaj3PyVweGIAfe8qaYGKepRUBhJtaMF7j4u0BxKg1Ktw%3D%3D&Expires=1759923307)
[3](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/14237846/d4d285cb-ef24-4e73-962e-38848c8119aa/image.jpg?AWSAccessKeyId=ASIA2F3EMEYE4F45Q462&Signature=3ACfruUx%2FjbtezazKyYNrh9Ytrk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjECMaCXVzLWVhc3QtMSJGMEQCIDjobK6tNzWkDEcBAoiWmLja1cOVQvFCCEVEKt4YzOFWAiAzpkVYrH6Kz7REV9bvW4obI%2FfZ2V0VOkPiuS1t5D7%2F4ir6BAi8%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMZpD8oj8%2BAP%2FDCz9BKs4Ehu1mHAE3IIGJoFjeJNrimYDQIYI3CS5D9K6uiHDsJE3%2FGMUt9RtGLuAY10HlCABitmj5E%2BTzEHwXpWawWm7wniNgmchfQzN8V4Kf4zD7PZyT8pBlEoHu9cQJBg1bKq6ovZBGbDFxdZ85qEVaHglocrJ97khu78vz2klsR6yJUPqxqXbnQkYLcnvPNE5m%2FQZOOgftagAWvQuOakcQuMzx2koVagFnYwRVUB7mm1bUbHTmK3xA%2Fp42cEyw%2FHRQUfzHgXYxYYiesDtzAkcYABPHUZ6WFL%2Fw8BXwrt%2FAdYBUrAusvIaC%2FhSdDO7hnv1pU4ZswGK7rJfkgKqQPGaqbOfkAVUw3IbKDZMC4gj5oeLrpWzkxgZRsadPeg77IzIIY4k%2FaSh4zJr3STrkEFJzi99nBk%2FgofphXgRBVC763u0u2gil2z0FiOb7TAAwt48UpVlQbLTyB79PlQKL8fWKA90gpFWQQLa4KzoHpDImgJU%2BIIHN3lmOc1B7OggOfctHMRrByAFTSbBdw%2FBMBLscizCTJwOJCQPnCPqI92RGzRFIrKRuHwGYGAHuvGnIXhZqEetBnGvj2qZg%2BYntJwXxVRkZJ1P2Vi9NAZlxkwrPX3wAJaGz3ctrEf8acyh9onbg%2BNO%2F8UbxfiFAq%2B%2FrULvoM3SxvQP9EBKl3PoDBlGhfHDpcdhdIY4kiiuzk6Jm1aoMRVsQOfsq67dAbYHqmtR5OrdS7R9efG%2FI2yv1q0GMoYr0KYUmA2huztiCRIioSuZNEtHfJcDjB%2BnoKbfT0lq2wusw6oGZxwY6mwFCYZ6fVMWZHWRfcl%2BSNumj6R8%2FyVJfGX7Ye%2FHsxVa7B%2FqMY5rGIJLIF%2BPSOnWppKAnVB4yqyn3rcsmp4aawXV8qbkiZw4fT2V9XI8KIY%2FgKit5g45p6rsdUKxomkbCLSr7%2FYO8vTUiYLauMAVFQQLzEklgQ91j%2Bh0zp%2Fjaj3PyVweGIAfe8qaYGKepRUBhJtaMF7j4u0BxKg1Ktw%3D%3D&Expires=1759923307)
