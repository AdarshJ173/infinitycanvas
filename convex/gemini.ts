import { action } from "./_generated/server";
import { v } from "convex/values";

// Generate AI response using Gemini API (server-side)
export const generateResponse = action({
  args: {
    query: v.string(),
    hasDocuments: v.boolean(),
  },
  handler: async (ctx, args) => {
    try {
      // @ts-ignore - Convex provides process.env
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const systemPrompt = args.hasDocuments
        ? "You are Neuron AI, an intelligent learning assistant. The user has uploaded documents. Be helpful, educational, and suggest they can ask questions about their documents."
        : "You are Neuron AI, an intelligent learning assistant. Be friendly, educational, and encourage users to upload documents for more personalized help. Keep responses concise but informative.";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nUser: ${args.query}\n\nAssistant:`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                   "I apologize, but I couldn't generate a proper response. Please try again.";

      return {
        response: text,
        model: 'gemini-2.0-flash',
      };
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw error;
    }
  },
});
