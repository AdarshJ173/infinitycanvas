import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextNodeData {
  label: string;
  content: string;
  name: string;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
  onNameChange?: (name: string) => void;
}

export function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [content, setContent] = useState(data.content || '');
  const [name, setName] = useState(data.name || 'Text Node');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
      
      // Auto-resize on mount
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Auto-save functionality (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (data.onContentChange && content !== data.content) {
        data.onContentChange(content);
        console.log('Auto-saved:', content.substring(0, 30) + '...');
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, data]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Immediate save on exit
    if (data.onContentChange && content !== data.content) {
      data.onContentChange(content);
      console.log('Saved on blur');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      if (data.onContentChange && content !== data.content) {
        data.onContentChange(content);
      }
      // Blur the textarea
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
    // Prevent event from bubbling to ReactFlow
    e.stopPropagation();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative bg-card border-2 border-border rounded-lg shadow-lg min-w-[220px] max-w-[320px] transition-all duration-200",
        selected && "ring-2 ring-primary ring-opacity-50 shadow-xl",
        isEditing && "ring-2 ring-secondary ring-opacity-70 shadow-xl border-secondary"
      )}
      whileHover={{ scale: isEditing ? 1.0 : 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Node Header */}
      <div className="px-3 py-2 bg-muted/20 rounded-t-lg border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isEditing ? "bg-secondary animate-pulse" : "bg-primary"
          )} />
          <span className="text-xs font-medium text-muted-foreground truncate flex-1">
            {name}
          </span>
          {!content && !isEditing && (
            <span className="text-xs text-orange-500 font-semibold">Empty</span>
          )}
          {isEditing && (
            <span className="text-xs text-secondary font-semibold">Editing</span>
          )}
        </div>
      </div>

      {/* Node Content */}
      <div 
        className="p-4 min-h-[100px] relative"
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isEditing ? 'text' : 'pointer' }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Start typing your knowledge... (Press Escape to finish)"
            className={cn(
              "w-full bg-transparent border-none outline-none resize-none",
              "text-sm text-foreground placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-0"
            )}
            style={{ 
              minHeight: '60px',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              overflow: 'hidden'
            }}
          />
        ) : (
          <div className="text-sm text-foreground whitespace-pre-wrap break-words">
            {content || (
              <span className="text-muted-foreground italic">
                Double-click to add content...
              </span>
            )}
          </div>
        )}
        
        {/* Edit indicator */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full animate-pulse"
          />
        )}

        {/* Word count badge */}
        {content && !isEditing && (
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 font-mono">
            {content.split(/\s+/).filter(w => w.length > 0).length} words
          </div>
        )}
      </div>

      {/* Hint text at bottom */}
      {!isEditing && !content && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground/60 border-t border-border/50 bg-muted/10 rounded-b-lg">
          💡 Double-click anywhere to start
        </div>
      )}

      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-primary bg-background hover:bg-primary transition-colors"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-primary bg-background hover:bg-primary transition-colors"
        style={{ left: -6 }}
      />
    </motion.div>
  );
}
