
import { GoogleGenAI, Type } from "@google/genai";
import { SongCard, GameSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PLAYLIST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      artist: { type: Type.STRING },
      year: { type: Type.INTEGER },
      genre: { type: Type.STRING },
      fact: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      youtubeId: { type: Type.STRING, description: "A valid 11-character YouTube video ID that is ALLOWED to be embedded and played in an iframe (e.g., official music video)." }
    },
    required: ['title', 'artist', 'year', 'genre', 'fact', 'difficulty', 'youtubeId']
  }
};

export const validateCustomCategory = async (category: string): Promise<string> => {
  const prompt = `User wants a custom music quiz category called: "${category}". 
  Provide a short, professional confirmation (max 15 words) in Danish explaining what kind of songs this will include (e.g. "Jeg finder sange af, med eller om ${category}").`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return (response.text || '').trim();
};

export const generatePlaylist = async (settings: GameSettings, count: number = 10): Promise<SongCard[]> => {
  const basePrompt = `TASK: Compose a hidden music quiz playlist of ${count} unique tracks.
  
  CATEGORY SETTINGS:
  - Decade Target: ${settings.decade === 'Alle' ? '1950-2024 (Mixed)' : `Exclusively ${settings.decade}`}
  - Genre Focus: ${settings.genre === 'Alle' ? 'Popular Hits' : settings.genre}
  - Thematic Constraint: ${settings.customCategory || 'None'}
  
  REQUIREMENTS:
  1. Each track must be a major hit recognizable to players.
  2. For the 'youtubeId', you MUST provide a valid, working 11-character ID. 
  3. CRITICAL: Ensure the chosen videos ALLOW embedding in third-party applications.
  4. Ensure a mix of tempos and styles within the category.
  5. The facts should be short, punchy, and in Danish.
  
  Format the output as a JSON array of objects conforming to the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: basePrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: PLAYLIST_SCHEMA
    }
  });

  try {
    const data = JSON.parse(response.text || '[]');
    return data.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (e) {
    console.error("Failed to parse AI playlist", e);
    return [];
  }
};

export const getTriviaForYear = async (year: number): Promise<string> => {
  const prompt = `Tell me 3 short, interesting pop culture or world events that happened in the year ${year}. Keep it snappy and fun for a party game. Answer in Danish.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || '';
};
