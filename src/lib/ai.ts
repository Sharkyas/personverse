import { GoogleGenAI } from "@google/genai";

// Gemma (open model from Google) via the Gemini API. Swap with AI_MODEL, e.g. gemini-2.5-flash.
// AI_MODEL may list several models, tried in order (e.g. "gemma-3-27b-it,gemma-3-12b-it").
export const AI_MODELS = (process.env.AI_MODEL || "gemma-3-27b-it,gemma-3-12b-it").split(",").map((m) => m.trim()).filter(Boolean);
export const AI_MODEL = AI_MODELS[0];

let client: GoogleGenAI | null = null;
function getClient() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (!client) client = new GoogleGenAI({ apiKey: key });
  return client;
}

export const aiAvailable = () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

/** Ask the model for JSON. Gemma has no JSON mode or system prompt, so we instruct in-prompt and parse leniently. */
export async function generateJSON<T>(prompt: string, timeoutMs = 25000): Promise<{ data: T; model: string } | null> {
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
