import { CHALLENGES } from "./challenges";
import { TRAITS, TRAIT_META, type Trait } from "./params";

// Offline coach: used by the server when no AI is reachable, and by the browser if the network drops.
export type CoachRequest = {
  name?: string;
  age: number;
  temperamentType: string;
  nowPct: Record<Trait, number>;
  babyPct: Record<Trait, number>;
  targetPct: Record<Trait, number>;
  targetName?: string;
  pChange: Record<Trait, number>;
  /** Optional extra context about the person. Every field is an enum or a number, so it is safe to put in a prompt. */
  context?: CoachContext;
};

export type CoachContext = {
  /** Four-letter type estimated from the Big Five (never a measured MBTI result), with the chance of each letter. */
  mbti?: { type: string; letters: { letter: string; p: number }[] };
  /** Answers to the upbringing questions, 1-5. */
  upbringing?: Partial<Record<"warmth" | "harshness" | "adversity" | "ses" | "moves", number>>;
  /** Facets that stand out from the person's own average (IPIP-NEO facet names). */
  facets?: { trait: Trait; name: string; level: "low" | "high" }[];
  /** A label from another typology that the person gave about themselves. A label only: nothing is inferred from it. */
  selfLabel?: string;
  stage?: string;
  events?: string[];
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

/** The two biggest gaps between now and target (at least 10 points), or conscientiousness up if there are none. */
export function focusGaps(b: Pick<CoachRequest, "nowPct" | "targetPct">): { t: Trait; g: number }[] {
  const gaps = TRAITS.map((t) => ({ t, g: b.targetPct[t] - b.nowPct[t] }))
    .filter((x) => Math.abs(x.g) >= 10)
    .sort((x, y) => Math.abs(y.g) - Math.abs(x.g));
  return gaps.length ? gaps.slice(0, 2) : [{ t: "C" as Trait, g: 10 }];
}

/** Retrieval for the AI coach: the vetted challenges for this person's own gaps, as worked examples to adapt. */
export function groundingFor(b: Pick<CoachRequest, "nowPct" | "targetPct">): string {
  return focusGaps(b)
    .map((f) => {
      const dir = f.g > 0 ? "up" : "down";
      const label = `${TRAIT_META[f.t].name} (${f.t}) ${dir === "up" ? "UP" : "DOWN"} by about ${Math.abs(Math.round(f.g))} points`;
      return `${label}. Example challenges that worked in trials:\n${CHALLENGES[f.t][dir].map((c) => `- ${c}`).join("\n")}`;
    })
    .join("\n\n");
}

export function libraryPlan(b: CoachRequest): CoachPlan {
  const focus = focusGaps(b);
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

