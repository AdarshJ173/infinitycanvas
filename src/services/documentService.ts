import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { FunctionReference } from 'convex/server';

export interface DocumentProcessingProgress {
  stage: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  message: string;
}

export interface ProcessedDocument {
  fileName: string;
  fileSize: number;
  ragieDocumentId: string;
  status: 'processing' | 'ready' | 'failed';
}

export class DocumentService {
  
  // Upload and process document with Ragie
  static async processDocument(
    file: File,
    nodeId: string,
    canvasId: string,
    uploadAction: any, // useAction hook result
    getStatusAction: any, // useAction hook result  
    updateMutation: any, // useMutation hook result
    onProgress: (progress: DocumentProcessingProgress) => void
  ): Promise<ProcessedDocument> {
    
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Stage 1: Upload to Ragie via Convex Action
      onProgress({
        stage: 'uploading',
        progress: 20,
        message: 'Uploading to Ragie RAG system...'
      });

      // Convert file to base64 for Convex action
      const fileData = await this.fileToBase64(file);
      
      const ragieDocument = await uploadAction({
        fileData,
        fileName: file.name,
        fileType: file.type,
        metadata: {
          scope: canvasId,
          nodeId,
          canvasId,
        },
      });

      onProgress({
        stage: 'processing',
        progress: 50,
        message: 'Ragie is processing your document...'
      });

      // Stage 2: Update Convex database
      await updateMutation({
        nodeId: nodeId,
        canvasId: canvasId,
        fileName: file.name,
        fileSize: file.size,
        ragieDocumentId: ragieDocument.id,
        ragieStatus: ragieDocument.status === 'ready' ? 'ready' : 'processing',
      });

      // Stage 3: Wait for processing if needed
      if (ragieDocument.status === 'processing') {
        onProgress({
          stage: 'processing',
          progress: 75,
          message: 'Finalizing document indexing...'
        });

        // Poll for completion (max 30 seconds)
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const status = await getStatusAction({
            documentId: ragieDocument.id,
          });
          if (status.status === 'ready') {
            ragieDocument.status = 'ready';
            break;
          } else if (status.status === 'failed') {
            throw new Error('Document processing failed in Ragie');
          }
          
          attempts++;
        }
      }

      // Stage 4: Complete
      onProgress({
        stage: 'ready',
        progress: 100,
        message: 'Document ready for AI queries!'
      });

      // Final database update
      await updateMutation({
        nodeId: nodeId,
        canvasId: canvasId,
        ragieStatus: 'ready',
      });

      toast.success(`Successfully processed ${file.name}`, {
        description: 'Document is now searchable by AI'
      });

      return {
        fileName: file.name,
        fileSize: file.size,
        ragieDocumentId: ragieDocument.id,
        status: ragieDocument.status,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      console.error('❌ Document processing failed:', error);
      
      onProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      toast.error('Document processing failed', {
        description: errorMessage
      });

      // Update node with error status
      try {
        await updateMutation({
          nodeId: nodeId,
          canvasId: canvasId,
          ragieStatus: 'error',
        });
      } catch (updateError) {
        console.error('Failed to update node error status:', updateError);
      }

      throw error;
    }
  }

  // Validate file before processing
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.type !== 'application/pdf') {
      return { 
        valid: false, 
        error: 'Only PDF files are supported' 
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { 
        valid: false, 
        error: 'File size exceeds 10MB limit' 
      };
    }

    return { valid: true };
  }

  // Convert file to base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
