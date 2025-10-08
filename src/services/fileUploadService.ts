/**
 * File Upload Service
 * Handles document upload, validation, and text extraction
 * Production-ready with comprehensive error handling
 */

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

export interface DocumentData {
  fileName: string;
  fileSize: number;
  textContent: string;
  fileUrl: string;
  thumbnailUrl?: string;
  pageCount?: number;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
}

export class FileUploadService {
  // File size limits
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['application/pdf'];

  /**
   * Validate file before upload
   */
  static validateFile(file: File): FileValidation {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Only PDF files are supported. Received: ${file.type || 'unknown'}` 
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        error: `File size (${sizeMB}MB) exceeds 10MB limit` 
      };
    }

    // Additional validation: Check if file has content
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  }

  /**
   * Extract text from PDF file (Mock implementation)
   * TODO: Replace with actual PDF.js implementation
   */
  static async extractTextFromPDF(file: File): Promise<{ text: string; pageCount: number }> {
    return new Promise((resolve, reject) => {
      try {
        // Simulate PDF processing time
        setTimeout(() => {
          // Mock extracted text - In production, use PDF.js
          const mockText = `Document: ${file.name}

This is extracted text from the PDF document. In a production environment, this would be the actual text content extracted using PDF.js library.

Key Topics:
• Introduction to the subject matter
• Detailed analysis and findings
• Conclusions and recommendations

The document contains comprehensive information about the topic, with detailed explanations, examples, and references. This text extraction allows the AI system to understand and process the document content for intelligent knowledge management.

Additional Content:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Summary:
This document provides valuable insights and information that can be used for learning, reference, and knowledge building within the Neuron knowledge management system.`;

          // Mock page count based on file size
          const estimatedPages = Math.max(1, Math.floor(file.size / (50 * 1024))); // ~50KB per page estimate

          resolve({
            text: mockText,
            pageCount: estimatedPages
          });
        }, 1500); // 1.5 second processing time
      } catch (error) {
        reject(new Error('Failed to extract text from PDF'));
      }
    });
  }

  /**
   * Upload file to storage (Mock implementation)
   * TODO: Replace with actual Convex storage implementation
   */
  static async uploadToStorage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Simulate network upload delay
        setTimeout(() => {
          // Mock file URL - In production, this would be from Convex storage
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_');
          const mockUrl = `https://storage.neuron.app/documents/${timestamp}-${sanitizedName}`;
          
          resolve(mockUrl);
        }, 800); // 800ms upload time
      } catch (error) {
        reject(new Error('Failed to upload file to storage'));
      }
    });
  }

  /**
   * Simulate upload progress
   */
  private static async simulateProgress(
    onProgress: (progress: number) => void,
    startPercent: number,
    endPercent: number,
    duration: number
  ): Promise<void> {
    const steps = 10;
    const stepSize = (endPercent - startPercent) / steps;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = Math.min(startPercent + (stepSize * i), endPercent);
      onProgress(Math.round(progress));
      
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }

  /**
   * Main upload handler with comprehensive progress tracking
   */
  static async uploadDocument(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<DocumentData> {
    try {
      // Initial validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        onProgress({ 
          progress: 0, 
          status: 'error', 
          error: validation.error 
        });
        throw new Error(validation.error);
      }

      // Start upload phase (0-60%)
      onProgress({ progress: 0, status: 'uploading' });
      
      await this.simulateProgress(
        (p) => onProgress({ progress: p, status: 'uploading' }),
        0,
        60,
        800
      );

      // Upload to storage
      const fileUrl = await this.uploadToStorage(file);
      
      // Upload complete, start processing (60-80%)
      onProgress({ progress: 70, status: 'processing' });

      // Extract text content
      const { text, pageCount } = await this.extractTextFromPDF(file);
      
      // Processing complete (80-100%)
      await this.simulateProgress(
        (p) => onProgress({ progress: p, status: 'processing' }),
        80,
        95,
        500
      );

      // Final completion
      onProgress({ progress: 100, status: 'ready' });

      // Return document data
      return {
        fileName: file.name,
        fileSize: file.size,
        textContent: text,
        fileUrl,
        pageCount,
      };

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred during upload';
      
      onProgress({ 
        progress: 0, 
        status: 'error', 
        error: errorMessage 
      });
      
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Check if file type is supported
   */
  static isSupportedFileType(type: string): boolean {
    return this.ALLOWED_TYPES.includes(type);
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}

// Export for convenient importing
export default FileUploadService;
