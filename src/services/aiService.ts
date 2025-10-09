import { api } from '../../convex/_generated/api';

export interface AIResponse {
  response: string;
  contextsUsed: number;
  sourcesReferenced: string[];
  processingTimeMs: number;
}

export class AIService {
  
  // Generate response with ALL available context types
  static async generateResponse(
    userQuestion: string,
    canvasId: string,
    hasDocuments: boolean = false,
    ragieAction?: any, // useAction(api.ragie.generateResponse)
    geminiAction?: any, // useAction(api.gemini.generateResponse)
    youtubeContext?: string, // YouTube video context
    webContentContext?: string, // Website content from Jina Reader
    textNodesContext?: string // Text nodes content
  ): Promise<AIResponse> {
    
    const startTime = Date.now();
    
    // Strategy: Combine all available contexts, prioritizing richer content
    // NEVER fail - always provide an answer
    
    // Build combined context from all sources
    const contextSources: string[] = [];
    const contextParts: string[] = [];
    let totalContexts = 0;
    
    // Add YouTube video context
    if (youtubeContext) {
      contextParts.push(`YOUTUBE VIDEO INFORMATION:\n${youtubeContext}`);
      contextSources.push('YouTube Video');
      totalContexts++;
    }
    
    // Add web content context
    if (webContentContext) {
      contextParts.push(`WEBSITE CONTENT:\n${webContentContext}`);
      contextSources.push('Web Article');
      totalContexts++;
    }
    
    // Add text nodes context
    if (textNodesContext) {
      contextParts.push(`TEXT NOTES:\n${textNodesContext}`);
      contextSources.push('Text Notes');
      totalContexts++;
    }
    
    // TIER 0: Use combined node contexts (YouTube + Web + Text)
    if (contextParts.length > 0 && geminiAction) {
      try {
        console.log(`🌐 Using ${totalContexts} node context(s): ${contextSources.join(', ')}`);
        
        const combinedContext = contextParts.join('\n\n---\n\n');
        
        const contextualPrompt = `Based on the following information from the user's canvas, answer their question accurately.

${combinedContext}

QUESTION: ${userQuestion}

Provide a detailed answer based on the information above. Reference the specific sources when relevant.`;
        
        const geminiResponse = await geminiAction({
          query: contextualPrompt,
          hasDocuments: true,
        });
        
        console.log(`✅ Response generated with ${totalContexts} node context(s)`);
        return {
          response: geminiResponse.response,
          contextsUsed: totalContexts,
          sourcesReferenced: contextSources,
          processingTimeMs: Date.now() - startTime,
        };
      } catch (error) {
        console.warn('⚠️ Node context failed:', error);
        // Continue to Ragie
      }
    }
    
    // TIER 1: Try Ragie with document context
    if (hasDocuments && ragieAction && geminiAction) {
      try {
        console.log('🧠 Retrieving context from Ragie...');
        
        const ragieResponse = await ragieAction({
          query: userQuestion,
          filter: {
            scope: canvasId,
            canvasId,
          },
        });
        
        const chunks = ragieResponse?.chunks || [];
        const sources = ragieResponse?.sources || [];
        
        // If we have context chunks, use them with Gemini
        if (chunks.length > 0) {
          console.log('✅ Ragie found', chunks.length, 'relevant chunks');
          
          // Build context from chunks
          const context = chunks
            .map((chunk: any, idx: number) => 
              `[Context ${idx + 1} from ${chunk.document_name}]\n${chunk.text}`
            )
            .join('\n\n---\n\n');
          
          const contextualPrompt = `Based on the following context from the user's uploaded documents, answer their question accurately and cite the sources.

CONTEXT:
${context}

QUESTION: ${userQuestion}

Provide a detailed answer based on the context above. Reference the specific documents and be precise.`;
          
          // Generate response with context using Gemini
          const geminiResponse = await geminiAction({
            query: contextualPrompt,
            hasDocuments: true,
          });
          
          console.log('✅ Gemini generated contextual response');
          return {
            response: geminiResponse.response,
            contextsUsed: chunks.length,
            sourcesReferenced: sources,
            processingTimeMs: Date.now() - startTime,
          };
        }
        
        console.log('⚠️ Ragie found no relevant chunks');
      } catch (ragieError) {
        console.warn('⚠️ Ragie failed:', ragieError);
        // Continue to general Gemini
      }
    }

    // TIER 2: Try Gemini AI via Convex action
    if (geminiAction) {
      try {
        console.log('💬 Calling Gemini via Convex...');
        
        const geminiResponse = await geminiAction({
          query: userQuestion,
          hasDocuments: hasDocuments,
        });

        console.log('✅ Gemini response received');
        return {
          response: geminiResponse.response,
          contextsUsed: 0,
          sourcesReferenced: [],
          processingTimeMs: Date.now() - startTime,
        };
        
      } catch (geminiError) {
        console.error('❌ Gemini failed:', geminiError);
        // Continue to ultimate fallback
      }
    } else {
      console.warn('⚠️ Gemini action not provided');
    }

    // TIER 3: Ultimate fallback - ALWAYS provide a response
    console.log('🛟 Using fallback response (all AI services failed)');
    return {
      response: this.getFallbackResponse(userQuestion, hasDocuments),
      contextsUsed: 0,
      sourcesReferenced: [],
      processingTimeMs: Date.now() - startTime,
    };
  }
  
  // Fallback responses when all AI services fail
  private static getFallbackResponse(question: string, hasDocuments: boolean): string {
    const lowerQuestion = question.toLowerCase();
    
    // Handle greetings
    if (lowerQuestion.match(/^(hi|hello|hey|greetings)/)) {
      return hasDocuments 
        ? "Hello! I'm Neuron AI. I can see you have documents uploaded. Ask me anything about them, or any general questions!" 
        : "Hello! I'm Neuron AI, your learning assistant. Upload some documents and I'll help you understand them, or ask me anything!";
    }
    
    // Handle help requests
    if (lowerQuestion.includes('help') || lowerQuestion.includes('how') && lowerQuestion.includes('work')) {
      return "I'm Neuron AI! I can help you organize knowledge and answer questions. Upload documents and I'll provide contextual answers based on their content. Right now I'm experiencing some technical difficulties with my AI backend, but I'm here to help!";
    }
    
    // Handle document questions
    if (hasDocuments && (lowerQuestion.includes('document') || lowerQuestion.includes('what') || lowerQuestion.includes('explain'))) {
      return "I can see you have documents uploaded! I'm experiencing some technical issues connecting to my AI services right now. Please check that your internet connection is stable, or try asking again in a moment. Meanwhile, you can review your documents on the canvas.";
    }
    
    // General fallback
    return "I apologize, but I'm having trouble connecting to my AI services right now. This could be due to API configuration or network issues. Please:\n\n1. Check your internet connection\n2. Refresh the page\n3. Try again in a moment\n\nI'm still here to help once the connection is restored!";
  }

  // Test Ragie connection
  static async testRagieConnection(testAction: any): Promise<boolean> {
    try {
      // Try a simple test query through Convex
      await testAction({
        query: 'test',
      });
      return true;
    } catch (error) {
      console.error('Ragie connection test failed:', error);
      return false;
    }
  }
}

export default AIService;
