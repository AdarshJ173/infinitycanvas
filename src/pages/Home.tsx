import React, { useCallback, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextNode } from '@/components/nodes/TextNode';
import { DocumentNode } from '@/components/nodes/DocumentNode';
import { ImageNode } from '@/components/nodes/ImageNode';
import { WebsiteNode } from '@/components/nodes/WebsiteNode';
import { IntelligentChatBox } from '@/components/chat/IntelligentChatBox';
import { DocumentService } from '@/services/documentService';
import YouTubeService from '@/services/youtubeService';
import { useConvex, useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Plus, FileText, File, Brain, Image, Globe } from 'lucide-react';
import { toast, Toaster } from 'sonner';

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeCounter, setNodeCounter] = useState(4);
  
  // Convex hooks for Ragie integration
  const uploadDocumentAction = useAction(api.ragie.uploadDocument);
  const getDocumentStatusAction = useAction(api.ragie.getDocumentStatus);
  const updateNodeMutation = useMutation(api.nodes.updateNodeWithRagie);
  
  // Canvas ID for chat context
  const canvasId = 'canvas_main';
  
  // Check if we have ready documents for AI context (Ragie status = ready)
  const hasDocuments = nodes.some(node => 
    node.type === 'documentNode' && 
    node.data?.ragieStatus === 'ready'
  );
  
  // Get connected document node IDs for chat context (keeping for backward compatibility)
  const connectedNodeIds = nodes
    .filter(node => node.type === 'documentNode' && node.data?.ragieStatus === 'ready')
    .map(node => node.id);
  
  // Aggregate YouTube context from all website nodes with YouTube data
  const youtubeContext = nodes
    .filter(node => node.type === 'websiteNode' && node.data?.isYouTube && node.data?.youtubeData)
    .map(node => YouTubeService.formatForContext(node.data.youtubeData))
    .join('\n\n---\n\n');

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
      // Regular website
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  url,
                  title: new URL(url).hostname,
                  status: 'ready'
                } 
              }
            : node
        )
      );
      toast.success('Website added');
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        {/* Enhanced Control Panel */}
        <div className="absolute top-4 left-4 z-10 space-y-2 w-[320px]">
          <Card className="p-4 shadow-xl">
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
    </div>
  );
}
