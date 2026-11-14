import { NextResponse } from "next/server";
import { aiAvailable, AI_MODELS } from "@/lib/ai";
import { dbStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Which integrations are live. Never exposes keys. */
export async function GET() {
  return NextResponse.json({
    ai: aiAvailable() ? { live: true, models: AI_MODELS } : { live: false, fallback: "challenge library" },
    voice: process.env.ELEVENLABS_API_KEY ? { live: true, provider: "ElevenLabs" } : { live: false, fallback: "browser speech" },
    db: await dbStatus(),
    host: process.env.HOST_LABEL || null,
  });
}
