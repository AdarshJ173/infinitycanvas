import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  BackgroundVariant,
} from 'reactflow';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 25 },
    data: { label: 'Start Node' },
    className: 'dark:bg-card dark:text-card-foreground bg-card text-card-foreground border-border',
  },
  {
    id: '2',
    position: { x: 100, y: 125 },
    data: { label: 'Process Node' },
    className: 'dark:bg-card dark:text-card-foreground bg-card text-card-foreground border-border',
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        <div className="absolute top-4 left-4 z-10">
          <Card className="p-4">
            <h1 className="text-2xl font-bold text-primary mb-2">
              Neuron
            </h1>
            <Button className="w-full">Add Node</Button>
          </Card>
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          className="bg-background"
        >
          <Controls className="dark:bg-card dark:border-border" />
          <MiniMap className="dark:bg-card dark:border-border" />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} className="dark:opacity-20" />
        </ReactFlow>
      </motion.div>
    </div>
  );
}

export default App;
