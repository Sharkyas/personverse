import { NextResponse } from "next/server";
import { generateJSON, aiAvailable } from "@/lib/ai";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";

type Body = {
  name?: string;
  age: number;
  horizon: number;
  temperamentType: string;
  nowPct: Record<Trait, number>;
  futurePct: Record<Trait, number>;
  events: string[];
};

function babyLine(type: string) {
  if (type.startsWith("Spirited")) return "That spirited, loud little baby";
  if (type.startsWith("Easy")) return "That easy, smiley baby";
  if (type.startsWith("Slow")) return "That cautious baby who took a while to warm up";
  return "That baby who was a bit of everything";
}

function template(b: Body) {
  const moves = TRAITS.map((t) => ({ t, d: b.futurePct[t] - b.nowPct[t] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  const [m1, m2] = moves;
  const word = (t: Trait, d: number) =>
    t === "N" ? (d < 0 ? "calmer than you'd believe" : "a bit more sensitive") : d > 0 ? `more ${TRAIT_META[t].high.split(",")[0]}` : `less ${TRAIT_META[t].high.split(",")[0]}`;
  return `Hey${b.name ? " " + b.name : ""}, it's you, at ${b.horizon}. I won't spoil everything, but I'm ${word(m1.t, m1.d)}, and ${word(m2.t, m2.d)}. ${babyLine(b.temperamentType)} is still in here somewhere. Most of what changed came from small things you did over and over, not one big moment. So keep going. Oh, and the stuff you're worrying about this week? I genuinely can't remember it.`;
}

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  const fallback = { text: template(b), source: "template" as const };
  if (!aiAvailable()) return NextResponse.json(fallback);
  const fmt = (v: Record<Trait, number>) => TRAITS.map((t) => `${TRAIT_META[t].name} ${Math.round(v[t])}`).join(", ");
  const prompt = `Write a short voice note (60-90 words) from a person's future self at age ${b.horizon}, speaking to them now at age ${b.age}${b.name ? ` (their name is ${b.name})` : ""}.
Their baby temperament type was "${b.temperamentType}". Personality percentiles now: ${fmt(b.nowPct)}. Model's expected percentiles at ${b.horizon}: ${fmt(b.futurePct)} (for Neuroticism, lower = calmer). Life events they expect: ${b.events.join(", ") || "none chosen"}.
Mention the one or two biggest expected changes in plain words, not numbers. Warm, a little funny, natural spoken British English, no em dashes, no clichés, no predictions about specific jobs, partners or money. Never claim certainty: it's one likely future.
Return JSON: {"text": string}`;
  const res = await generateJSON<{ text: string }>(prompt);
  if (!res?.data?.text || res.data.text.length < 40) return NextResponse.json(fallback);
  return NextResponse.json({ text: res.data.text, source: "ai", model: res.model });
}
