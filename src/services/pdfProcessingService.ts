import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with fallback options
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.warn('⚠️ PDF.js worker configuration warning:', error);
}

export interface PDFProcessingResult {
  text: string;
  pageCount: number;
  wordCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
  };
  processingMethod: 'pdfjs';
  processingTimeMs: number;
}

export class PDFProcessingService {
  
  // Main processing method using PDF.js
  static async extractTextFromPDF(file: File): Promise<PDFProcessingResult> {
    const startTime = Date.now();

    try {
      console.log('🔄 Starting PDF processing with PDF.js...');
      
      const result = await this.extractWithPDFjs(file);
      result.processingTimeMs = Date.now() - startTime;
      
      console.log(`✅ PDF processing completed in ${result.processingTimeMs}ms`);
      console.log(`📄 Extracted ${result.wordCount} words from ${result.pageCount} pages`);
      
      return result;

    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
    }
  }

  // PDF.js extraction method with enhanced error handling
  private static async extractWithPDFjs(file: File): Promise<PDFProcessingResult> {
    console.log(`📝 Reading file: ${file.name}`);
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('File is empty or could not be read');
    }
    
    console.log(`📦 File size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);
    
    // Load PDF document with proper configuration
    let pdf;
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Suppress warnings
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      });
      
      pdf = await loadingTask.promise;
      
      if (!pdf) {
        throw new Error('Failed to load PDF document');
      }
      
      console.log(`📚 PDF loaded successfully: ${pdf.numPages} pages`);
    } catch (loadError) {
      console.error('❌ Error loading PDF:', loadError);
      throw new Error(`Cannot load PDF: ${loadError instanceof Error ? loadError.message : 'Invalid or corrupted PDF file'}`);
    }
    
    let fullText = '';
    const pageTexts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str.trim())
        .filter(str => str.length > 0)
        .join(' ');
      
      if (pageText.trim()) {
        pageTexts.push(pageText);
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }
    }

    // Get PDF metadata
    const metadata = await pdf.getMetadata();
    const info = metadata.info as any;
    
    return {
      text: fullText.trim(),
      pageCount: pdf.numPages,
      wordCount: fullText.split(/\s+/).length,
      metadata: {
        title: info?.Title,
        author: info?.Author,
        subject: info?.Subject,
        creator: info?.Creator,
        producer: info?.Producer,
        creationDate: info?.CreationDate,
      },
      processingMethod: 'pdfjs',
      processingTimeMs: 0, // Will be set by caller
    };
  }


  // Intelligent text chunking with semantic boundaries
  static chunkText(text: string, maxChars: number = 500, overlap: number = 50): string[] {
    if (text.length <= maxChars) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChars;
      
      if (end >= text.length) {
        // Last chunk
        chunks.push(text.slice(start).trim());
        break;
      }

      // Try to break at sentence boundary
      let breakPoint = this.findSemanticBreakpoint(text, start, end);
      
      if (breakPoint === -1) {
        // No good break point found, use maxChars
        breakPoint = end;
      }

      const chunk = text.slice(start, breakPoint).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = Math.max(start + 1, breakPoint - overlap);
    }

    return chunks.filter(chunk => chunk.length > 20); // Filter out tiny chunks
  }

  // Find the best semantic breakpoint for chunking
  private static findSemanticBreakpoint(text: string, start: number, maxEnd: number): number {
    const searchArea = text.slice(start, maxEnd);
    
    // Priority 1: Sentence ending with period, exclamation, or question mark
    const sentenceEnds = ['.', '!', '?'];
    for (const punct of sentenceEnds) {
      const lastIndex = searchArea.lastIndexOf(punct);
      if (lastIndex > searchArea.length * 0.6) { // Don't break too early
        return start + lastIndex + 1;
      }
    }

    // Priority 2: Paragraph break (double newline)
    const paragraphBreak = searchArea.lastIndexOf('\n\n');
    if (paragraphBreak > searchArea.length * 0.5) {
      return start + paragraphBreak + 2;
    }

    // Priority 3: Single newline
    const lineBreak = searchArea.lastIndexOf('\n');
    if (lineBreak > searchArea.length * 0.6) {
      return start + lineBreak + 1;
    }

    // Priority 4: Word boundary
    const spaceIndex = searchArea.lastIndexOf(' ');
    if (spaceIndex > searchArea.length * 0.7) {
      return start + spaceIndex + 1;
    }

    // No good breakpoint found
    return -1;
  }
}
