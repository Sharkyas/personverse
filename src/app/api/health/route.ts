import { NextResponse } from "next/server";
import { aiStatus } from "@/lib/ai";
import { dbStatus } from "@/lib/db";
import { trackStatus } from "@/lib/trackStore";

export const dynamic = "force-dynamic";

/** Which integrations are live. Never exposes keys. */
export async function GET() {
  return NextResponse.json({
    ai: await aiStatus(),
    voice: process.env.ELEVENLABS_API_KEY ? { live: true, provider: "ElevenLabs" } : { live: false, fallback: "browser speech" },
    db: await dbStatus(),
    tracker: await trackStatus(),
    host: process.env.HOST_LABEL || null,
  });
}
