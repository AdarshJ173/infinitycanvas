import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, Image as ImageIcon, Globe, Clock, Plus, Layers } from 'lucide-react';
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
  
  const sessionsData = useQuery(api.sessions.getSessionsStats);

  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    if (!sessionsData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.willChange = 'transform';

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);
      
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
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const rect = canvasRectRef.current;
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const centralNode: SessionNode = {
      id: 'center',
      name: 'Second Brain',
      description: 'Your Knowledge',
      stats: {
        documents: sessionsData.reduce((sum: number, s: unknown) => sum + (s as { stats: { documents: number } }).stats.documents, 0),
        textNodes: sessionsData.reduce((sum: number, s: unknown) => sum + (s as { stats: { textNodes: number } }).stats.textNodes, 0),
        images: sessionsData.reduce((sum: number, s: unknown) => sum + (s as { stats: { images: number } }).stats.images, 0),
        websites: sessionsData.reduce((sum: number, s: unknown) => sum + (s as { stats: { websites: number } }).stats.websites, 0),
        totalWords: sessionsData.reduce((sum: number, s: unknown) => sum + (s as { stats: { totalWords: number } }).stats.totalWords, 0),
      },
      nodeCount: sessionsData.reduce((sum: number, s: unknown) => sum + (s as { nodeCount: number }).nodeCount, 0),
      lastModified: Date.now(),
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
    };

    const sessionNodes: SessionNode[] = sessionsData.map((session: unknown, i: number) => {
      const s = session as { id: string; name: string; description?: string; stats: SessionNode['stats']; nodeCount: number; lastModified: number };
      const angle = (i / sessionsData.length) * Math.PI * 2;
      const baseRadius = Math.min(rect.width, rect.height) * 0.35;
      const radius = sessionsData.length > 4 ? baseRadius * 1.1 : baseRadius;
      
      return {
        id: s.id as string,
        name: s.name,
        description: s.description,
        stats: s.stats,
        nodeCount: s.nodeCount,
        lastModified: s.lastModified,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      };
    });

    const allNodes = [centralNode, ...sessionNodes];
    nodesRef.current = allNodes;

    const DAMPING = 0.92;
    const REPULSION = 12000;
    const CENTER_ATTRACTION = 0.0015;
    const ORBIT_FORCE = 0.4;
    const MIN_DISTANCE = 180;
    const MAX_VELOCITY = 3;

    const applyForces = () => {
      const nodes = nodesRef.current;
      const central = nodes[0];
      const rect = canvasRectRef.current;
      if (!rect) return;

      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        
        if (draggedNodeRef.current?.id === node.id) continue;

        let fx = 0;
        let fy = 0;

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          
          if (dist < MIN_DISTANCE * 3) {
            const force = REPULSION / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        const dx = central.x - node.x;
        const dy = central.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const idealRadius = Math.min(rect.width, rect.height) * 0.35;
        const radiusDiff = dist - idealRadius;
        fx += (dx / dist) * radiusDiff * CENTER_ATTRACTION;
        fy += (dy / dist) * radiusDiff * CENTER_ATTRACTION;

        const angle = Math.atan2(dy, dx);
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        fx += perpX * ORBIT_FORCE;
        fy += perpY * ORBIT_FORCE;

        node.vx += fx;
        node.vy += fy;
        node.vx *= DAMPING;
        node.vy *= DAMPING;

        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > MAX_VELOCITY) {
          node.vx = (node.vx / speed) * MAX_VELOCITY;
          node.vy = (node.vy / speed) * MAX_VELOCITY;
        }

        node.x += node.vx;
        node.y += node.vy;

        const margin = 100;
        if (node.x < margin) { node.x = margin; node.vx *= -0.3; }
        if (node.x > rect.width - margin) { node.x = rect.width - margin; node.vx *= -0.3; }
        if (node.y < margin) { node.y = margin; node.vy *= -0.3; }
        if (node.y > rect.height - margin) { node.y = rect.height - margin; node.vy *= -0.3; }
      }
    };

    const render = () => {
      if (!ctx || !canvas) return;

      const rect = canvasRectRef.current;
      if (!rect) return;

      ctx.clearRect(0, 0, rect.width, rect.height);
      const nodes = nodesRef.current;
      const hovered = hoveredNodeRef.current;
      const selected = selectedNodeRef.current;

      const central = nodes[0];
      
      nodes.forEach((node, i) => {
        if (i === 0) return;
        
        const isNodeHighlighted = hovered?.id === node.id || selected?.id === node.id;
        const baseOpacity = 0.15;
        const opacity = isNodeHighlighted ? 0.4 : baseOpacity;
        
        const gradient = ctx.createLinearGradient(node.x, node.y, central.x, central.y);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(0, 0, 0, ${opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${opacity * 0.2})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = isNodeHighlighted ? 2 : 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(central.x, central.y);
        ctx.stroke();
      });

      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const isNodeHighlighted = hovered?.id === node.id || selected?.id === node.id;
        
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 250) {
            const isOtherHighlighted = hovered?.id === other.id || selected?.id === other.id;
            const baseOpacity = (1 - (distance / 250)) * 0.04;
            const opacity = (isNodeHighlighted || isOtherHighlighted) ? baseOpacity * 3 : baseOpacity;
            
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node, i) => {
        const isCentral = i === 0;
        const radius = isCentral ? 60 : 40;
        const isHovered = hovered?.id === node.id;
        const isSelected = selected?.id === node.id;
        const isHighlighted = isHovered || isSelected;

        if (isCentral || isHighlighted) {
          const glowRadius = radius * 2;
          const glowIntensity = isCentral ? 0.15 : 0.1;
          
          const glowGradient = ctx.createRadialGradient(
            node.x, node.y, radius * 0.5,
            node.x, node.y, glowRadius
          );
          glowGradient.addColorStop(0, `rgba(0, 0, 0, ${glowIntensity})`);
          glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        const nodeGradient = ctx.createRadialGradient(
          node.x - radius * 0.3, node.y - radius * 0.3, 0,
          node.x, node.y, radius
        );
        
        if (isCentral) {
          nodeGradient.addColorStop(0, '#1a1a1a');
          nodeGradient.addColorStop(1, '#0a0a0a');
        } else {
          const highlightIntensity = isHighlighted ? 0.95 : 0.9;
          nodeGradient.addColorStop(0, `rgba(30, 30, 30, ${highlightIntensity})`);
          nodeGradient.addColorStop(1, `rgba(10, 10, 10, ${highlightIntensity})`);
        }
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        const borderOpacity = isCentral ? 0.8 : isHighlighted ? 0.6 : 0.25;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${borderOpacity})`;
        ctx.lineWidth = isCentral ? 2 : isHighlighted ? 1.5 : 1;
        ctx.stroke();

        ctx.fillStyle = isCentral ? '#ffffff' : '#d0d0d0';
        ctx.font = isCentral ? 'bold 16px system-ui' : 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let displayName = node.name;
        if (!isCentral && displayName.length > 12) {
          displayName = displayName.substring(0, 10) + '...';
        }
        
        ctx.fillText(displayName, node.x, node.y);

        if (!isCentral && node.nodeCount > 0) {
          ctx.font = '9px system-ui';
          ctx.fillStyle = '#707070';
          ctx.fillText(`${node.nodeCount}`, node.x, node.y + 16);
        }
      });
    };

    const animate = () => {
      applyForces();
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRectRef.current || canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseRef.current = { x, y };

      if (isDraggingRef.current && draggedNodeRef.current) {
        const node = draggedNodeRef.current;
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
        return;
      }

      let found: SessionNode | null = null;
      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        const radius = node.id === 'center' ? 70 : 45;
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

      for (let i = 0; i < nodesRef.current.length; i++) {
        const node = nodesRef.current[i];
        const radius = node.id === 'center' ? 70 : 45;
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
        
        const rect = canvasRectRef.current || canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        nodesRef.current.forEach((node) => {
          const radius = node.id === 'center' ? 70 : 45;
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
    window.addEventListener('mouseup', handleMouseUp);

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
  const totalNodes = sessionsData?.reduce((sum: number, s: unknown) => sum + (s as { nodeCount: number }).nodeCount, 0) || 0;
  const totalWords = sessionsData?.reduce((sum: number, s: unknown) => sum + (s as { stats: { totalWords: number } }).stats.totalWords, 0) || 0;

  return (
    <div className="w-full h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,30,30,0.3),_transparent_70%)]" />
      </div>
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 z-10 px-6 py-4"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-4 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">Canvas</span>
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur border border-border/50">
            <div className="w-5 h-5 rounded-md bg-foreground flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-background" />
            </div>
            <span className="text-sm font-medium">Second Brain</span>
          </div>

          <div className="w-[70px]" />
        </div>
      </motion.div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Stats Panel */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute left-6 top-20 z-10"
      >
        <Card className="p-3 bg-background/80 backdrop-blur border-border/30 space-y-2 min-w-[140px]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sessions</span>
            <span className="font-medium">{totalSessions}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nodes</span>
            <span className="font-medium">{totalNodes}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Words</span>
            <span className="font-medium">{totalWords.toLocaleString()}</span>
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
          <Card className="p-4 bg-background/90 backdrop-blur border-border/30 min-w-[280px]">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold">{hoveredNode.name}</h3>
              <span className="text-xs text-muted-foreground">{hoveredNode.nodeCount} nodes</span>
            </div>
            
            {hoveredNode.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {hoveredNode.description}
              </p>
            )}
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="flex flex-col items-center gap-1 p-2 rounded bg-muted/30">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{hoveredNode.stats.textNodes}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded bg-muted/30">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{hoveredNode.stats.documents}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded bg-muted/30">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{hoveredNode.stats.images}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded bg-muted/30">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{hoveredNode.stats.websites}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(hoveredNode.lastModified).toLocaleDateString()}
              </span>
              <span className="text-foreground/60">Click to open</span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {totalSessions === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <Card className="p-8 bg-background/90 backdrop-blur border-border/30 text-center max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No Sessions Yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create sessions on your canvas to build your knowledge graph
            </p>
            <Button
              onClick={() => navigate('/home')}
              className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
