import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Loader2,
  X,
  Sparkles,
  CornerDownLeft,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAction } from 'convex/react';
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

interface ContextStats {
  documents: number;
  youtubeVideos: number;
  webArticles: number;
  images: number;
}

interface IntelligentChatBoxProps {
  canvasId: string;
  hasDocuments: boolean;
  youtubeContext?: string;
  webContentContext?: string;
  textNodesContext?: string;
  contextStats?: ContextStats;
  className?: string;
}

export function IntelligentChatBox({
  canvasId,
  hasDocuments,
  youtubeContext,
  webContentContext,
  textNodesContext,
  contextStats = { documents: 0, youtubeVideos: 0, webArticles: 0, images: 0 },
  className
}: IntelligentChatBoxProps) {
  const generateRagieResponse = useAction(api.ragie.generateResponse);
  const generateGroqResponse = useAction(api.groq.generateResponse);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: hasDocuments
        ? "I'm ready to answer questions about your uploaded documents."
        : "Upload documents, add websites, or create text nodes to build your knowledge base. Ask me anything.",
      timestamp: Date.now(),
    }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalContexts = contextStats.documents + contextStats.youtubeVideos + contextStats.webArticles + contextStats.images;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isGenerating]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    const messageId = `msg_${Date.now()}`;

    const newUserMessage: Message = {
      id: messageId,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setMessage('');
    setIsGenerating(true);

    if (!isOpen) setIsOpen(true);

    try {
      const aiResponse = await AIService.generateResponse(
        userMessage,
        canvasId,
        hasDocuments,
        generateRagieResponse,
        generateGroqResponse,
        youtubeContext,
        webContentContext,
        textNodesContext
      );

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
      console.error('Failed to generate AI response:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to generate response');
    } finally {
      setIsGenerating(false);
    }
  }, [message, isGenerating, canvasId, hasDocuments, generateRagieResponse, generateGroqResponse, youtubeContext, webContentContext, textNodesContext, isOpen]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const panelHeight = isMaximized ? 'h-[85vh]' : 'h-[480px]';
  const panelWidth = isMaximized ? 'max-w-3xl' : 'max-w-xl';

  return (
    <>
      {/* Floating Trigger Button - Center Bottom */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
          "flex items-center gap-2",
          "h-12 px-5 rounded-full",
          "bg-foreground text-background",
          "shadow-xl shadow-black/20",
          "hover:scale-105 active:scale-95",
          "transition-all duration-200",
          isOpen && "hidden"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Ask AI</span>
        <ChevronDown className="w-4 h-4 opacity-60" />
      </motion.button>

      {/* Centered Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Popup */}
            <motion.div
              className={cn(
                "relative w-full mx-4",
                panelWidth,
                panelHeight,
                "bg-background",
                "rounded-2xl",
                "border border-border",
                "shadow-2xl shadow-black/25",
                "overflow-hidden flex flex-col",
                className
              )}
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">
                      {totalContexts > 0 ? `${totalContexts} source${totalContexts > 1 ? 's' : ''} active` : 'Ready to help'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center",
                        msg.role === 'user'
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {msg.role === 'user' ? (
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={cn(
                        "flex-1 max-w-[85%] space-y-1",
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      )}>
                        <div className={cn(
                          "rounded-xl px-3.5 py-2.5",
                          msg.role === 'user'
                            ? "bg-foreground text-background"
                            : "bg-muted"
                        )}>
                          <div className="text-sm leading-relaxed">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                code: ({ children, className, ...props }) =>
                                  className ? (
                                    <code className={className + " block bg-muted/60 p-2 rounded text-xs overflow-x-auto my-1.5 font-mono"} {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="bg-muted/40 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                      {children}
                                    </code>
                                  ),
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                h1: ({ children }) => <h1 className="text-sm font-bold mb-2 mt-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-sm font-semibold mb-1.5 mt-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-1.5">{children}</h3>,
                                a: ({ children, href }) => <a href={href} className="underline underline-offset-2 hover:text-foreground/80" target="_blank" rel="noopener noreferrer">{children}</a>,
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground my-1.5">{children}</blockquote>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className={cn(
                          "flex items-center gap-1.5 text-[10px] text-muted-foreground/60 px-0.5",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {msg.role === 'assistant' && msg.contextsUsed && msg.contextsUsed > 0 && (
                            <span>{msg.contextsUsed} chunks</span>
                          )}
                          {msg.processingTimeMs && (
                            <span>{msg.processingTimeMs}ms</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Thinking */}
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="bg-muted rounded-xl px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {hasDocuments ? 'Searching documents...' : 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="px-4 py-3 border-t border-border bg-muted/10">
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      hasDocuments
                        ? "Ask about your documents..."
                        : "Ask me anything..."
                    }
                    disabled={isGenerating}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                    autoComplete="off"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isGenerating}
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-foreground hover:bg-foreground/90 shrink-0"
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
