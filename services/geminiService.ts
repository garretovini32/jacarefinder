import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Song } from "../types";

// Initialize Gemini Client
// CRITICAL: Ensure process.env.API_KEY is available in your environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SONG_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      titulo: { type: Type.STRING },
      artista: { type: Type.STRING },
      matchType: { 
        type: Type.STRING, 
        enum: ['Texto', 'Melodia', 'Contexto'] 
      },
      confidence: { type: Type.NUMBER },
      description: { type: Type.STRING }
    },
    required: ["id", "titulo", "artista", "matchType", "confidence"]
  }
};

export const searchMusic = async (
  text: string, 
  audioBase64: string | null,
  mimeType: string = 'audio/webm'
): Promise<Song[]> => {
  
  const modelName = audioBase64 ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
  
  let promptText = "";
  
  if (audioBase64 && text) {
    promptText = `Identify the song based on the audio melody provided AND the following user description: "${text}". 
    The audio is the primary source for melody matching, but use the text for context.`;
  } else if (audioBase64) {
    promptText = "Identify this song based on the hummed or recorded melody. Return the most likely matches.";
  } else {
    promptText = `Find songs matching this description: "${text}". If it mentions a movie scene, mood, or vague lyrics, use your knowledge to find the specific track.`;
  }

  const parts: any[] = [{ text: promptText }];

  if (audioBase64) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: audioBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SONG_SCHEMA,
        systemInstruction: "You are JacareFinder, an expert music discovery assistant. You specialize in identifying songs from humming, context descriptions (e.g., 'that sad song in The Matrix'), or partial lyrics. Always return a JSON array of matches.",
        temperature: 0.4
      }
    });

    const textResponse = response.text;
    if (!textResponse) return [];
    
    const results = JSON.parse(textResponse) as Song[];
    return results;

  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("Failed to search for music. Please try again.");
  }
};