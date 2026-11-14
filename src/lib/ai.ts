import { GoogleGenAI } from "@google/genai";

/*
 * AI providers, tried in order:
 *  1. Local Gemma: Ollama (native API) or any OpenAI-compatible local server (LM Studio, llama.cpp).
 *     Auto-detected on the usual ports, or set OLLAMA_URL / LOCAL_AI_URL. Nothing leaves the machine.
 *  2. Gemma via the Gemini API, if GEMINI_API_KEY is set.
 *  3. Nobody: callers fall back to the built-in challenge library / templates.
 */

// ---------- Gemini API ----------
// Gemma 4 is the current family on the Gemini API; Gemma 3 kept as a last resort. Any Gemini model id also works.
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
const geminiKey = () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// ---------- local Gemma ----------
export type LocalAI = { kind: "ollama" | "openai"; url: string; models: string[] };

const OLLAMA_CANDIDATES = ["http://127.0.0.1:11434", "http://host.docker.internal:11434", "http://ollama:11434"];
const OPENAI_CANDIDATES = ["http://127.0.0.1:1234", "http://127.0.0.1:8080"]; // LM Studio, llama.cpp server

const g = globalThis as unknown as { _localAI?: { at: number; value: LocalAI | null } };

async function getJSON(url: string, ms: number): Promise<unknown | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms), cache: "no-store" });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** Ranks Gemma models: newest family first, then a laptop-friendly size (≈ 4–15 GB) before huge or tiny ones. */
export function rankGemma(models: { name: string; size?: number }[]): string[] {
  const gen = (n: string) => {
    const m = /gemma[-_ ]?(\d+(?:\.\d+)?)/i.exec(n);
    return m ? parseFloat(m[1]) : 1;
  };
  const sizeScore = (b?: number) => {
    if (!b) return 0;
    const gb = b / 1e9;
    return gb >= 4 && gb <= 15 ? 2 : gb > 15 ? 1 : 0.5;
  };
  return models
    .filter((m) => /gemma/i.test(m.name) && !/embed/i.test(m.name)) // embedding models cannot chat
    .sort((a, b) => gen(b.name) - gen(a.name) || sizeScore(b.size) - sizeScore(a.size) || (b.size ?? 0) - (a.size ?? 0))
    .map((m) => m.name);
}

/** Finds a running local model server. Cached for 30 s so pages never wait on it. */
export async function detectLocalAI(force = false): Promise<LocalAI | null> {
  if (process.env.LOCAL_AI === "off") return null;
  if (!force && g._localAI && Date.now() - g._localAI.at < 30_000) return g._localAI.value;

  const pinned = (process.env.OLLAMA_MODEL || "").split(",").map((s) => s.trim()).filter(Boolean);
  let found: LocalAI | null = null;

  // An explicit OpenAI-compatible server (for example mlx_lm.server running the fine-tuned Gemma) wins over Ollama.
  const ollamaUrls = process.env.LOCAL_AI_URL && !process.env.OLLAMA_URL ? [] : process.env.OLLAMA_URL ? [process.env.OLLAMA_URL.replace(/\/$/, "")] : OLLAMA_CANDIDATES;
  for (const url of ollamaUrls) {
    const tags = (await getJSON(`${url}/api/tags`, 700)) as { models?: { name: string; size?: number }[] } | null;
    if (tags?.models) {
      const models = pinned.length ? pinned : rankGemma(tags.models);
      if (models.length) found = { kind: "ollama", url, models };
      break;
    }
  }
  if (!found) {
    const openaiUrls = process.env.LOCAL_AI_URL ? [process.env.LOCAL_AI_URL.replace(/\/$/, "").replace(/\/v1$/, "")] : OPENAI_CANDIDATES;
    for (const url of openaiUrls) {
      const list = (await getJSON(`${url}/v1/models`, 700)) as { data?: { id: string }[] } | null;
      if (list?.data) {
        const models = pinned.length ? pinned : rankGemma(list.data.map((m) => ({ name: m.id })));
        if (models.length) found = { kind: "openai", url, models };
        break;
      }
    }
  }
  g._localAI = { at: Date.now(), value: found };
  return found;
}

async function callLocal(ai: LocalAI, model: string, prompt: string, timeoutMs: number): Promise<string | null> {
  const signal = AbortSignal.timeout(timeoutMs);
  if (ai.kind === "ollama") {
    const r = await fetch(`${ai.url}/api/chat`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        format: "json",
        options: { temperature: 0.7 },
        keep_alive: "30m",
      }),
    });
    if (!r.ok) throw new Error(`Ollama ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = (await r.json()) as { message?: { content?: string } };
    return j.message?.content ?? null;
  }
  const r = await fetch(`${ai.url}/v1/chat/completions`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.7, stream: false }),
  });
  if (!r.ok) throw new Error(`Local server ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return j.choices?.[0]?.message?.content ?? null;
}

// ---------- public API ----------
export async function aiStatus() {
  const local = await detectLocalAI();
  if (local) return { live: true, provider: "local" as const, kind: local.kind, models: local.models.slice(0, 3) };
  if (geminiKey()) return { live: true, provider: "gemini-api" as const, models: AI_MODELS };
  return { live: false as const, fallback: "challenge library" };
}

/** True if any provider might answer. */
export async function aiAvailable(): Promise<boolean> {
  return Boolean((await detectLocalAI()) || geminiKey());
}

/** Ask Gemma for JSON. We instruct in-prompt and parse leniently, so it works with or without a JSON mode. */
export async function generateJSON<T>(prompt: string, timeoutMs = 30000): Promise<{ data: T; model: string } | null> {
  const full = prompt + "\n\nRespond with ONLY valid JSON. No markdown fences, no commentary.";

  const local = await detectLocalAI();
  if (local) {
    // Local models on a laptop can be slow on first load, so give them longer.
    const localTimeout = Number(process.env.LOCAL_AI_TIMEOUT_MS) || Math.max(timeoutMs, 90000);
    for (const model of local.models.slice(0, 2)) {
      try {
        const text = await callLocal(local, model, full, localTimeout);
        const data = text ? parseJSON<T>(text) : null;
        if (data) return { data, model: `${model} (local)` };
      } catch (e) {
        console.error(`Local AI error (${model})`, e instanceof Error ? e.message : e);
      }
    }
  }

  const ai = getClient();
  if (!ai) return null;
  for (const model of AI_MODELS) {
    const isGemma = model.startsWith("gemma");
    const call = ai.models.generateContent({
      model,
      contents: full,
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
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/```(?:json)?/g, "")
    .trim();
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
