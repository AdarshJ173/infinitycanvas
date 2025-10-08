import React, { useState, memo, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, ExternalLink, X, RefreshCw, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import YouTubeService from '@/services/youtubeService';

// Helper function to format YouTube ISO 8601 duration (PT1H2M10S) to readable format (1:02:10)
const formatYouTubeDuration = (duration: string): string => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface WebsiteNodeData {
  label: string;
  url?: string;
  title?: string;
  status?: 'empty' | 'loading' | 'ready' | 'error';
  isYouTube?: boolean;
  youtubeData?: any;
  jinaData?: any; // Jina Reader content data
  contentSummary?: string; // Generated content summary
  readingTime?: number; // Estimated reading time in minutes
  keyTopics?: string[]; // Extracted key topics from content
  onUrlChange?: (url: string) => void;
  onRemove?: () => void;
  onRefresh?: () => void;
}

export const WebsiteNode = memo(({ data, selected }: NodeProps<WebsiteNodeData>) => {
  const [urlInput, setUrlInput] = useState('');
  const [isEditing, setIsEditing] = useState(!data.url);
  const isYouTube = data.url ? YouTubeService.isYouTubeUrl(data.url) : false;

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      let url = urlInput.trim();
      // Add https:// if no protocol specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      data.onUrlChange?.(url);
      setIsEditing(false);
      setUrlInput('');
    }
  };

  const handleEdit = () => {
    setUrlInput(data.url || '');
    setIsEditing(true);
  };

  return (
    <Card
      className={cn(
        'min-w-[320px] max-w-[450px] bg-card border-2 transition-all',
        selected ? 'border-purple-500 shadow-lg' : 'border-border shadow-md',
        'hover:shadow-xl'
      )}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500"
      />

      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isYouTube ? (
            <div className="flex items-center gap-2">
              <div className="bg-red-600 rounded p-1">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-sm font-medium text-red-600">YouTube</span>
            </div>
          ) : (
            <>
              <Globe className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">{data.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {data.url && (
            <>
              {data.onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={data.onRefresh}
                  title="Refresh"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
              {data.onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={data.onRemove}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing || !data.url ? (
          <div className="space-y-3">
            <div className="text-center p-4">
              <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Enter a website URL to embed
              </p>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="https://example.com"
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
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Add URL
                </Button>
                {data.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setUrlInput('');
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Examples: google.com, youtube.com, github.com
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Website Preview/Info */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {data.title || new URL(data.url).hostname}
                  </p>
                  
                  {/* YouTube metadata */}
                  {isYouTube && data.youtubeData ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="font-medium">Channel:</span>
                        <span className="truncate">{data.youtubeData.channelTitle}</span>
                      </p>
                      {data.youtubeData.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Published:</span> {new Date(data.youtubeData.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                      {data.youtubeData.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {data.youtubeData.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Jina Reader metadata */
                    data.jinaData?.success && (
                      <div className="mt-2 space-y-1">
                        {data.contentSummary && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
                            {data.contentSummary}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {data.readingTime && (
                            <span className="flex items-center gap-1">
                              <span>📖</span>
                              <span>{data.readingTime} min read</span>
                            </span>
                          )}
                          {data.jinaData.author && (
                            <span className="truncate">
                              ✍️ {data.jinaData.author}
                            </span>
                          )}
                        </div>
                        
                        {data.keyTopics && data.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {data.keyTopics.slice(0, 3).map((topic: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:text-purple-600 shrink-0"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1"
              >
                Edit URL
              </Button>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="default" size="sm" className="w-full">
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Visit
                </Button>
              </a>
            </div>

            {/* YouTube Thumbnail or Website Iframe Preview */}
            {data.status === 'ready' && (
              <div className="border border-border rounded-lg overflow-hidden">
                {isYouTube && data.youtubeData?.thumbnail ? (
                  // YouTube Video Thumbnail
                  <div className="relative group cursor-pointer" onClick={() => window.open(data.url, '_blank')}>
                    <img
                      src={data.youtubeData.thumbnail}
                      alt={data.youtubeData.title || 'YouTube video'}
                      className="w-full h-[200px] object-cover"
                      onError={(e) => {
                        // Fallback to default YouTube thumbnail URL format
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('default.jpg')) {
                          target.src = `https://img.youtube.com/vi/${data.youtubeData.videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                    {/* Video Duration Badge (if available) */}
                    {data.youtubeData.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {formatYouTubeDuration(data.youtubeData.duration)}
                      </div>
                    )}
                  </div>
                ) : data.jinaData?.success && data.jinaData.content ? (
                  // Jina Reader Content Preview
                  <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 p-4">
                    <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
                      <p className="line-clamp-6 leading-relaxed">
                        {data.jinaData.content.substring(0, 500)}...
                      </p>
                    </div>
                    
                    {data.jinaData.images && data.jinaData.images.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>🖼️</span>
                          <span>{data.jinaData.images.length} image(s) in article</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center justify-center">
                      <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                      >
                        Read full article
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  // Fallback: Regular Website Iframe
                  <div className="bg-white">
                    <iframe
                      src={data.url}
                      className="w-full h-[200px]"
                      title={data.title || 'Website preview'}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Badge */}
      {data.status && data.status !== 'empty' && !isEditing && (
        <div className="px-3 pb-3">
          <div
            className={cn(
              'text-xs px-2 py-1 rounded-full text-center',
              data.status === 'loading' && 'bg-purple-500/10 text-purple-500',
              data.status === 'ready' && 'bg-green-500/10 text-green-500',
              data.status === 'error' && 'bg-red-500/10 text-red-500'
            )}
          >
            {data.status === 'loading' && `⏳ ${isYouTube ? 'Loading video...' : 'Extracting content...'}`}
            {data.status === 'ready' && `✓ ${!isYouTube && data.jinaData?.success ? 'Content extracted' : 'Ready'}`}
            {data.status === 'error' && '✗ Error loading content'}
          </div>
        </div>
      )}
    </Card>
  );
});

WebsiteNode.displayName = 'WebsiteNode';
