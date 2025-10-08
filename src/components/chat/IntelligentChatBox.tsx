import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Minimize2, 
  Maximize2, 
  Brain, 
  FileText, 
  Loader2,
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
import { toast } from 'sonner';

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
      // Check if we have document context
      const hasDocuments = connectedNodeIds.length > 0;

      if (hasDocuments) {
        console.log('🧠 Using context-aware mode with', connectedNodeIds.length, 'documents');
        
        // Simulate AI response with document context
        setTimeout(() => {
          const aiMessage: Message = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `Based on the ${connectedNodeIds.length} document(s) you've uploaded, I can help you analyze and understand the content. I've reviewed your documents and can answer questions about them.\n\nWhat specific information would you like to know about your documents?`,
            timestamp: Date.now(),
            contextsUsed: connectedNodeIds.length,
            sourcesReferenced: connectedNodeIds.map((_, i) => `Document ${i + 1}`),
            processingTimeMs: 1500,
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsGenerating(false);
        }, 1500);
      } else {
        console.log('💬 Using general AI mode (no document context)');
        
        // Simulate general AI response
        setTimeout(() => {
          const aiMessage: Message = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `I'm here to help! While you don't have any documents uploaded yet, I can still assist with general questions.\n\nTo get document-specific responses, try uploading a PDF using the "Add Document" button. Once uploaded, I'll be able to answer questions based on your document's content.\n\nWhat would you like to know?`,
            timestamp: Date.now(),
            processingTimeMs: 800,
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsGenerating(false);
        }, 800);
      }

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
      setIsGenerating(false);
      toast.error('Failed to generate response');
    }
  }, [message, isGenerating, connectedNodeIds]);

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
          className="absolute -top-2 left-4 flex items-center gap-1 text-xs text-muted-foreground bg-card border border-border rounded-full px-2 py-1 shadow-sm"
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
