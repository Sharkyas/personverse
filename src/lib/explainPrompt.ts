// Prompts for the "explain this result" side of the coach. Shared by the synthetic-data generator and (when a route
// serves them) the app, so training matches serving. Every number in a prompt comes from the app's own model.
import { TRAITS, TRAIT_META, type Trait } from "./params";
import type { CoachContext } from "./coachLibrary";
import { contextLines } from "./coachContext";

const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const pc = (p: number) => `${Math.round(p * 100)}%`;
const signed = (x: number) => `${x >= 0 ? "+" : "-"}${Math.abs(x).toFixed(2)}`;
const fmtPct = (v: Record<Trait, number>) => TRAITS.map((t) => `${TRAIT_META[t].name} ${ord(Math.round(v[t]))} percentile`).join(", ");

const HEAD = `You explain one result from a personality report to the person it is about. Plain British English for a curious non-specialist. Use only the numbers given. Be honest about uncertainty: these are population-level odds, not a prediction for one individual. Warm, concrete, no clichés, no em dashes. Never diagnose.`;

export type ForecastExplain = {
  kind: "forecast";
  name?: string;
  age: number;
  horizon: number;
  trait: Trait;
  nowPct: number;
  expectedPct: number;
  pChange: number;
  pUp: number;
  pDown: number;
  /** The model's drivers for this trait, in SD units (positive = higher on the trait). */
  drivers: { label: string; effect: number }[];
};

export type BabyExplain = {
  kind: "baby";
  name?: string;
  age: number;
  /** How baby temperament was estimated. */
  method: "stories" | "backwards";
  recall?: "told in detail" | "some stories" | "mostly guessing";
  parentsRated: number;
  babyPct: Record<Trait, number>;
  /** 80% range for each trait, as percentiles. */
  range: Record<Trait, [number, number]>;
  nowPct: Record<Trait, number>;
  types: { type: string; p: number }[];
  pDrift: Record<Trait, number>;
};

export type TypeExplain = {
  kind: "type";
  name?: string;
  age: number;
  horizon: number;
  type: string;
  letters: { letter: string; other: string; p: number }[];
  runnersUp: { type: string; p: number }[];
  pTypeChanges: number;
  nowPct: Record<Trait, number>;
};

export type QuestionExplain = {
  kind: "question";
  name?: string;
  age: number;
  question: string;
  nowPct: Record<Trait, number>;
  context?: CoachContext;
};

export type ExplainRequest = ForecastExplain | BabyExplain | TypeExplain | QuestionExplain;

export function buildExplainPrompt(b: ExplainRequest): string {
  const who = `${b.name ? b.name + ", " : ""}age ${b.age}`;
  if (b.kind === "forecast") {
    const T = TRAIT_META[b.trait].name;
    return `${HEAD}

Person: ${who}.
Result to explain: the model gives ${T} a ${pc(b.pChange)} chance of a meaningful shift (half a standard deviation or more, in either direction) between age ${b.age} and age ${b.horizon}.
${T} now: ${ord(Math.round(b.nowPct))} percentile. Expected at ${b.horizon}: ${ord(Math.round(b.expectedPct))} percentile. Chance of a meaningful rise: ${pc(b.pUp)}. Chance of a meaningful fall: ${pc(b.pDown)}.${b.trait === "N" ? " For Neuroticism, lower means calmer." : ""}
What moves the estimate, in standard deviations (positive raises ${T}):
${b.drivers.map((d) => `- ${d.label}: ${signed(d.effect)}`).join("\n")}

Return JSON with exactly these keys:
{"headline": string (max 10 words),
 "explanation": string (3-4 sentences, plain words, using the numbers above),
 "drivers": [{"label": the driver's label as given, "effect": "raises" or "lowers", "plain": one sentence on why}] (the drivers above, biggest first, at most 3),
 "caveat": one sentence of honest caution}`;
  }
  if (b.kind === "baby") {
    const method =
      b.method === "stories"
        ? `from what they have been told about themselves as a baby (${b.recall ?? "some stories"})${b.parentsRated ? `, plus their ratings of ${b.parentsRated} parent${b.parentsRated > 1 ? "s" : ""}` : ""}`
        : `worked out backwards from who they are now and their upbringing${b.parentsRated ? `, plus their ratings of ${b.parentsRated} parent${b.parentsRated > 1 ? "s" : ""}` : ""}`;
    return `${HEAD}

Person: ${who}.
Result to explain: the estimate of their temperament as a baby. Personality cannot be measured at birth; this is an estimate of early temperament, ${method}.
Estimated baby temperament, with the range we are 80% sure of:
${TRAITS.map((t) => `- ${TRAIT_META[t].name}: ${ord(Math.round(b.babyPct[t]))} percentile (${ord(Math.round(b.range[t][0]))} to ${ord(Math.round(b.range[t][1]))})`).join("\n")}
Likeliest baby types: ${b.types.map((x) => `${x.type} ${pc(x.p)}`).join(", ")}.
Current personality: ${fmtPct(b.nowPct)}.
Chance each trait now sits meaningfully away from the baby estimate: ${TRAITS.map((t) => `${t} ${pc(b.pDrift[t])}`).join(", ")}.

Return JSON with exactly these keys:
{"headline": string (max 10 words),
 "explanation": string (3-4 sentences on what the estimate says and how it was reached),
 "mostCertain": one sentence on the trait with the narrowest range and what that means,
 "caveat": one sentence of honest caution about how rough this is}`;
  }
  if (b.kind === "type") {
    const weakest = [...b.letters].sort((x, y) => x.p - y.p)[0];
    return `${HEAD}

Person: ${who}.
Result to explain: their likely four-letter type. It is estimated from their Big Five scores using published correlations. They did not take the MBTI.
Likeliest type: ${b.type}. Letter odds: ${b.letters.map((l) => `${l.letter} ${pc(l.p)} (${l.other} ${pc(1 - l.p)})`).join(", ")}. Closest call: ${weakest.letter} against ${weakest.other}.
Next most likely types: ${b.runnersUp.map((x) => `${x.type} ${pc(x.p)}`).join(", ")}.
Chance their likeliest type is different by age ${b.horizon}: ${pc(b.pTypeChanges)}.
Current personality: ${fmtPct(b.nowPct)}.

Return JSON with exactly these keys:
{"headline": string (max 10 words),
 "explanation": string (3-4 sentences on why this type and how sure we are),
 "closestCall": one sentence on the least certain letter and which trait would tip it,
 "caveat": one sentence of honest caution about four-letter types}`;
  }
  return `${HEAD}

Person: ${who}.
Current personality: ${fmtPct(b.nowPct)}. For Neuroticism, lower means calmer.
${contextLines(b.context, "What else we know about them:")}
They ask: "${b.question}"

Return JSON with exactly these keys:
{"answer": string (60-110 words, answers the question directly and uses their own scores where it helps),
 "evidence": "strong", "some" or "thin" (how good the research behind the answer is),
 "nextStep": one concrete thing they could do this week}`;
}
