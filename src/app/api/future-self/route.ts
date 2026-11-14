import { NextResponse } from "next/server";
import { generateJSON, aiAvailable } from "@/lib/ai";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import { rateLimited } from "@/lib/rateLimit";
import { cleanText, FUTURE_EVENTS } from "@/lib/questions";
import { futureSelfTemplate as template, type FutureSelfRequest as Body } from "@/lib/futureSelfTemplate";

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  b.name = cleanText(b.name, 30);
  b.temperamentType = cleanText(b.temperamentType, 40) ?? "mixed";
  b.events = Array.isArray(b.events) ? b.events.filter((e) => (FUTURE_EVENTS as string[]).includes(e)) : [];
  const fallback = { text: template(b), source: "template" as const };
  if (!(await aiAvailable())) return NextResponse.json(fallback);
  if (rateLimited(req, "ai", 40)) return NextResponse.json(fallback);
  const fmt = (v: Record<Trait, number>) => TRAITS.map((t) => `${TRAIT_META[t].name} ${Math.round(v[t])}`).join(", ");
  const prompt = `Write a short voice note (60-90 words) from a person's future self at age ${b.horizon}, speaking to them now at age ${b.age}${b.name ? ` (their name is ${b.name})` : ""}.
Their baby temperament type was "${b.temperamentType}". Personality percentiles now: ${fmt(b.nowPct)}. Model's expected percentiles at ${b.horizon}: ${fmt(b.futurePct)} (for Neuroticism, lower = calmer). Life events they expect: ${b.events.join(", ") || "none chosen"}.
Mention the one or two biggest expected changes in plain words, not numbers. Warm, a little funny, natural spoken British English, no em dashes, no clichés, no predictions about specific jobs, partners or money. Never claim certainty: it's one likely future.
Return JSON: {"text": string}`;
  const res = await generateJSON<{ text: string }>(prompt);
  if (!res?.data?.text || res.data.text.length < 40) return NextResponse.json(fallback);
  return NextResponse.json({ text: res.data.text, source: "ai", model: res.model });
}
