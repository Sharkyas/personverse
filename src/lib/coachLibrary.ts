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

export function libraryPlan(b: CoachRequest): CoachPlan {
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

