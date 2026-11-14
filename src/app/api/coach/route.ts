import { NextResponse } from "next/server";
import { generateJSON, aiAvailable } from "@/lib/ai";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import { rateLimited } from "@/lib/rateLimit";
import { cleanText } from "@/lib/questions";
import { libraryPlan, type CoachPlan, type CoachRequest as Body } from "@/lib/coachLibrary";

export type { CoachPlan };

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  b.name = cleanText(b.name, 30);
  b.targetName = cleanText(b.targetName, 40);
  b.temperamentType = cleanText(b.temperamentType, 40) ?? "mixed";
  const fallback = libraryPlan(b);
  if (!(await aiAvailable())) return NextResponse.json(fallback);
  // Over the limit: still answer, from the library, so the page never breaks.
  if (rateLimited(req, "ai", 40)) return NextResponse.json(fallback);

  const fmt = (v: Record<Trait, number>) => TRAITS.map((t) => `${TRAIT_META[t].name} ${Math.round(v[t])}th pct`).join(", ");
  const prompt = `You are an evidence-based personality-development coach. Ground advice in research on volitional personality change (Hudson & Fraley 2015; Stieger et al. 2021 PNAS; Roberts et al. 2017). Be warm, concrete, British English, no clichés, no em dashes. Never diagnose.

User: ${b.name ? b.name + ", " : ""}age ${b.age}. Early temperament type: ${b.temperamentType}.
Estimated baby temperament: ${fmt(b.babyPct)}.
Current personality: ${fmt(b.nowPct)}.
Target ("${b.targetName ?? "custom"}"): ${fmt(b.targetPct)}.
Model's chance each trait shifts meaningfully by their chosen age: ${TRAITS.map((t) => `${t} ${Math.round(b.pChange[t] * 100)}%`).join(", ")}.
Note: for Neuroticism a LOWER target means calmer.

Return JSON with exactly these keys:
{"headline": string (max 8 words),
 "summary": string (2-3 sentences on the biggest gaps and what is realistic),
 "weeks": [{"week": 1-8, "trait": one of "O","C","E","A","N", "challenge": one concrete behaviour to do that week, specific to a university student, "why": one sentence}] (8 items, focus on the 2 largest gaps),
 "ifThen": [2 implementation intentions, "If ..., then I will ..."],
 "watchOut": one sentence of honest caution,
 "narration": a 70-110 word script to be read aloud by a narrator, second person, upbeat, mentioning their starting temperament and where they are heading}`;

  const res = await generateJSON<Omit<CoachPlan, "source">>(prompt);
  const ai = res?.data;
  if (!ai || !Array.isArray(ai.weeks) || !ai.summary) return NextResponse.json(fallback);
  ai.weeks = ai.weeks.filter((w) => TRAITS.includes(w.trait)).slice(0, 8);
  if (!ai.weeks.length) ai.weeks = fallback.weeks;
  if (!Array.isArray(ai.ifThen) || !ai.ifThen.length) ai.ifThen = fallback.ifThen;
  if (typeof ai.narration !== "string" || ai.narration.length < 40) ai.narration = fallback.narration;
  return NextResponse.json({ ...fallback, ...ai, source: "ai", model: res.model });
}
