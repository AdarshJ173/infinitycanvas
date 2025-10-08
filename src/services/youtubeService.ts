export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  transcript: string;
  duration: string;
}

export class YouTubeService {
  private static API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  /**
   * Extract video ID from various YouTube URL formats
   */
  static extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      
      // youtu.be/VIDEO_ID
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is a YouTube video
   */
  static isYouTubeUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
    } catch {
      return false;
    }
  }

  /**
   * Fetch video metadata from YouTube API
   */
  static async getVideoMetadata(videoId: string): Promise<YouTubeVideoData> {
    if (!this.API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    // Fetch video details
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.API_KEY}`
    );

    if (!videoResponse.ok) {
      throw new Error(`YouTube API error: ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = videoData.items[0];
    const snippet = video.snippet;

    // Try to fetch captions/transcript
    let transcript = '';
    try {
      transcript = await this.getVideoTranscript(videoId);
    } catch (error) {
      console.warn('Could not fetch transcript:', error);
      // Transcript not available is not a critical error
    }

    return {
      videoId,
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      thumbnail: snippet.thumbnails.medium.url,
      transcript,
      duration: video.contentDetails.duration,
    };
  }

  /**
   * Fetch video transcript/captions
   * Note: YouTube API doesn't provide direct caption access in v3.
   * We'll try to get it through caption tracks if available.
   */
  static async getVideoTranscript(videoId: string): Promise<string> {
    if (!this.API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    try {
      // Get caption tracks
      const captionsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${this.API_KEY}`
      );

      if (!captionsResponse.ok) {
        throw new Error('Captions not available');
      }

      const captionsData = await captionsResponse.json();

      if (!captionsData.items || captionsData.items.length === 0) {
        throw new Error('No captions available for this video');
      }

      // Find English caption track
      const englishCaption = captionsData.items.find(
        (item: any) => item.snippet.language === 'en'
      ) || captionsData.items[0];

      // Note: Downloading caption content requires OAuth
      // For now, we'll indicate captions are available but can't fetch content
      return `[Captions available in ${englishCaption.snippet.language}]`;
      
    } catch (error) {
      // If captions API fails, return empty
      return '';
    }
  }

  /**
   * Format video data for AI context
   */
  static formatForContext(videoData: YouTubeVideoData): string {
    return `
YouTube Video: ${videoData.title}
Channel: ${videoData.channelTitle}
Published: ${new Date(videoData.publishedAt).toLocaleDateString()}

Description:
${videoData.description}

${videoData.transcript ? `Transcript:\n${videoData.transcript}` : ''}
    `.trim();
  }
}

export default YouTubeService;
