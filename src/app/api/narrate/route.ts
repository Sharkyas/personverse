// Text-to-speech via ElevenLabs. Without a key the client falls back to the browser's voice.
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "no-key" }), { status: 501 });
  const { text } = (await req.json()) as { text: string };
  const voice = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: String(text).slice(0, 2500),
      model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
    }),
  });
  if (!res.ok) {
    console.error("ElevenLabs error", res.status, await res.text());
    return new Response(JSON.stringify({ error: "tts-failed" }), { status: 502 });
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
