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
import { FileUploadService, type UploadProgress, type DocumentData } from '@/services/fileUploadService';
import { Plus, FileText, File } from 'lucide-react';
import { toast, Toaster } from 'sonner';

import 'reactflow/dist/style.css';

// Define custom node types
const nodeTypes = {
  textNode: TextNode,
  documentNode: DocumentNode,
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

  // Handle document file upload with comprehensive error handling
  const handleDocumentUpload = useCallback(async (nodeId: string, file: File) => {
    // Validate file
    const validation = FileUploadService.validateFile(file);
    if (!validation.valid) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  status: 'error',
                  errorMessage: validation.error,
                  fileName: file.name,
                  fileSize: file.size,
                } 
              }
            : node
        )
      );
      toast.error(validation.error || 'File validation failed');
      return;
    }

    try {
      // Upload and process document
      const documentData = await FileUploadService.uploadDocument(
        file, 
        (progress: UploadProgress) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      status: progress.status,
                      uploadProgress: progress.progress,
                      errorMessage: progress.error,
                      fileName: file.name,
                      fileSize: file.size,
                    } 
                  }
                : node
            )
          );
        }
      );

      // Upload completed successfully
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  ...documentData,
                  status: 'ready',
                } 
              }
            : node
        )
      );

      toast.success(`${file.name} uploaded successfully!`);
      console.log('📄 Document processed:', documentData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('Document upload failed:', error);
      toast.error(errorMessage);
    }
  }, [setNodes]);

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
    }
  }));

  return (
    <div className="w-full h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        {/* Enhanced Control Panel */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Card className="p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary">
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
                  <span className="font-semibold">💾 Auto-save:</span>
                  <span>Instant</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground/70 pt-2">
                <div className="flex items-center justify-between">
                  <span>Nodes: {nodes.length}</span>
                  <span>Edges: {edges.length}</span>
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
