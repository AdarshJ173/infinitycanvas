import React, { useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X,
  File,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NodeStatus = 'empty' | 'uploading' | 'processing' | 'ready' | 'error';

interface DocumentNodeData {
  label: string;
  fileName?: string;
  fileSize?: number;
  ragieDocumentId?: string;
  ragieStatus?: 'uploading' | 'processing' | 'ready' | 'error';
  textContent?: string;
  uploadProgress?: number;
  status: NodeStatus;
  errorMessage?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  pageCount?: number;
  wordCount?: number;
  metadata?: any;
  onFileUpload?: (file: File) => void;
  onRemoveFile?: () => void;
}

export function DocumentNode({ data, selected }: NodeProps<DocumentNodeData>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && data.onFileUpload) {
      validateAndUpload(file);
    }
    // Reset input to allow same file selection
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      console.error('Only PDF files are supported');
      // You could trigger error state here if needed
      return;
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File size exceeds 10MB limit');
      return;
    }

    // Call upload handler
    if (data.onFileUpload) {
      data.onFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = (event: React.MouseEvent) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data.onRemoveFile) {
      data.onRemoveFile();
    }
  };

  const getStatusDisplay = () => {
    switch (data.ragieStatus) {
      case 'uploading':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Uploading to Ragie...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Ragie processing...</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Ready for AI</span>
            <Zap className="w-3 h-3" />
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Processing failed</span>
          </div>
        );
      default:
        return (
          <span className="text-xs text-destructive">Not configured</span>
        );
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'uploading': return 'border-blue-400';
      case 'processing': return 'border-amber-400';
      case 'ready': return 'border-emerald-400';
      case 'error': return 'border-red-400';
      default: return 'border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative bg-card border-2 rounded-lg shadow-lg min-w-[280px] max-w-[340px] transition-all duration-200",
        getStatusColor(),
        selected && "ring-2 ring-primary ring-opacity-50 shadow-xl",
        dragOver && "ring-2 ring-blue-500 ring-opacity-70 border-blue-500 shadow-xl scale-105"
      )}
      whileHover={{ scale: dragOver ? 1.05 : 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Node Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-t-lg border-b-2 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 rounded flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground truncate">
              Document Node
            </span>
            {data.ragieDocumentId && (
              <div className="w-2 h-2 bg-purple-500 rounded-full" title="Powered by Ragie AI" />
            )}
          </div>
          {getStatusDisplay()}
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {data.status === 'empty' ? (
            // Upload Area
            <motion.div
              key="upload-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
                dragOver 
                  ? "border-blue-500 bg-blue-500/10 scale-105" 
                  : "border-border hover:border-orange-400 hover:bg-orange-500/5"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={openFileDialog}
            >
              <motion.div
                animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {dragOver ? 'Drop PDF here' : 'Upload PDF Document'}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Drag & drop or click to browse
                </p>
                <div className="text-xs text-muted-foreground/70 space-y-0.5">
                  <div>• PDF files only</div>
                  <div>• Maximum 10MB</div>
                </div>
              </motion.div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          ) : (
            // File Info Display
            <motion.div
              key="file-info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* File Preview Card */}
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                <motion.div 
                  className="w-12 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20 rounded border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center flex-shrink-0 shadow-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <File className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate" title={data.fileName}>
                    {data.fileName || 'document.pdf'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {data.fileSize && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatFileSize(data.fileSize)}
                      </span>
                    )}
                    {data.pageCount && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {data.pageCount} pages
                        </span>
                      </>
                    )}
                  </div>
                  
                  {data.ragieDocumentId && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 bg-purple-500 rounded-full" />
                      <span className="text-xs text-purple-400">
                        ID: {data.ragieDocumentId.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Remove Button */}
                {data.onRemoveFile && data.status === 'ready' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={handleRemove}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Progress Bar for Uploading */}
              {data.status === 'uploading' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="text-blue-500 font-medium">{data.uploadProgress || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${data.uploadProgress || 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Processing Indicator */}
              {data.status === 'processing' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                >
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Extracting text content...
                  </span>
                </motion.div>
              )}

              {/* Error Message */}
              {data.status === 'error' && data.errorMessage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {data.errorMessage}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-1 text-xs text-red-600 dark:text-red-400"
                        onClick={openFileDialog}
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Ragie Ready State */}
              {data.ragieStatus === 'ready' && (
                <div className="bg-green-900/20 border border-green-700/30 rounded p-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      AI-searchable via Ragie RAG
                    </span>
                  </div>
                </div>
              )}

              {/* Success State with Content Preview */}
              {data.status === 'ready' && data.textContent && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Ready for AI processing
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {data.textContent.length > 150 
                        ? `${data.textContent.substring(0, 150)}...`
                        : data.textContent
                      }
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {data.wordCount || data.textContent.split(/\s+/).filter(w => w.length > 0).length} words extracted
                    </span>
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="h-auto p-1 text-xs hover:text-orange-500"
                      onClick={openFileDialog}
                    >
                      Replace
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-orange-500 bg-background hover:bg-orange-500 transition-colors"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-orange-500 bg-background hover:bg-orange-500 transition-colors"
        style={{ left: -6 }}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </motion.div>
  );
}
