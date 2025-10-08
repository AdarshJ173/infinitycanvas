import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Upload, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageNodeData {
  label: string;
  imageUrl?: string;
  imageName?: string;
  status?: 'empty' | 'loading' | 'ready' | 'error';
  onImageUpload?: (file: File) => void;
  onUrlChange?: (url: string) => void;
  onRemove?: () => void;
}

export const ImageNode = memo(({ data, selected }: NodeProps<ImageNodeData>) => {
  const [urlInput, setUrlInput] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      data.onImageUpload?.(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      data.onUrlChange?.(urlInput.trim());
      setIsEditingUrl(false);
      setUrlInput('');
    }
  };

  return (
    <Card
      className={cn(
        'min-w-[280px] max-w-[400px] bg-card border-2 transition-all',
        selected ? 'border-blue-500 shadow-lg' : 'border-border shadow-md',
        'hover:shadow-xl'
      )}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />

      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{data.label}</span>
        </div>
        {data.imageUrl && data.onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={data.onRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {!data.imageUrl ? (
          <div className="space-y-3">
            {/* Upload Option */}
            <label className="block">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-muted/50 transition-all">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF, WebP
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* URL Option */}
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {isEditingUrl ? (
              <div className="space-y-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  autoFocus
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="flex-1"
                  >
                    Add URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingUrl(false);
                      setUrlInput('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsEditingUrl(true)}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Add from URL
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Image Display */}
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={data.imageUrl}
                alt={data.imageName || 'Uploaded image'}
                className="w-full h-auto max-h-[300px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage Error%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            {/* Image Info */}
            {data.imageName && (
              <p className="text-xs text-muted-foreground truncate">
                {data.imageName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status Badge */}
      {data.status && data.status !== 'empty' && (
        <div className="px-3 pb-3">
          <div
            className={cn(
              'text-xs px-2 py-1 rounded-full text-center',
              data.status === 'loading' && 'bg-blue-500/10 text-blue-500',
              data.status === 'ready' && 'bg-green-500/10 text-green-500',
              data.status === 'error' && 'bg-red-500/10 text-red-500'
            )}
          >
            {data.status === 'loading' && '⏳ Loading...'}
            {data.status === 'ready' && '✓ Ready'}
            {data.status === 'error' && '✗ Error loading image'}
          </div>
        </div>
      )}
    </Card>
  );
});

ImageNode.displayName = 'ImageNode';
