export interface RagieDocument {
  id: string;
  name: string;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  page_count?: number;
  word_count?: number;
}

export interface RagieSearchResult {
  text: string;
  score: number;
  document_id: string;
  document_name: string;
  page_number?: number;
}

export interface RagieResponse {
  answer: string;
  chunks: RagieSearchResult[];
  sources: string[];
}

class RagieService {
  private static instance: RagieService;
  private apiKey: string;

  private constructor() {
    // Use VITE_ prefix for client-side env vars
    this.apiKey = import.meta.env.VITE_RAGIE_API_KEY || 'tnt_QFPVjWDQTK_4jEnLm19mUoXD4JhHxkEUKbfP7APSbJFBAJrhKoYZ5D';
  }

  static getInstance(): RagieService {
    if (!RagieService.instance) {
      RagieService.instance = new RagieService();
    }
    return RagieService.instance;
  }

  // Upload document to Ragie
  async uploadDocument(
    file: File, 
    metadata: { scope: string; nodeId: string; canvasId: string }
  ): Promise<RagieDocument> {
    try {
      console.log(`🔄 Uploading ${file.name} to Ragie...`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('mode', 'hi_res'); // Extract images and tables

      const response = await fetch('https://api.ragie.ai/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ragie upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Document uploaded to Ragie with ID: ${result.id}`);
      
      return {
        id: result.id,
        name: file.name,
        status: result.status,
        created_at: result.created_at,
        page_count: result.page_count,
        word_count: result.word_count,
      };

    } catch (error) {
      console.error('❌ Ragie upload failed:', error);
      throw error;
    }
  }

  // Check document processing status
  async getDocumentStatus(documentId: string): Promise<RagieDocument> {
    try {
      const response = await fetch(`https://api.ragie.ai/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get document status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check document status:', error);
      throw error;
    }
  }

  // Search documents for relevant context
  async searchDocuments(
    query: string,
    filter?: { scope?: string; nodeId?: string; canvasId?: string }
  ): Promise<RagieSearchResult[]> {
    try {
      console.log(`🔍 Searching Ragie for: "${query.substring(0, 50)}..."`);

      const response = await fetch('https://api.ragie.ai/retrievals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          top_k: 6,
          rerank: true,
          filter: filter || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Ragie search failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`✅ Found ${result.scored_chunks?.length || 0} relevant chunks`);
      
      return result.scored_chunks?.map((chunk: any) => ({
        text: chunk.text,
        score: chunk.score,
        document_id: chunk.document_id,
        document_name: chunk.document_name,
        page_number: chunk.page_number,
      })) || [];

    } catch (error) {
      console.error('❌ Ragie search failed:', error);
      return [];
    }
  }

  // Generate AI response with Ragie context
  async generateResponse(
    query: string,
    filter?: { scope?: string; canvasId?: string }
  ): Promise<RagieResponse> {
    try {
      console.log(`🤖 Generating Ragie-powered response for: "${query}"`);

      const response = await fetch('https://api.ragie.ai/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          rerank: true,
          filter: filter || {},
          instructions: "You are Neuron AI, a learning assistant. Answer based on the user's uploaded documents. Be educational, precise, and reference specific documents when possible.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Ragie generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`✅ Generated response with ${result.scored_chunks?.length || 0} chunks`);
      
      const chunks = result.scored_chunks?.map((chunk: any) => ({
        text: chunk.text,
        score: chunk.score,
        document_id: chunk.document_id,
        document_name: chunk.document_name,
        page_number: chunk.page_number,
      })) || [];
      
      const sourceNames = (result.scored_chunks || [])
        .map((chunk: any) => chunk.document_name)
        .filter((name: any): name is string => typeof name === 'string');
      const uniqueSources = Array.from(new Set(sourceNames)) as string[];
      
      return {
        answer: result.answer,
        chunks,
        sources: uniqueSources,
      };

    } catch (error) {
      console.error('❌ Ragie generation failed:', error);
      throw error;
    }
  }

  // Delete document from Ragie
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.ragie.ai/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete document from Ragie:', error);
      return false;
    }
  }
}

export default RagieService;
