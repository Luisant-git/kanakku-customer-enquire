
import { GoogleGenAI, Type } from "@google/genai";
import { EnquiryType, AIAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeEnquiry = async (message: string): Promise<AIAnalysis | null> => {
  if (!message || message.length < 10) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following enquiry message and suggest the best category (GENERAL, SUPPORT, or SALES), provide a more professional/polite version of the message, and detect the user's sentiment. 
      
      Message: "${message}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedType: {
              type: Type.STRING,
              description: 'One of: GENERAL, SUPPORT, SALES',
            },
            refinement: {
              type: Type.STRING,
              description: 'A more polished, professional version of the original message.',
            },
            sentiment: {
              type: Type.STRING,
              description: 'positive, neutral, or frustrated',
            },
          },
          required: ["suggestedType", "refinement", "sentiment"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      suggestedType: result.suggestedType as EnquiryType,
      refinement: result.refinement,
      sentiment: result.sentiment as 'positive' | 'neutral' | 'frustrated',
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
};
