import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, FileText, Image as ImageIcon, Globe, File, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Session {
  _id: string;
  name: string;
  description?: string;
  nodeCount: number;
  edgeCount: number;
  stats: {
    documents: number;
    textNodes: number;
    images: number;
    websites: number;
    totalWords: number;
  };
  lastModified: number;
  createdAt: number;
}

interface SessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onCreateNew: (name: string, description?: string) => void;
  onSelectSession: (sessionId: string) => void;
  onContinueLast: () => void;
}

export function SessionDialog({
  isOpen,
  onClose,
  sessions,
  onCreateNew,
  onSelectSession,
  onContinueLast,
}: SessionDialogProps) {
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');

  const handleCreateNew = () => {
    if (!sessionName.trim()) return;
    onCreateNew(sessionName, sessionDescription);
    setSessionName('');
    setSessionDescription('');
    setMode('choose');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      if (hours < 1) return 'Just now';
      return `${hours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const lastSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              <Card className="bg-card/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/50">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {mode === 'choose' ? 'Your Sessions' : 'Create New Session'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === 'choose' 
                        ? 'Continue where you left off or start fresh'
                        : 'Give your session a memorable name'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {mode === 'choose' ? (
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onContinueLast}
                        disabled={!lastSession}
                        className="relative p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border-2 border-primary/30 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <Clock className="w-10 h-10 text-primary mb-3" />
                          <h3 className="text-lg font-bold mb-1">Continue Last Session</h3>
                          <p className="text-sm text-muted-foreground">
                            {lastSession ? lastSession.name : 'No sessions yet'}
                          </p>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('create')}
                        className="relative p-6 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl border-2 border-secondary/30 hover:border-secondary/50 transition-all group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <Plus className="w-10 h-10 text-secondary mb-3" />
                          <h3 className="text-lg font-bold mb-1">New Session</h3>
                          <p className="text-sm text-muted-foreground">
                            Start with a blank canvas
                          </p>
                        </div>
                      </motion.button>
                    </div>

                    {/* Recent Sessions */}
                    {sessions.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                          Recent Sessions
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {sessions.map((session, index) => (
                            <motion.button
                              key={session._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.01, x: 4 }}
                              onClick={() => onSelectSession(session._id)}
                              className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 transition-all text-left group"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                                    {session.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {session.description || 'No description'}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(session.lastModified)}
                                </span>
                              </div>
                              
                              {/* Stats */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {session.stats.textNodes}
                                </div>
                                <div className="flex items-center gap-1">
                                  <File className="w-3 h-3" />
                                  {session.stats.documents}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3" />
                                  {session.stats.images}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {session.stats.websites}
                                </div>
                                <div className="ml-auto">
                                  {session.nodeCount} nodes • {session.stats.totalWords.toLocaleString()} words
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Create Mode */
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Session Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        placeholder="e.g., Machine Learning Research, Project Ideas..."
                        className="bg-muted/50 border-border/50 focus:border-primary"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && sessionName.trim()) {
                            handleCreateNew();
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Description (Optional)
                      </label>
                      <Input
                        value={sessionDescription}
                        onChange={(e) => setSessionDescription(e.target.value)}
                        placeholder="What's this session about?"
                        className="bg-muted/50 border-border/50 focus:border-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && sessionName.trim()) {
                            handleCreateNew();
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        onClick={handleCreateNew}
                        disabled={!sessionName.trim()}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Session
                      </Button>
                      <Button
                        onClick={() => setMode('choose')}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
