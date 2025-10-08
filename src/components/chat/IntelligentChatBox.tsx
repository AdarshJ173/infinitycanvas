import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Minimize2, 
  Maximize2, 
  Brain, 
  FileText, 
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
import { useQuery, useMutation, useAction, useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import AIService from '@/services/aiService';

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
  hasDocuments: boolean; // Documents with ragieStatus === 'ready'
  connectedNodeIds?: string[];
  youtubeContext?: string; // YouTube video context if available
  className?: string;
}

export function IntelligentChatBox({ 
  canvasId, 
  hasDocuments,
  connectedNodeIds = [],
  youtubeContext,
  className 
}: IntelligentChatBoxProps) {
  // State management
  const generateRagieResponse = useAction(api.ragie.generateResponse);
  const generateGeminiResponse = useAction(api.gemini.generateResponse);
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

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Scroll to the bottom element
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isGenerating]);

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
      // Generate AI response using YouTube/Ragie/Gemini
      const aiResponse = await AIService.generateResponse(
        userMessage,
        canvasId,
        hasDocuments,
        generateRagieResponse,
        generateGeminiResponse,
        youtubeContext
      );

      // Add AI response
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
      toast.error('Failed to generate response');
    } finally {
      setIsGenerating(false);
    }
  }, [message, isGenerating, canvasId, hasDocuments, generateRagieResponse, generateGeminiResponse, youtubeContext]);

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
    if (isExpanded || shouldAutoExpand) return '500px';
    return '150px';
  };

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 z-50",
        "left-0 right-0 mx-auto",
        "w-full max-w-3xl px-4",
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="relative">
        {/* Chat Container */}
        <motion.div
          className="bg-card/95 backdrop-blur-md border-2 border-border rounded-2xl shadow-2xl overflow-hidden"
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
                  hasDocuments ? "text-green-500" : "text-primary"
                )} />
                {hasDocuments && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">Neuron AI</span>
                <span className="text-xs text-muted-foreground">
                  {youtubeContext ? 'YouTube + AI Context' : hasDocuments ? 'Powered by Ragie RAG' : 'General assistant'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Context Indicator */}
              {youtubeContext && (
                <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                  <Zap className="w-3 h-3 mr-1" />
                  YouTube
                </Badge>
              )}
              {hasDocuments && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Documents
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
                className="overflow-hidden"
              >
                <ScrollArea className="h-[350px]">
                  <div className="p-4 space-y-4">
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
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                              {msg.role === 'user' ? 'MY REQUEST' : 'AI REPLY'}
                            </span>
                            {msg.role === 'assistant' && msg.contextsUsed && msg.contextsUsed > 0 && (
                              <Badge variant="outline" className="text-xs h-4 px-1">
                                <Zap className="w-2 h-2 mr-1" />
                                {msg.contextsUsed} chunks
                              </Badge>
                            )}
                          </div>

                          {/* Message Content */}
                          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                code: ({ children, inline }: any) => 
                                  inline ? (
                                    <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                                  ) : (
                                    <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">{children}</code>
                                  ),
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>

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
                              {youtubeContext ? 'Analyzing YouTube content...' : hasDocuments ? 'Searching your documents...' : 'Thinking...'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Invisible anchor for auto-scroll */}
                    <div ref={messagesEndRef} className="h-0" />
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
                    youtubeContext
                      ? "Ask about the YouTube videos..."
                      : hasDocuments
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
          className="absolute -top-2 left-4 flex items-center gap-1 text-xs text-muted-foreground bg-card border border-border rounded-full px-2 py-1 shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            youtubeContext ? "bg-red-500" : hasDocuments ? "bg-purple-500" : "bg-yellow-500"
          )} />
          {youtubeContext ? 'YouTube Context Active' : hasDocuments ? 'Ragie AI Active' : 'General AI'}
        </motion.div>
      </div>
    </motion.div>
  );
}
