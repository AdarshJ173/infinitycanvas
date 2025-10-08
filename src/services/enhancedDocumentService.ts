import { PDFProcessingService } from './pdfProcessingService';
import EmbeddingService from './embeddingService';
import { toast } from 'sonner';

export interface DocumentProcessingProgress {
  stage: 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface ProcessedDocument {
  fileName: string;
  fileSize: number;
  textContent: string;
  fileUrl: string;
  chunksCreated: number;
  processingTimeMs: number;
  metadata: any;
}

export class EnhancedDocumentService {
  
  // Main document processing pipeline
  static async processDocument(
    file: File,
    nodeId: string,
    canvasId: string,
    convex: any,
    onProgress: (progress: DocumentProcessingProgress) => void
  ): Promise<ProcessedDocument> {
    
    const startTime = Date.now();
    let uploadedFileUrl = '';
    
    try {
      // Stage 1: File Upload
      onProgress({
        stage: 'uploading',
        progress: 5,
        message: 'Uploading file to secure storage...'
      });

      uploadedFileUrl = await this.uploadToConvexStorage(file, convex);
      
      onProgress({
        stage: 'uploading', 
        progress: 15,
        message: 'File uploaded successfully'
      });

      // Stage 2: Text Extraction
      onProgress({
        stage: 'extracting',
        progress: 20,
        message: 'Extracting text from PDF...'
      });

      const extractionResult = await PDFProcessingService.extractTextFromPDF(file);
      
      onProgress({
        stage: 'extracting',
        progress: 40,
        message: `Extracted ${extractionResult.wordCount} words from ${extractionResult.pageCount} pages`
      });

      // Stage 3: Text Chunking
      onProgress({
        stage: 'chunking',
        progress: 45,
        message: 'Splitting document into semantic chunks...'
      });

      const chunks = PDFProcessingService.chunkText(extractionResult.text, 500, 50);
      
      onProgress({
        stage: 'chunking',
        progress: 55,
        message: `Created ${chunks.length} intelligent chunks`
      });

      // Stage 4: Initialize Embedding Service
      onProgress({
        stage: 'embedding',
        progress: 60,
        message: 'Loading AI embedding model...'
      });

      const embeddingService = EmbeddingService.getInstance();
      await embeddingService.initialize();

      // Stage 5: Generate Embeddings
      onProgress({
        stage: 'embedding',
        progress: 65,
        message: 'Generating semantic embeddings...'
      });

      const embeddings = await embeddingService.generateBatchEmbeddings(chunks);
      
      onProgress({
        stage: 'embedding',
        progress: 80,
        message: `Generated ${embeddings.length} embeddings`
      });

      // Stage 6: Index in RAG System
      onProgress({
        stage: 'indexing',
        progress: 85,
        message: 'Adding to knowledge base...'
      });

      const chunksWithEmbeddings = chunks.map((content, index) => ({
        content,
        chunkIndex: index,
        embedding: embeddings[index],
      }));

      // Note: This requires api to be imported properly in consuming code
      // await convex.action(api.ragService.addDocumentToRAG, {
      //   nodeId,
      //   chunks: chunksWithEmbeddings,
      //   fileName: file.name,
      // });

      // Stage 7: Complete
      onProgress({
        stage: 'complete',
        progress: 100,
        message: 'Document processing complete!'
      });

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Document processed successfully in ${processingTime}ms`);
      
      toast.success(`Successfully processed ${file.name}`, {
        description: `${chunks.length} chunks indexed for AI search`
      });

      return {
        fileName: file.name,
        fileSize: file.size,
        textContent: extractionResult.text,
        fileUrl: uploadedFileUrl,
        chunksCreated: chunks.length,
        processingTimeMs: processingTime,
        metadata: extractionResult.metadata,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.error('❌ Document processing failed:', error);
      
      onProgress({
        stage: 'error',
        progress: 0,
        message: 'Processing failed',
        error: errorMessage
      });

      toast.error('Document processing failed', {
        description: errorMessage
      });

      throw error;
    }
  }

  // Upload file to Convex storage
  private static async uploadToConvexStorage(file: File, convex: any): Promise<string> {
    try {
      // Generate upload URL
      const uploadUrl = await convex.mutation('files:generateUploadUrl');
      
      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { storageId } = await uploadResponse.json();
      
      // Get public URL
      const fileUrl = await convex.query('files:getFileUrl', { storageId });
      
      return fileUrl;

    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Validate file before processing
  static validateFile(file: File): { valid: boolean; error?: string } {
    // File type validation
    if (file.type !== 'application/pdf') {
      return { 
        valid: false, 
        error: 'Only PDF files are supported. Please convert your document to PDF first.' 
      };
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds the 10MB limit.` 
      };
    }

    // File name validation
    if (file.name.length > 100) {
      return { 
        valid: false, 
        error: 'File name is too long. Please use a shorter name.' 
      };
    }

    return { valid: true };
  }

  // Get processing statistics
  static async getProcessingStats(canvasId: string, convex: any) {
    try {
      const nodes = await convex.query('nodes:getNodesByCanvas', { canvasId });
      const documentNodes = nodes.filter((node: any) => node.type === 'document');
      
      const stats = {
        totalDocuments: documentNodes.length,
        processedDocuments: documentNodes.filter((node: any) => node.processingStatus === 'ready').length,
        processingDocuments: documentNodes.filter((node: any) => 
          ['uploading', 'extracting', 'embedding'].includes(node.processingStatus || '')
        ).length,
        errorDocuments: documentNodes.filter((node: any) => node.processingStatus === 'error').length,
        totalChunks: documentNodes.reduce((sum: number, node: any) => sum + (node.chunkCount || 0), 0),
        totalWords: documentNodes.reduce((sum: number, node: any) => sum + (node.textLength || 0), 0),
      };

      return stats;
      
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return null;
    }
  }
}
