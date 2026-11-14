import { TRAITS, TRAIT_META, type Trait } from "./params";
import { groundingFor, type CoachRequest } from "./coachLibrary";

/** The exact coach prompt, shared by the API route, the synthetic-data generator and the eval, so training matches serving. */
export function buildCoachPrompt(b: CoachRequest): string {
  const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
  const fmt = (v: Record<Trait, number>) => TRAITS.map((t) => `${TRAIT_META[t].name} ${ord(Math.round(v[t]))} percentile`).join(", ");
  return `You are an evidence-based personality-development coach. Ground advice in research on volitional personality change (Hudson & Fraley 2015; Stieger et al. 2021 PNAS; Roberts et al. 2017). Be warm, concrete, British English, no clichés, no em dashes. Never diagnose.

User: ${b.name ? b.name + ", " : ""}age ${b.age}. Early temperament type: ${b.temperamentType}.
Estimated baby temperament: ${fmt(b.babyPct)}.
Current personality: ${fmt(b.nowPct)}.
Target ("${b.targetName ?? "custom"}"): ${fmt(b.targetPct)}.
Model's chance each trait shifts meaningfully by their chosen age: ${TRAITS.map((t) => `${t} ${Math.round(b.pChange[t] * 100)}%`).join(", ")}.
Note: for Neuroticism a LOWER target means calmer.

The two gaps to work on, with vetted examples (adapt them to this person, do not invent other traits):
${groundingFor(b)}

Return JSON with exactly these keys:
{"headline": string (max 8 words),
 "summary": string (2-3 sentences on the biggest gaps and what is realistic),
 "weeks": [{"week": 1-8, "trait": one of "O","C","E","A","N", "challenge": one concrete behaviour to do that week, specific to someone of their age and stage of life, "why": one sentence}] (8 items, focus on the 2 largest gaps),
 "ifThen": [2 implementation intentions, "If ..., then I will ..."],
 "watchOut": one sentence of honest caution,
 "narration": a 70-110 word script to be read aloud by a narrator, second person, upbeat, mentioning their starting temperament and where they are heading}`;
}

export const JSON_SUFFIX = "\n\nRespond with ONLY valid JSON. No markdown fences, no commentary.";

/** Quality checks used to filter synthetic training data and to score the coach. */
export function checkPlan(plan: unknown, b: CoachRequest, focus: Trait[]) {
  const p = (plan && typeof plan === "object" ? plan : {}) as Record<string, unknown>;
  const weeks = Array.isArray(p.weeks) ? (p.weeks as { trait?: string; challenge?: string; why?: string }[]) : [];
  const onFocus = weeks.length ? weeks.filter((w) => focus.includes(w.trait as Trait)).length / weeks.length : 0;
  const ifThen = Array.isArray(p.ifThen) ? (p.ifThen as unknown[]) : [];
  const narr = typeof p.narration === "string" ? p.narration.split(/\s+/).length : 0;
  const text = JSON.stringify(p);
  const checks = {
    shape: typeof p.headline === "string" && typeof p.summary === "string" && typeof p.watchOut === "string",
    eightWeeks: weeks.length === 8 && weeks.every((w) => typeof w.challenge === "string" && w.challenge.length > 15 && typeof w.why === "string"),
    onFocus: onFocus === 1,
    coversBoth: focus.every((t) => weeks.some((w) => w.trait === t)),
    ifThen: ifThen.length >= 2 && ifThen.every((s) => typeof s === "string" && /^if\b/i.test(s) && /\bthen\b/i.test(s)),
    narration: narr >= 60 && narr <= 130,
    noEmDash: !text.includes("—"),
  };
  return { checks, onFocus, pass: Object.values(checks).every(Boolean) };
}
