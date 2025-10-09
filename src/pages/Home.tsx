import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  BackgroundVariant,
} from 'reactflow';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextNode } from '@/components/nodes/TextNode';
import { DocumentNode } from '@/components/nodes/DocumentNode';
import { ImageNode } from '@/components/nodes/ImageNode';
import { WebsiteNode } from '@/components/nodes/WebsiteNode';
import { IntelligentChatBox } from '@/components/chat/IntelligentChatBox';
import { SessionDialog } from '@/components/dialogs/SessionDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { DocumentService } from '@/services/documentService';
import YouTubeService from '@/services/youtubeService';
import JinaService from '@/services/jinaService';
import { useConvex, useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Plus, FileText, File, Brain, Image, Globe, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';

import 'reactflow/dist/style.css';

// Define custom node types
const nodeTypes = {
  textNode: TextNode,
  documentNode: DocumentNode,
  imageNode: ImageNode,
  websiteNode: WebsiteNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start Node',
      content: 'Welcome to Neuron! This is your first text node.\n\nDouble-click anywhere to edit this content and start building your knowledge graph.\n\nConnect nodes by dragging from the handles on the sides.',
      name: 'Getting Started'
    },
  },
  {
    id: '2',
    type: 'textNode',
    position: { x: 650, y: 100 },
    data: { 
      label: 'Ideas Node',
      content: '',
      name: 'My Ideas'
    },
  },
  {
    id: '3',
    type: 'textNode',
    position: { x: 450, y: 300 },
    data: { 
      label: 'Notes Node',
      content: '',
      name: 'Quick Notes'
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
];

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeCounter, setNodeCounter] = useState(4);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<Id<"sessions"> | null>(null);
  const [currentSessionName, setCurrentSessionName] = useState<string>('Untitled Session');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const autoSaveTimeoutRef = useRef<number | undefined>(undefined);
  
  // Convex hooks
  const uploadDocumentAction = useAction(api.ragie.uploadDocument);
  const getDocumentStatusAction = useAction(api.ragie.getDocumentStatus);
  const updateNodeMutation = useMutation(api.nodes.updateNodeWithRagie);
  // Session management with Convex
  const createSessionMutation = useMutation(api.sessions.createSession);
  const updateSessionMutation = useMutation(api.sessions.updateSession);
  const deleteSessionMutation = useMutation(api.sessions.deleteSession);
  const allSessions = useQuery(api.sessions.getAllSessions);
  const lastSession = useQuery(api.sessions.getLastSession);
  
  // Canvas ID for chat context
  const canvasId = currentSessionId ? `session_${currentSessionId}` : 'canvas_main';
  
  // Check if we have ready documents for AI context (Ragie status = ready)
  const hasDocuments = nodes.some(node => 
    node.type === 'documentNode' && 
    node.data?.ragieStatus === 'ready'
  );
  
  // Debug: Log document status
  useEffect(() => {
    const docNodes = nodes.filter(n => n.type === 'documentNode');
    console.log('📊 Document Status Check:');
    console.log('  Total document nodes:', docNodes.length);
    docNodes.forEach((node, idx) => {
      console.log(`  Doc ${idx + 1}:`, {
        name: node.data?.fileName || 'unnamed',
        status: node.data?.ragieStatus || node.data?.status || 'unknown',
        hasRagieId: !!node.data?.ragieDocumentId,
      });
    });
    console.log('  hasDocuments (for AI):', hasDocuments);
  }, [nodes, hasDocuments]);
  
  // Get connected document node IDs for chat context (keeping for backward compatibility)
  const connectedNodeIds = nodes
    .filter(node => node.type === 'documentNode' && node.data?.ragieStatus === 'ready')
    .map(node => node.id);
  
  // Aggregate YouTube context from all website nodes with YouTube data
  const youtubeContext = nodes
    .filter(node => node.type === 'websiteNode' && node.data?.isYouTube && node.data?.youtubeData)
    .map(node => YouTubeService.formatForContext(node.data.youtubeData))
    .join('\n\n---\n\n');
  
  // Aggregate Jina Reader web content context from all non-YouTube website nodes
  const webContentContext = nodes
    .filter(node => node.type === 'websiteNode' && !node.data?.isYouTube && node.data?.jinaData && node.data?.jinaData?.success)
    .map(node => JinaService.formatForContext(node.data.jinaData))
    .join('\n\n---\n\n');
  
  // Combine all website context (YouTube + Jina Reader)
  const websiteContext = [youtubeContext, webContentContext].filter(Boolean).join('\n\n===\n\n');
  
  // Aggregate all text nodes as additional context
  const textNodesContext = nodes
    .filter(node => node.type === 'textNode' && node.data?.content)
    .map(node => `[Text Node: ${node.data.name || 'Untitled'}]\n${node.data.content}`)
    .join('\n\n---\n\n');
  
  // Calculate context statistics for chat UI
  const contextStats = {
    documents: nodes.filter(node => node.type === 'documentNode' && node.data?.ragieStatus === 'ready').length,
    youtubeVideos: nodes.filter(node => node.type === 'websiteNode' && node.data?.isYouTube && node.data?.youtubeData).length,
    webArticles: nodes.filter(node => node.type === 'websiteNode' && !node.data?.isYouTube && node.data?.jinaData?.success).length,
    images: nodes.filter(node => node.type === 'imageNode' && node.data?.status === 'ready').length,
  };

  // Sync current session name when session data changes
  useEffect(() => {
    if (currentSessionId && allSessions) {
      const currentSession = allSessions.find(s => s._id === currentSessionId);
      if (currentSession && currentSession.name !== currentSessionName) {
        setCurrentSessionName(currentSession.name);
      }
    }
  }, [currentSessionId, allSessions, currentSessionName]);

  // Show session dialog on EVERY page load/reload
  useEffect(() => {
    // Always show dialog when component mounts (every page load)
    setShowSessionDialog(true);

    // Check for session parameter in URL
    const sessionParam = searchParams.get('session');
    if (sessionParam && currentSessionId !== sessionParam) {
      setCurrentSessionId(sessionParam as Id<"sessions">);
      loadSession(sessionParam as Id<"sessions">);
    }
  }, []); // Empty dependency array means this runs once on mount (every page load)

  // Load session data from Convex
  const loadSession = useCallback(async (sessionId: Id<"sessions">) => {
    const session = allSessions?.find(s => s._id === sessionId);
    if (session) {
      setNodes(session.nodes || []);
      setEdges(session.edges || []);
      setCurrentSessionName(session.name);
      setCurrentSessionId(sessionId);
      toast.success(`Loaded session: ${session.name}`);
    }
  }, [allSessions, setNodes, setEdges]);

  // Auto-save session to Convex
  useEffect(() => {
    if (!currentSessionId || currentSessionId === 'canvas_main') return;

    const timeout = setTimeout(async () => {
      try {
        console.log('💾 Auto-saving session:', currentSessionId, 'with', nodes.length, 'nodes');
        await updateSessionMutation({
          sessionId: currentSessionId,
          nodes: nodes,
          edges: edges,
        });
        console.log('✅ Session auto-saved to Convex');
      } catch (error) {
        console.error('❌ Failed to auto-save session:', error);
      }
    }, 3000);

    return () => {
      console.log('🧹 Clearing auto-save timeout for session:', currentSessionId);
      clearTimeout(timeout);
    };
  }, [nodes, edges, currentSessionId, updateSessionMutation]);

  // Session management handlers with Convex
  const handleCreateNewSession = useCallback(async (name: string, description?: string) => {
    try {
      const sessionId = await createSessionMutation({
        name,
        description,
        nodes: [],
        edges: [],
      });

      // Set as current session
      setCurrentSessionId(sessionId);
      setCurrentSessionName(name);
      setNodes([]);
      setEdges([]);
      setShowSessionDialog(false);
      
      toast.success(`✅ Created new session: ${name}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session');
    }
  }, [createSessionMutation, setNodes, setEdges]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = allSessions?.find(s => s._id === sessionId);
    if (session) {
      console.log('🔍 Loading session:', session.name);
      console.log('📊 Session has:', session.nodes?.length || 0, 'nodes,', session.edges?.length || 0, 'edges');
      console.log('📦 Nodes data:', JSON.stringify(session.nodes, null, 2));
      console.log('🔗 Edges data:', JSON.stringify(session.edges, null, 2));
      
      // Validate nodes structure
      session.nodes?.forEach((node: any, index: number) => {
        console.log(`Node ${index}:`, {
          id: node.id,
          type: node.type,
          position: node.position,
          hasData: !!node.data,
          dataKeys: node.data ? Object.keys(node.data) : [],
        });
      });
      
      // CRITICAL: Set session ID FIRST to prevent auto-save race condition
      setCurrentSessionId(sessionId as any);
      setCurrentSessionName(session.name);
      
      // Then set nodes and edges
      setNodes(session.nodes || []);
      setEdges(session.edges || []);
      
      setShowSessionDialog(false);
      toast.success(`📂 Loaded session: ${session.name}`);
      
      console.log('✅ Session loaded successfully');
    } else {
      console.error('❌ Session not found:', sessionId);
      toast.error('Session not found');
    }
  }, [allSessions, setNodes, setEdges]);

  const handleContinueLast = useCallback(() => {
    if (lastSession) {
      setNodes(lastSession.nodes || []);
      setEdges(lastSession.edges || []);
      setCurrentSessionName(lastSession.name);
      setCurrentSessionId(lastSession._id);
      setShowSessionDialog(false);
      toast.success(`🔄 Continuing: ${lastSession.name}`);
    } else {
      toast.info('No previous sessions - create a new one!');
    }
  }, [lastSession, setNodes, setEdges]);

  const handleDeleteSession = useCallback((sessionId: string, sessionName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent session from being selected when clicking delete
    setSessionToDelete({ id: sessionId, name: sessionName });
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteSession = useCallback(async () => {
    if (!sessionToDelete) return;
    
    try {
      await deleteSessionMutation({ sessionId: sessionToDelete.id as Id<"sessions"> });
      toast.success(`🗑️ Deleted session: ${sessionToDelete.name}`);
      
      // If deleted session was active, clear canvas
      if (currentSessionId === sessionToDelete.id) {
        setCurrentSessionId(null);
        setCurrentSessionName('Untitled Session');
        setNodes([]);
        setEdges([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    } finally {
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    }
  }, [sessionToDelete, deleteSessionMutation, currentSessionId, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle content changes in nodes with auto-save
  const handleNodeContentChange = useCallback((nodeId: string, content: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, content } }
          : node
      )
    );
    
    // This is where you'd save to Convex backend
    console.log(`💾 Node ${nodeId} saved:`, content.substring(0, 50) + '...');
    
    // TODO: Add Convex mutation here
    // await saveNodeContent({ nodeId, content });
  }, [setNodes]);

  // Handle document file upload with Ragie integration
  const handleDocumentUpload = useCallback(async (nodeId: string, file: File) => {
    try {
      await DocumentService.processDocument(
        file,
        nodeId,
        canvasId,
        uploadDocumentAction,
        getDocumentStatusAction,
        updateNodeMutation,
        (progress) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      fileName: file.name,
                      fileSize: file.size,
                      ragieStatus: progress.stage,
                      status: progress.stage,
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
  }, [canvasId, uploadDocumentAction, getDocumentStatusAction, updateNodeMutation, setNodes]);

  // Remove document from node
  const handleRemoveDocument = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                label: node.data.label,
                status: 'empty',
                fileName: undefined,
                fileSize: undefined,
                textContent: undefined,
                fileUrl: undefined,
                uploadProgress: undefined,
                errorMessage: undefined,
                pageCount: undefined,
              } 
            }
          : node
      )
    );
    toast.info('Document removed');
  }, [setNodes]);

  // Add new text node
  const addTextNode = useCallback(() => {
    const newNode: Node = {
      id: `text-${nodeCounter}`,
      type: 'textNode',
      position: { 
        x: Math.random() * 400 + 200, 
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
    toast.success('Text node added');
  }, [nodeCounter, setNodes]);

  // Add new document node
  const addDocumentNode = useCallback(() => {
    const newNode: Node = {
      id: `doc-${nodeCounter}`,
      type: 'documentNode',
      position: { 
        x: Math.random() * 400 + 250, 
        y: Math.random() * 300 + 150 
      },
      data: {
        label: `Document ${nodeCounter}`,
        status: 'empty',
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(c => c + 1);
    toast.success('Document node added');
  }, [nodeCounter, setNodes]);

  // Add new image node
  const addImageNode = useCallback(() => {
    const newNode: Node = {
      id: `img-${nodeCounter}`,
      type: 'imageNode',
      position: { 
        x: Math.random() * 400 + 300, 
        y: Math.random() * 300 + 200 
      },
      data: {
        label: `Image ${nodeCounter}`,
        status: 'empty',
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(c => c + 1);
    toast.success('Image node added');
  }, [nodeCounter, setNodes]);

  // Add new website node
  const addWebsiteNode = useCallback(() => {
    const newNode: Node = {
      id: `web-${nodeCounter}`,
      type: 'websiteNode',
      position: { 
        x: Math.random() * 400 + 350, 
        y: Math.random() * 300 + 250 
      },
      data: {
        label: `Website ${nodeCounter}`,
        status: 'empty',
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(c => c + 1);
    toast.success('Website node added');
  }, [nodeCounter, setNodes]);

  // Handle image upload or URL
  const handleImageUpload = useCallback((nodeId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  imageUrl,
                  imageName: file.name,
                  status: 'ready'
                } 
              }
            : node
        )
      );
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  }, [setNodes]);

  const handleImageUrl = useCallback((nodeId: string, url: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                imageUrl: url,
                imageName: new URL(url).pathname.split('/').pop() || 'Image',
                status: 'ready'
              } 
            }
          : node
      )
    );
    toast.success('Image URL added');
  }, [setNodes]);

  const handleRemoveImage = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                label: node.data.label,
                status: 'empty',
                imageUrl: undefined,
                imageName: undefined,
              } 
            }
          : node
      )
    );
    toast.info('Image removed');
  }, [setNodes]);

  // Handle website URL
  const handleWebsiteUrl = useCallback(async (nodeId: string, url: string) => {
    // Check if it's a YouTube URL
    const isYouTube = YouTubeService.isYouTubeUrl(url);
    
    if (isYouTube) {
      // Set loading state
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, url, status: 'loading' } }
            : node
        )
      );
      
      try {
        const videoId = YouTubeService.extractVideoId(url);
        if (videoId) {
          const youtubeData = await YouTubeService.getVideoMetadata(videoId);
          
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      url,
                      title: youtubeData.title,
                      isYouTube: true,
                      youtubeData,
                      status: 'ready'
                    } 
                  }
                : node
            )
          );
          
          toast.success(`YouTube video loaded: ${youtubeData.title}`);
        }
      } catch (error) {
        console.error('Failed to fetch YouTube data:', error);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, status: 'error' } }
              : node
          )
        );
        toast.error('Failed to load YouTube video');
      }
    } else {
      // Regular website - use Jina Reader for content extraction
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, url, status: 'loading' } }
            : node
        )
      );
      
      try {
        console.log('🔍 Extracting content with Jina Reader...');
        const jinaData = await JinaService.extractContent(url);
        
        if (jinaData.success) {
          // Get content summary for node display
          const contentSummary = JinaService.getContentSummary(jinaData.content, 300);
          const readingTime = JinaService.estimateReadingTime(jinaData.content);
          const keyTopics = JinaService.extractKeyTopics(jinaData.content, 5);
          
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      url,
                      title: jinaData.title,
                      isYouTube: false,
                      jinaData,
                      contentSummary,
                      readingTime,
                      keyTopics,
                      status: 'ready'
                    } 
                  }
                : node
            )
          );
          
          toast.success(`Content extracted: ${jinaData.title}`);
        } else {
          // Extraction failed, but still set basic info
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      url,
                      title: new URL(url).hostname,
                      status: 'ready',
                      jinaData: { ...jinaData, success: false }
                    } 
                  }
                : node
            )
          );
          
          toast.warning('Website added (content extraction unavailable)');
        }
      } catch (error) {
        console.error('Failed to extract website content:', error);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    url,
                    title: new URL(url).hostname,
                    status: 'error'
                  } 
                }
              : node
          )
        );
        toast.error('Failed to extract website content');
      }
    }
  }, [setNodes]);

  const handleRemoveWebsite = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                label: node.data.label,
                status: 'empty',
                url: undefined,
                title: undefined,
              } 
            }
          : node
      )
    );
    toast.info('Website removed');
  }, [setNodes]);

  // Update nodes with appropriate handlers based on type
  const nodesWithHandlers = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      // Text node handlers
      onContentChange: node.type === 'textNode'
        ? (content: string) => handleNodeContentChange(node.id, content)
        : undefined,
      // Document node handlers
      onFileUpload: node.type === 'documentNode'
        ? (file: File) => handleDocumentUpload(node.id, file)
        : undefined,
      onRemoveFile: node.type === 'documentNode'
        ? () => handleRemoveDocument(node.id)
        : undefined,
      // Image node handlers
      onImageUpload: node.type === 'imageNode'
        ? (file: File) => handleImageUpload(node.id, file)
        : undefined,
      onUrlChange: node.type === 'imageNode'
        ? (url: string) => handleImageUrl(node.id, url)
        : node.type === 'websiteNode'
        ? (url: string) => handleWebsiteUrl(node.id, url)
        : undefined,
      onRemove: node.type === 'imageNode'
        ? () => handleRemoveImage(node.id)
        : node.type === 'websiteNode'
        ? () => handleRemoveWebsite(node.id)
        : undefined,
    }
  }));

  return (
    <div className="w-full h-screen bg-background">
      {/* Canvas Title & Second Brain Button */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40">
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            {currentSessionName}
          </h1>
        </motion.div>
      </div>

      {/* Second Brain Button - Top Right */}
      <motion.div
        className="absolute top-6 right-6 z-40"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={() => navigate('/second-brain')}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          My Second Brain
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        {/* Enhanced Control Panel - Collapsible */}
        <motion.div 
          className="absolute top-4 z-10 space-y-2"
          initial={{ x: 0 }}
          animate={{ 
            x: isSidebarCollapsed ? -336 : 0,
            left: isSidebarCollapsed ? 0 : 16
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <Card className="p-4 shadow-xl w-[320px] relative">
            {/* Collapse/Expand Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-12 top-4 h-8 w-8 p-0 rounded-full bg-card shadow-lg border border-border hover:bg-accent z-50"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center gap-3 mb-3">
              <img 
                src="/logoNobg.svg" 
                alt="Neuron Logo" 
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Neuron Canvas
              </h1>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={addTextNode}
                className="w-full bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Text Node
              </Button>
              
              <Button 
                onClick={addDocumentNode}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <File className="w-4 h-4 mr-2" />
                Add Document
              </Button>
              
              <Button 
                onClick={addImageNode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Image className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              
              <Button 
                onClick={addWebsiteNode}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Add Website
              </Button>
              
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">💡 Text:</span>
                  <span>Double-click to edit</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">📄 Document:</span>
                  <span>Upload PDFs (max 10MB)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">🖼️ Image:</span>
                  <span>Upload or paste URL</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">🌐 Website:</span>
                  <span>Embed any URL</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">💾 Auto-save:</span>
                  <span>Instant</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground/70 pt-2">
                <div className="flex items-center justify-between">
                  <span>Nodes: {nodes.length}</span>
                  <span>Edges: {edges.length}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Documents:</span>
                  <span className="font-semibold">{connectedNodeIds.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Context:</span>
                  <span className="font-semibold">
                    {connectedNodeIds.length > 0 ? 'Active' : 'General'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Sessions Box - Interactive List */}
          <Card className="p-4 shadow-xl max-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Sessions</h2>
              </div>
              <Button
                onClick={() => setShowSessionDialog(true)}
                className="bg-primary hover:bg-primary/90 h-7 px-2"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
            
            {/* Current Session Indicator */}
            <div className="text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
              <span className="text-foreground/60">Current:</span> <span className="font-semibold text-primary">{currentSessionName}</span>
            </div>
            
            {/* Session List - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 custom-scrollbar">
              {allSessions && allSessions.length > 0 ? (
                allSessions.map((session) => {
                  const isActive = session._id === currentSessionId;
                  const lastModifiedDate = new Date(session.lastModified).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  return (
                    <motion.div
                      key={session._id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative group">
                        <button
                          onClick={() => {
                            if (!isActive) {
                              handleSelectSession(session._id);
                            }
                          }}
                          className={`
                            w-full text-left p-3 rounded-lg transition-all duration-200
                            border-2 cursor-pointer relative
                            ${
                              isActive 
                                ? 'bg-primary/20 border-primary shadow-md shadow-primary/20' 
                                : 'bg-card/50 border-border/50 hover:bg-accent hover:border-accent-foreground/20'
                            }
                          `}
                          disabled={isActive}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-center gap-2 mb-1">
                              {isActive && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                              <h3 className={`font-semibold text-sm truncate ${
                                isActive ? 'text-primary' : 'text-foreground'
                              }`}>
                                {session.name}
                              </h3>
                            </div>
                            
                            {session.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                                {session.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {session.nodeCount || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {session.edgeCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                          <div className="text-xs text-muted-foreground/70 mt-2">
                            {lastModifiedDate}
                          </div>
                        </button>
                        
                        {/* Delete Button - Shows on hover */}
                        <button
                          onClick={(e) => handleDeleteSession(session._id, session.name, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm mb-2">No sessions yet</p>
                  <p className="text-xs italic">Click "New" to create your first session</p>
                </div>
              )}
            </div>
            
            {/* Footer Info */}
            {allSessions && allSessions.length > 0 && (
              <div className="text-xs text-muted-foreground pt-3 mt-2 border-t border-border text-center">
                {allSessions.length} session{allSessions.length !== 1 ? 's' : ''} total
              </div>
            )}
          </Card>
        </motion.div>
        
        <ReactFlow
          key={currentSessionId || 'no-session'}
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          className="bg-background"
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
        >
          <Controls className="dark:bg-card dark:border-border" />
          <MiniMap 
            className="dark:bg-card dark:border-border"
            nodeColor={(node) => {
              if (node.type === 'documentNode') return '#ea580c'; // orange-600
              return '#d97540'; // primary
            }}
            maskColor="rgba(0, 0, 0, 0.2)"
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1} 
            className="dark:opacity-20" 
          />
        </ReactFlow>
      </motion.div>
      
      {/* Intelligent Chat Box */}
      <IntelligentChatBox
        canvasId={canvasId}
        hasDocuments={hasDocuments}
        connectedNodeIds={connectedNodeIds}
        youtubeContext={youtubeContext}
        webContentContext={webContentContext}
        textNodesContext={textNodesContext}
        contextStats={contextStats}
      />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />

      {/* Session Dialog */}
      <SessionDialog
        isOpen={showSessionDialog}
        onClose={() => setShowSessionDialog(false)}
        sessions={allSessions || []}
        onCreateNew={handleCreateNewSession}
        onSelectSession={handleSelectSession}
        onContinueLast={handleContinueLast}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Session"
        message={`Are you sure you want to delete "${sessionToDelete?.name}"? This action cannot be undone. All nodes and connections will be permanently lost.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteSession}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSessionToDelete(null);
        }}
      />
    </div>
  );
}
