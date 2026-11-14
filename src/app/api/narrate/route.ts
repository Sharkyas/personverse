import { createHash } from "node:crypto";
import { rateLimited } from "@/lib/rateLimit";

// Text-to-speech via ElevenLabs. Without a key the client falls back to the browser's voice.
// Clips are cached in memory, so replaying the same results (or the sample profile on stage) costs no credits.
const cache = new Map<string, ArrayBuffer>();
const CACHE_MAX = 60;
const mp3 = (buf: ArrayBuffer, hit: boolean) =>
  new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Cache": hit ? "hit" : "miss" } });

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "no-key" }), { status: 501 });
  let body: { text?: unknown; voice?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad-json" }), { status: 400 });
  }
  const text = String(body.text ?? "").slice(0, 2500).trim();
  if (!text) return new Response(JSON.stringify({ error: "empty" }), { status: 400 });
  const voice =
    body.voice === "future"
      ? process.env.ELEVENLABS_FUTURE_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"
      : process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
  const id = createHash("sha256").update(voice + "\n" + text).digest("hex");
  const hit = cache.get(id);
  if (hit) return mp3(hit, true);
  // A 429 makes the client switch to the browser's voice, so the page keeps working.
  const limited = rateLimited(req, "tts", 60);
  if (limited) return limited;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
    }),
  }).catch((e) => {
    console.error("ElevenLabs unreachable", e instanceof Error ? e.message : e);
    return null;
  });
  if (!res?.ok) {
    if (res) console.error("ElevenLabs error", res.status, await res.text());
    return new Response(JSON.stringify({ error: "tts-failed" }), { status: 502 });
  }
  const buf = await res.arrayBuffer();
  cache.set(id, buf);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return mp3(buf, false);
}
