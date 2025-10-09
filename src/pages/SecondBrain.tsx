import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Sparkles, FileText, Image as ImageIcon, Globe, File, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface SessionNode {
  id: string;
  name: string;
  description?: string;
  stats: {
    documents: number;
    textNodes: number;
    images: number;
    websites: number;
    totalWords: number;
  };
  nodeCount: number;
  lastModified: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function SecondBrainPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SessionNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SessionNode | null>(null);
  const nodesRef = useRef<SessionNode[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const hoveredNodeRef = useRef<SessionNode | null>(null);
  const selectedNodeRef = useRef<SessionNode | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef<SessionNode | null>(null);
  
  // Load sessions from Convex (auto-refreshes on data change)
  const sessionsData = useQuery(api.sessions.getSessionsStats);

  // Update refs when state changes
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  // Initialize force-directed graph
  useEffect(() => {
    if (!sessionsData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable hardware acceleration
    canvas.style.willChange = 'transform';

    // Set canvas size with DPR support
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      
      // CRITICAL: Get parent container dimensions, not canvas itself
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      
      // Ensure we're using viewport dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set canvas internal resolution (scaled for DPR)
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      // Set canvas display size (logical pixels)
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      // Scale context to match DPR
      ctx.scale(dpr, dpr);
      
      // Store LOGICAL dimensions (not DPR-scaled)
      canvasRectRef.current = {
        width: width,
        height: height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
      } as DOMRect;
      
      console.log('✅ Canvas sized:', width, 'x', height, 'DPR:', dpr);
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Use LOGICAL dimensions for positioning
    const rect = canvasRectRef.current;
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Create central "Second Brain" node
    const centralNode: SessionNode = {
      id: 'center',
      name: 'SECOND BRAIN',
      description: 'Your Knowledge Universe',
      stats: {
        documents: sessionsData.reduce((sum: number, s: any) => sum + s.stats.documents, 0),
        textNodes: sessionsData.reduce((sum: number, s: any) => sum + s.stats.textNodes, 0),
        images: sessionsData.reduce((sum: number, s: any) => sum + s.stats.images, 0),
        websites: sessionsData.reduce((sum: number, s: any) => sum + s.stats.websites, 0),
        totalWords: sessionsData.reduce((sum: number, s: any) => sum + s.stats.totalWords, 0),
      },
      nodeCount: sessionsData.reduce((sum: number, s: any) => sum + s.nodeCount, 0),
      lastModified: Date.now(),
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
    };

    // Create session nodes in a circle around the center with proper spacing
    const sessionNodes: SessionNode[] = sessionsData.map((session: any, i: number) => {
      const angle = (i / sessionsData.length) * Math.PI * 2;
      // Adjust radius based on number of sessions for optimal spacing
      const baseRadius = Math.min(rect.width, rect.height) * 0.35;
      const radius = sessionsData.length > 4 ? baseRadius * 1.1 : baseRadius;
      
      return {
        id: session.id as string,
        name: session.name,
        description: session.description,
        stats: session.stats,
        nodeCount: session.nodeCount,
        lastModified: session.lastModified,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5, // Small initial velocity for natural movement
        vy: (Math.random() - 0.5) * 0.5,
      };
    });

    const allNodes = [centralNode, ...sessionNodes];
    nodesRef.current = allNodes;

    // Physics constants - optimized for smooth, natural motion
    const DAMPING = 0.92; // Higher = smoother
    const REPULSION = 12000; // Push nodes apart
    const CENTER_ATTRACTION = 0.0015; // Pull toward center
    const ORBIT_FORCE = 0.4; // Circular motion
    const MIN_DISTANCE = 180; // Minimum space between nodes
    const MAX_VELOCITY = 3; // Prevent nodes from moving too fast

    // Force simulation - optimized
    const applyForces = () => {
      const nodes = nodesRef.current;
      const central = nodes[0];
      const rect = canvasRectRef.current;
      if (!rect) return;

      // Apply forces between all nodes
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Skip if being dragged
        if (draggedNodeRef.current?.id === node.id) continue;

        let fx = 0;
        let fy = 0;

        // Repulsion from other nodes (optimized: only check nearby nodes)
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          
          // Only apply repulsion if nodes are close
          if (dist < MIN_DISTANCE * 3) {
            const force = REPULSION / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        // Attraction to center (spring-like)
        const dx = central.x - node.x;
        const dy = central.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Spring force proportional to distance from ideal radius
        const idealRadius = Math.min(rect.width, rect.height) * 0.35;
        const radiusDiff = dist - idealRadius;
        fx += (dx / dist) * radiusDiff * CENTER_ATTRACTION;
        fy += (dy / dist) * radiusDiff * CENTER_ATTRACTION;

        // Circular orbit tendency (tangential force for smooth rotation)
        const angle = Math.atan2(dy, dx);
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        fx += perpX * ORBIT_FORCE;
        fy += perpY * ORBIT_FORCE;

        // Update velocity
        node.vx += fx;
        node.vy += fy;

        // Apply damping
        node.vx *= DAMPING;
        node.vy *= DAMPING;

        // Clamp velocity
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > MAX_VELOCITY) {
          node.vx = (node.vx / speed) * MAX_VELOCITY;
          node.vy = (node.vy / speed) * MAX_VELOCITY;
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Keep within bounds with soft boundaries
        const margin = 100;
        if (node.x < margin) {
          node.x = margin;
          node.vx *= -0.3;
        }
        if (node.x > rect.width - margin) {
          node.x = rect.width - margin;
          node.vx *= -0.3;
        }
        if (node.y < margin) {
          node.y = margin;
          node.vy *= -0.3;
        }
        if (node.y > rect.height - margin) {
          node.y = rect.height - margin;
          node.vy *= -0.3;
        }
      }
    };

    // Pre-calculate gradients (reuse across frames)
    const connectionGradients = new Map<string, CanvasGradient>();

    // Render function - optimized
    const render = () => {
      if (!ctx || !canvas) return;

      const rect = canvasRectRef.current;
      if (!rect) return;

      ctx.clearRect(0, 0, rect.width, rect.height);
      const nodes = nodesRef.current;
      const hovered = hoveredNodeRef.current;
      const selected = selectedNodeRef.current;

      // Draw connections - minimal aesthetic style
      const central = nodes[0];
      
      // Draw connections to center (main spokes)
      nodes.forEach((node, i) => {
        if (i === 0) return;
        
        const isNodeHighlighted = hovered?.id === node.id || selected?.id === node.id;
        const baseOpacity = 0.2;
        const opacity = isNodeHighlighted ? 0.5 : baseOpacity;
        
        // Gradient from session node to center
        const gradient = ctx.createLinearGradient(node.x, node.y, central.x, central.y);
        gradient.addColorStop(0, `rgba(233, 138, 83, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(233, 138, 83, ${opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(233, 138, 83, ${opacity * 0.3})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = isNodeHighlighted ? 2.5 : 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(central.x, central.y);
        ctx.stroke();
      });

      // Draw connections between nearby session nodes (subtle web effect)
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const isNodeHighlighted = hovered?.id === node.id || selected?.id === node.id;
        
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only connect very close nodes for minimal aesthetic
          if (distance < 250) {
            const isOtherHighlighted = hovered?.id === other.id || selected?.id === other.id;
            const baseOpacity = (1 - (distance / 250)) * 0.06; // Very subtle
            const opacity = (isNodeHighlighted || isOtherHighlighted) ? baseOpacity * 3 : baseOpacity;
            
            ctx.strokeStyle = `rgba(233, 138, 83, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes - minimal aesthetic design
      nodes.forEach((node, i) => {
        const isCentral = i === 0;
        const radius = isCentral ? 70 : 45; // Slightly smaller for cleaner look
        const isHovered = hovered?.id === node.id;
        const isSelected = selected?.id === node.id;
        const isHighlighted = isHovered || isSelected;

        // Subtle outer glow (minimal)
        if (isCentral || isHighlighted) {
          const glowRadius = radius * 1.8;
          const glowIntensity = isCentral ? 0.4 : 0.3;
          
          const glowGradient = ctx.createRadialGradient(
            node.x, node.y, radius * 0.7,
            node.x, node.y, glowRadius
          );
          glowGradient.addColorStop(0, `rgba(233, 138, 83, ${glowIntensity})`);
          glowGradient.addColorStop(1, 'rgba(233, 138, 83, 0)');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle with gradient
        const nodeGradient = ctx.createRadialGradient(
          node.x - radius * 0.3, node.y - radius * 0.3, 0,
          node.x, node.y, radius
        );
        
        if (isCentral) {
          nodeGradient.addColorStop(0, 'rgba(233, 138, 83, 1)');
          nodeGradient.addColorStop(1, 'rgba(233, 138, 83, 0.7)');
        } else {
          const highlightIntensity = isHighlighted ? 0.98 : 0.95;
          nodeGradient.addColorStop(0, `rgba(50, 50, 50, ${highlightIntensity})`);
          nodeGradient.addColorStop(1, `rgba(20, 20, 20, ${highlightIntensity})`);
        }
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Border with pulse effect on hover
        const time = Date.now() * 0.001;
        const pulseIntensity = isHighlighted ? 0.2 + Math.sin(time * 3) * 0.1 : 0;
        const borderOpacity = isCentral ? 1 : isHighlighted ? 0.9 + pulseIntensity : 0.35;
        
        ctx.strokeStyle = `rgba(233, 138, 83, ${borderOpacity})`;
        ctx.lineWidth = isCentral ? 4 : isHighlighted ? 3 : 2;
        ctx.stroke();

        // Node name
        ctx.fillStyle = isCentral ? '#ffffff' : '#e0e0e0';
        ctx.font = isCentral ? 'bold 18px monospace' : 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Truncate name if too long
        let displayName = node.name;
        if (!isCentral && displayName.length > 15) {
          displayName = displayName.substring(0, 12) + '...';
        }
        
        ctx.fillText(displayName, node.x, node.y);

        // Node count for session nodes
        if (!isCentral && node.nodeCount > 0) {
          ctx.font = '10px monospace';
          ctx.fillStyle = '#888888';
          ctx.fillText(`${node.nodeCount} nodes`, node.x, node.y + 20);
        }
      });
    };

    // Animation loop
    const animate = () => {
      applyForces();
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle mouse interactions - optimized
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRectRef.current || canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseRef.current = { x, y };

      // Handle dragging
      if (isDraggingRef.current && draggedNodeRef.current) {
        const node = draggedNodeRef.current;
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
        return;
      }

      // Check for node hover
      let found: SessionNode | null = null;
      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        const radius = node.id === 'center' ? 80 : 50;
        const dx = x - node.x;
        const dy = y - node.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radius * radius) {
          found = node;
          break;
        }
      }

      if (found?.id !== hoveredNodeRef.current?.id) {
        setHoveredNode(found);
      }
      canvas.style.cursor = found ? (isDraggingRef.current ? 'grabbing' : 'grab') : 'default';
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvasRectRef.current || canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on a node
      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        const radius = node.id === 'center' ? 80 : 50;
        const dx = x - node.x;
        const dy = y - node.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radius * radius) {
          isDraggingRef.current = true;
          draggedNodeRef.current = node;
          canvas.style.cursor = 'grabbing';
          e.preventDefault();
          return;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current && draggedNodeRef.current) {
        isDraggingRef.current = false;
        draggedNodeRef.current = null;
        
        // Check if we're still over the same node for click action
        const rect = canvasRectRef.current || canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        nodesRef.current.forEach((node) => {
          const radius = node.id === 'center' ? 80 : 50;
          const dx = x - node.x;
          const dy = y - node.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < radius * radius) {
            setSelectedNode(node);
            if (node.id !== 'center') {
              navigate(`/home?session=${node.id}`);
            }
          }
        });
        
        canvas.style.cursor = hoveredNodeRef.current ? 'grab' : 'default';
      }
    };


    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseup', handleMouseUp); // Catch mouseup outside canvas

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sessionsData, navigate]);

  const totalSessions = sessionsData?.length || 0;
  const totalNodes = sessionsData?.reduce((sum: number, s: any) => sum + s.nodeCount, 0) || 0;
  const totalWords = sessionsData?.reduce((sum: number, s: any) => sum + s.stats.totalWords, 0) || 0;

  return (
    <div className="w-full h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 z-10 p-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="backdrop-blur-xl bg-card/50 border-border/50 hover:bg-card/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Canvas
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg backdrop-blur-xl">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Second Brain
              </h1>
              <p className="text-xs text-muted-foreground">
                Your Knowledge Graph
              </p>
            </div>
          </div>

          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </motion.div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Stats Panel */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute left-6 top-24 z-10"
      >
        <Card className="p-4 backdrop-blur-xl bg-card/80 border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold">{totalSessions} Sessions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{totalNodes} Nodes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="w-4 h-4" />
            <span>{totalWords.toLocaleString()} Words</span>
          </div>
        </Card>
      </motion.div>

      {/* Hovered Node Info */}
      {hoveredNode && hoveredNode.id !== 'center' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute right-6 bottom-6 z-10"
        >
          <Card className="p-4 backdrop-blur-xl bg-card/90 border-border/50 min-w-[300px]">
            <h3 className="font-bold text-lg mb-2">{hoveredNode.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {hoveredNode.description || 'No description'}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>{hoveredNode.stats.textNodes} Text</span>
              </div>
              <div className="flex items-center gap-2">
                <File className="w-3.5 h-3.5 text-primary" />
                <span>{hoveredNode.stats.documents} Docs</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span>{hoveredNode.stats.images} Images</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{hoveredNode.stats.websites} Web</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Updated {new Date(hoveredNode.lastModified).toLocaleDateString()}</span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground italic">
              Click to open session
            </p>
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      {totalSessions === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <Card className="p-8 backdrop-blur-xl bg-card/90 border-primary/30 text-center max-w-md">
            <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your Second Brain Awaits</h2>
            <p className="text-muted-foreground mb-4">
              Create your first session to start building your knowledge graph
            </p>
            <Button
              onClick={() => navigate('/home')}
              className="bg-primary hover:bg-primary/90"
            >
              Create First Session
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
