import { GoogleGenAI } from "@google/genai";

// Gemma (Google's open model) via the Gemini API. AI_MODEL may list several models, tried in order.
// Gemma 4 is the current family on the Gemini API (gemma-4-31b-it, gemma-4-26b-a4b-it); Gemma 3 kept as a last resort.
// Any Gemini model id also works, e.g. AI_MODEL=gemini-2.5-flash.
export const DEFAULT_MODELS = "gemma-4-31b-it,gemma-4-26b-a4b-it,gemma-3-27b-it";
export const AI_MODELS = (process.env.AI_MODEL || DEFAULT_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
export const AI_MODEL = AI_MODELS[0];

let client: GoogleGenAI | null = null;
function getClient() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (!client)
    client = new GoogleGenAI({
      apiKey: key,
      // Only for tests: point the SDK at a local mock server.
      ...(process.env.GEMINI_BASE_URL ? { httpOptions: { baseUrl: process.env.GEMINI_BASE_URL } } : {}),
    });
  return client;
}

export const aiAvailable = () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

/** Ask the model for JSON. Gemma has no JSON mode or system prompt, so we instruct in-prompt and parse leniently. */
export async function generateJSON<T>(prompt: string, timeoutMs = 30000): Promise<{ data: T; model: string } | null> {
  const ai = getClient();
  if (!ai) return null;
  for (const model of AI_MODELS) {
    const isGemma = model.startsWith("gemma");
    const call = ai.models.generateContent({
      model,
      contents: prompt + "\n\nRespond with ONLY valid JSON. No markdown fences, no commentary.",
      config: isGemma ? { temperature: 0.7 } : { temperature: 0.7, responseMimeType: "application/json" },
    });
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
    try {
      const res = await Promise.race([call, timeout]);
      const data = res ? parseJSON<T>(res.text ?? "") : null;
      if (data) return { data, model };
    } catch (e) {
      console.error(`AI error (${model})`, e instanceof Error ? e.message : e);
    }
  }
  return null;
}

export function parseJSON<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start < 0) return null;
  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(close);
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
