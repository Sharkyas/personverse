import { NextResponse } from "next/server";
import { generateJSON, aiAvailable } from "@/lib/ai";
import { CHALLENGES } from "@/lib/challenges";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";

type Body = {
  name?: string;
  age: number;
  temperamentType: string;
  nowPct: Record<Trait, number>;
  babyPct: Record<Trait, number>;
  targetPct: Record<Trait, number>;
  targetName?: string;
  pChange: Record<Trait, number>;
};

export type CoachPlan = {
  headline: string;
  summary: string;
  weeks: { week: number; trait: Trait; challenge: string; why: string }[];
  ifThen: string[];
  watchOut: string;
  narration: string;
  source: "ai" | "library";
  model?: string;
};

function libraryPlan(b: Body): CoachPlan {
  const gaps = TRAITS.map((t) => ({ t, g: b.targetPct[t] - b.nowPct[t] }))
    .filter((x) => Math.abs(x.g) >= 10)
    .sort((x, y) => Math.abs(y.g) - Math.abs(x.g));
  const focus = gaps.length ? gaps.slice(0, 2) : [{ t: "C" as Trait, g: 10 }];
  const weeks: CoachPlan["weeks"] = [];
  for (let w = 0; w < 8; w++) {
    const f = focus[w % focus.length];
    const dir = f.g > 0 ? "up" : "down";
    const list = CHALLENGES[f.t][dir];
    weeks.push({
      week: w + 1,
      trait: f.t,
      challenge: list[Math.floor(w / focus.length) % list.length],
      why: `${dir === "up" ? "Raises" : "Lowers"} ${TRAIT_META[f.t].name.toLowerCase()} by practising the behaviour first.`,
    });
  }
  const names = focus.map((f) => `${f.g > 0 ? "more" : "less"} ${TRAIT_META[f.t].name.toLowerCase()}`).join(" and ");
  const summary = `Your biggest gaps are ${names}. Research on volitional change shows people who complete weekly behavioural challenges shift their traits measurably within about four months, and the change was still there three months later.`;
  return {
    headline: `Your route to ${b.targetName ?? "your target"}`,
    summary,
    weeks,
    ifThen: [
      "If I feel like skipping a challenge, then I'll do the smallest two-minute version of it.",
      "If it's Sunday evening, then I'll pick next week's challenge and put it in my calendar.",
    ],
    watchOut: "Traits move slowly and unevenly. Judge progress over months, not days, and don't force change in a direction that feels wrong for you.",
    narration: `You started life with a ${b.temperamentType.toLowerCase()} temperament. ${summary} Start with week one this week.`,
    source: "library",
  };
}

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  const fallback = libraryPlan(b);
  if (!aiAvailable()) return NextResponse.json(fallback);

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
