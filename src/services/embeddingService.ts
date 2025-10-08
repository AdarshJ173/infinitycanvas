import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js to run in browser
env.allowRemoteModels = true;
// env.remoteURL is not a valid property - removed

class EmbeddingService {
  private static instance: EmbeddingService;
  private embedder: any = null;
  private isLoading = false;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  // Initialize the embedding model (run once)
  async initialize(): Promise<void> {
    if (this.embedder || this.isLoading) return;
    
    this.isLoading = true;
    console.log('🔄 Loading Sentence Transformer model...');
    
    try {
      // Use all-MiniLM-L6-v2 (384 dimensions, 23MB)
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      console.log('✅ Embedding model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Generate embeddings for text
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.initialize();
    }

    try {
      // Clean and prepare text
      const cleanText = text.trim().substring(0, 512); // Limit to 512 chars
      
      // Generate embedding
      const output = await this.embedder(cleanText, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Convert tensor to array
      const embedding = Array.from(output.data) as number[];
      
      console.log(`✅ Generated embedding (${embedding.length} dimensions)`);
      return embedding;
      
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  // Generate embeddings for multiple texts (batch processing)
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return embeddings;
  }

  // Calculate cosine similarity between two embeddings
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

export default EmbeddingService;
