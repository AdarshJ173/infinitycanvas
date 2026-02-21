import { action } from "./_generated/server";
import { v } from "convex/values";

// Generate AI response using Groq API (server-side)
// Using llama-3.3-70b-versatile - best free model with high RPD
export const generateResponse = action({
  args: {
    query: v.string(),
    hasDocuments: v.boolean(),
  },
  handler: async (ctx, args) => {
    try {
      // @ts-ignore - Convex provides process.env
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
      }

      const systemPrompt = args.hasDocuments
        ? "You are Neuron AI, an intelligent learning assistant. The user has uploaded documents. Be helpful, educational, and suggest they can ask questions about their documents."
        : "You are Neuron AI, an intelligent learning assistant. Be friendly, educational, and encourage users to upload documents for more personalized help. Keep responses concise but informative.";

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile', // Best free model with high RPD
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: args.query,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        throw new Error(`Groq API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      const text = result.choices?.[0]?.message?.content || 
                   "I apologize, but I couldn't generate a proper response. Please try again.";

      return {
        response: text,
        model: 'llama-3.3-70b-versatile',
      };
    } catch (error) {
      console.error('Groq generation error:', error);
      throw error;
    }
  },
});
