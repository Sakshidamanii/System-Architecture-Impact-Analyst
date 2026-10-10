import { GoogleGenAI } from '@google/genai';
import { generateDeterministicEmbedding } from './vectorStore.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export function isGeminiAvailable(): boolean {
  return !!getAiClient();
}

/**
 * Generate embedding for text using gemini-embedding-2-preview
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const ai = getAiClient();
  if (!ai) {
    return generateDeterministicEmbedding(text, 768);
  }

  try {
    const trimmed = text.slice(0, 2048);
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: trimmed,
    });

    // Check response structure for embedding values
    const emb = (response as any).embedding?.values || (response as any).embeddings?.[0]?.values;
    if (emb && Array.isArray(emb)) {
      return emb;
    }
    return generateDeterministicEmbedding(text, 768);
  } catch (err) {
    console.warn('Gemini embedding failed, falling back to deterministic vector:', (err as Error).message);
    return generateDeterministicEmbedding(text, 768);
  }
}

/**
 * Generate completion using gemini-3.8-flash
 */
export async function generateImpactAnalysisWithGemini(
  systemInstruction: string,
  userPrompt: string
): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for factual grounding in codebase docs
      },
    });

    const text = response.text;
    if (text) {
      return text;
    }
    return null;
  } catch (err) {
    console.error('Gemini generateContent error:', (err as Error).message);
    return null;
  }
}
