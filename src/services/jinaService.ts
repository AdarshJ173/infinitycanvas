/**
 * Jina Reader Service
 * 
 * Provides clean, LLM-friendly content extraction from any URL
 * Converts web pages to structured Markdown format
 * Removes ads, navigation, and clutter for AI consumption
 * 
 * API Docs: https://jina.ai/reader/
 */

export interface JinaReaderResponse {
  title: string;
  description: string;
  url: string;
  content: string; // Clean Markdown content
  author?: string;
  siteName?: string;
  publishedTime?: string;
  images?: string[];
  success: boolean;
  error?: string;
}

export interface JinaSearchResult {
  title: string;
  url: string;
  content: string;
  description: string;
}

export class JinaService {
  private static READER_API_BASE = 'https://r.jina.ai';
  private static SEARCH_API_BASE = 'https://s.jina.ai';
  private static API_KEY = import.meta.env.VITE_JINA_API_KEY; // Optional - 200 RPM with key vs 20 RPM without

  /**
   * Extract clean content from any URL
   * Converts web pages to LLM-friendly Markdown format
   */
  static async extractContent(url: string): Promise<JinaReaderResponse> {
    try {
      // Construct Jina Reader URL
      const jinaUrl = `${this.READER_API_BASE}/${url}`;
      
      // Build headers
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'X-With-Generated-Alt': 'true', // Enable image captioning
        'X-With-Links-Summary': 'true', // Include links summary
        'X-Retain-Images': 'all', // Keep image references
      };

      // Add API key if available (increases rate limit to 200 RPM)
      if (this.API_KEY) {
        headers['Authorization'] = `Bearer ${this.API_KEY}`;
      }

      console.log('🔍 Fetching content via Jina Reader:', url);
      const startTime = Date.now();

      const response = await fetch(jinaUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      console.log(`✅ Jina Reader extracted content in ${processingTime}ms`);

      // Parse the response
      return {
        title: data.data?.title || this.extractDomain(url),
        description: data.data?.description || '',
        url: url,
        content: data.data?.content || '',
        author: data.data?.author,
        siteName: data.data?.siteName,
        publishedTime: data.data?.publishedTime,
        images: data.data?.images || [],
        success: true,
      };

    } catch (error) {
      console.error('❌ Jina Reader extraction failed:', error);
      return {
        title: this.extractDomain(url),
        description: '',
        url: url,
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search the web and get clean content from top results
   * Returns top 5 results with their content extracted
   */
  static async searchWeb(query: string): Promise<JinaSearchResult[]> {
    try {
      if (!this.API_KEY) {
        throw new Error('Jina API key required for search endpoint');
      }

      const searchUrl = `${this.SEARCH_API_BASE}?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jina Search API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data?.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        description: result.description,
      })) || [];

    } catch (error) {
      console.error('❌ Jina Search failed:', error);
      return [];
    }
  }

  /**
   * Format extracted content for AI context
   * Creates structured context string optimized for LLM consumption
   */
  static formatForContext(jinaData: JinaReaderResponse): string {
    if (!jinaData.success || !jinaData.content) {
      return `Website: ${jinaData.title}\nURL: ${jinaData.url}\n\n[Content extraction failed]`;
    }

    let context = `Website: ${jinaData.title}\nURL: ${jinaData.url}\n`;

    if (jinaData.author) {
      context += `Author: ${jinaData.author}\n`;
    }

    if (jinaData.siteName) {
      context += `Site: ${jinaData.siteName}\n`;
    }

    if (jinaData.publishedTime) {
      context += `Published: ${new Date(jinaData.publishedTime).toLocaleDateString()}\n`;
    }

    if (jinaData.description) {
      context += `\nDescription:\n${jinaData.description}\n`;
    }

    // Add clean content (truncate if too long to avoid token limits)
    const maxContentLength = 8000; // ~2000 tokens
    const content = jinaData.content.length > maxContentLength
      ? jinaData.content.substring(0, maxContentLength) + '\n\n[Content truncated...]'
      : jinaData.content;

    context += `\nContent:\n${content}`;

    if (jinaData.images && jinaData.images.length > 0) {
      context += `\n\nImages: ${jinaData.images.length} image(s) available`;
    }

    return context.trim();
  }

  /**
   * Get a content summary optimized for node display
   * Creates a short preview of the extracted content
   */
  static getContentSummary(content: string, maxLength: number = 300): string {
    if (!content) return '';

    // Remove markdown formatting for cleaner summary
    let summary = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .trim();

    // Truncate to max length
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength).trim();
      // Find last sentence end
      const lastPeriod = summary.lastIndexOf('.');
      const lastQuestion = summary.lastIndexOf('?');
      const lastExclamation = summary.lastIndexOf('!');
      const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
      
      if (lastSentenceEnd > maxLength * 0.7) {
        summary = summary.substring(0, lastSentenceEnd + 1);
      } else {
        summary += '...';
      }
    }

    return summary;
  }

  /**
   * Extract domain name from URL for fallback display
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'Website';
    }
  }

  /**
   * Check if URL is likely to work with Jina Reader
   * Some sites may block scraping or require special handling
   */
  static isUrlSupported(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Blocked domains (add more as needed)
      const blockedDomains = [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
      ];

      return !blockedDomains.some(domain => hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Estimate reading time from content
   */
  static estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Extract key topics from content (simple keyword extraction)
   */
  static extractKeyTopics(content: string, maxTopics: number = 5): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    ]);

    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Get top topics
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics)
      .map(([word]) => word);
  }
}

export default JinaService;
