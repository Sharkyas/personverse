// Optional extra context for the coach and explainer prompts. Everything that reaches a prompt from here is either
// picked from a fixed list or a clamped number, so a client cannot inject free text through it.
import { TRAITS, TRAIT_META, LIFE_EVENTS, type Trait, type LifeEvent } from "./params";
import type { CoachContext } from "./coachLibrary";

/** IPIP-NEO facets (Goldberg, 1999; public domain), in plain words. */
export const FACETS: Record<Trait, string[]> = {
  O: ["imagination", "artistic interests", "emotionality", "adventurousness", "intellect", "openness to other values"],
  C: ["self-efficacy", "orderliness", "dutifulness", "achievement-striving", "self-discipline", "cautiousness"],
  E: ["friendliness", "gregariousness", "assertiveness", "activity level", "excitement-seeking", "cheerfulness"],
  A: ["trust", "straightforwardness", "altruism", "cooperation", "modesty", "sympathy"],
  N: ["anxiety", "anger", "sadness", "self-consciousness", "impulsiveness", "vulnerability to stress"],
};

export const STAGES = ["at school or college", "at university", "working", "between jobs", "caring for family full-time", "retired"] as const;
export type Stage = (typeof STAGES)[number];

/** Labels from other typologies that people use about themselves. They are passed through as labels only. */
export const SELF_LABELS: string[] = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `Enneagram ${n}`),
  ...["1w9", "1w2", "2w1", "2w3", "3w2", "3w4", "4w3", "4w5", "5w4", "5w6", "6w5", "6w7", "7w6", "7w8", "8w7", "8w9", "9w8", "9w1"].map((w) => `Enneagram ${w}`),
  "DISC high D", "DISC high I", "DISC high S", "DISC high C", "DISC D/I", "DISC I/S", "DISC S/C", "DISC C/D",
  "Type A personality", "Type B personality",
  "sanguine", "choleric", "melancholic", "phlegmatic",
  "highly sensitive person", "ambivert", "empath",
  "Keirsey Guardian", "Keirsey Artisan", "Keirsey Idealist", "Keirsey Rational",
  ...["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"].flatMap((t) => [`16Personalities ${t}-A`, `16Personalities ${t}-T`]),
  "HEXACO high Honesty-Humility", "HEXACO low Honesty-Humility",
  "CliftonStrengths Achiever", "CliftonStrengths Strategic", "CliftonStrengths Relator", "CliftonStrengths Learner",
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const UP_WORDS: Record<string, string[]> = {
  warmth: ["home was cold and distant", "home was a bit cold", "", "home was warm", "home was very warm"],
  harshness: ["rules were very relaxed", "rules were fairly relaxed", "", "rules were strict", "rules were very strict"],
  adversity: ["", "one or two hard things happened", "some hard things happened", "quite a lot of hard things happened", "a lot of hard things happened"],
  ses: ["money was a struggle", "money was tight", "", "money was comfortable", "money was very comfortable"],
  moves: ["", "", "moved house or school a few times", "moved house or school often", "moved house or school all the time"],
};

const pctOf = (p: number) => Math.round(Math.min(0.99, Math.max(0.5, Number(p) || 0.5)) * 100);

/** Drops anything that is not on the fixed lists. Use on untrusted input before building a prompt. */
export function cleanContext(raw: unknown): CoachContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: CoachContext = {};
  const m = o.mbti as { type?: unknown; letters?: unknown } | undefined;
  if (m && typeof m.type === "string" && /^[EI][SN][TF][JP]$/.test(m.type) && Array.isArray(m.letters) && m.letters.length === 4) {
    const type = m.type;
    const letters = (m.letters as { letter?: unknown; p?: unknown }[]).map((l, i) => ({ letter: type[i], p: pctOf(Number(l?.p)) / 100 }));
    out.mbti = { type, letters };
  }
  if (o.upbringing && typeof o.upbringing === "object") {
    const u: NonNullable<CoachContext["upbringing"]> = {};
    for (const k of Object.keys(UP_WORDS) as (keyof NonNullable<CoachContext["upbringing"]>)[]) {
      const v = Math.round(Number((o.upbringing as Record<string, unknown>)[k]));
      if (v >= 1 && v <= 5) u[k] = v;
    }
    if (Object.keys(u).length) out.upbringing = u;
  }
  if (Array.isArray(o.facets)) {
    const f = (o.facets as { trait?: unknown; name?: unknown; level?: unknown }[])
      .filter((x) => x && TRAITS.includes(x.trait as Trait) && FACETS[x.trait as Trait].includes(String(x.name)) && (x.level === "low" || x.level === "high"))
      .slice(0, 4)
      .map((x) => ({ trait: x.trait as Trait, name: String(x.name), level: x.level as "low" | "high" }));
    if (f.length) out.facets = f;
  }
  if (typeof o.selfLabel === "string" && SELF_LABELS.includes(o.selfLabel)) out.selfLabel = o.selfLabel;
  if (typeof o.stage === "string" && (STAGES as readonly string[]).includes(o.stage)) out.stage = o.stage;
  if (Array.isArray(o.events)) {
    const e = [...new Set((o.events as unknown[]).filter((x): x is LifeEvent => typeof x === "string" && x in LIFE_EVENTS && x !== "practice"))];
    if (e.length) out.events = e;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The "Extra context" block of a prompt, or "" when there is none. */
export function contextLines(raw: CoachContext | undefined, header = "Extra context (use it to tailor the plan; it does not change which traits to work on):"): string {
  const c = cleanContext(raw);
  if (!c) return "";
  const lines: string[] = [];
  if (c.mbti) {
    const weakest = [...c.mbti.letters].sort((a, b) => a.p - b.p)[0];
    const pair = ["E/I", "S/N", "T/F", "J/P"][c.mbti.letters.indexOf(weakest)];
    lines.push(
      `- Likely four-letter type, estimated from the Big Five (not a measured MBTI result): ${c.mbti.type}. Letter odds: ${c.mbti.letters.map((l) => `${l.letter} ${pctOf(l.p)}%`).join(", ")}. Closest call: ${pair}.`,
    );
  }
  if (c.upbringing) {
    const parts = (Object.entries(c.upbringing) as [string, number][]).map(([k, v]) => UP_WORDS[k][v - 1]).filter(Boolean);
    lines.push(`- Upbringing, in their own answers: ${parts.length ? parts.join("; ") : "about average on every question"}.`);
  }
  if (c.facets) lines.push(`- Standout facets: ${c.facets.map((f) => `${f.level} ${f.name} (${TRAIT_META[f.trait].name})`).join(", ")}.`);
  if (c.selfLabel) lines.push(`- Their own label from another system: ${c.selfLabel}. Treat it as a label only, not as a measurement.`);
  if (c.stage) lines.push(`- Stage of life: ${c.stage}.`);
  if (c.events) lines.push(`- Expecting in the next few years: ${c.events.map((e) => LIFE_EVENTS[e as LifeEvent].label.toLowerCase()).join(", ")}.`);
  return lines.length ? `\n${header}\n${lines.join("\n")}\n` : "";
}
