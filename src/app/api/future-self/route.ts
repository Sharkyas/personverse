import { NextResponse } from "next/server";
import { generateJSON, aiAvailable } from "@/lib/ai";
import { rateLimited } from "@/lib/rateLimit";
import { cleanText, FUTURE_EVENTS } from "@/lib/questions";
import { futureSelfTemplate as template, buildFutureSelfPrompt, type FutureSelfRequest as Body } from "@/lib/futureSelfTemplate";

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  b.name = cleanText(b.name, 30);
  b.temperamentType = cleanText(b.temperamentType, 40) ?? "mixed";
  b.events = Array.isArray(b.events) ? b.events.filter((e) => (FUTURE_EVENTS as string[]).includes(e)) : [];
  const fallback = { text: template(b), source: "template" as const };
  if (!(await aiAvailable())) return NextResponse.json(fallback);
  if (rateLimited(req, "ai", 40)) return NextResponse.json(fallback);
  const prompt = buildFutureSelfPrompt(b);
  const res = await generateJSON<{ text: string }>(prompt);
  if (!res?.data?.text || res.data.text.length < 40) return NextResponse.json(fallback);
  return NextResponse.json({ text: res.data.text, source: "ai", model: res.model });
}
