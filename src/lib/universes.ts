// The parallel universes: the same baby, a different world. Pure data plus one helper that re-runs the real model
// (buildReport + forecast) on the modified answers. No model maths lives here.
import { buildReport, forecast, pct, type Report, type TraitForecast, type Vec } from "./model";
import { closestType } from "./mbti";
import { TRAITS, type LifeEvent, type Trait } from "./params";
import type { Answers } from "./questions";

export type Universe = {
  id: string;
  /** "The nomad universe" */
  name: string;
  /** "You, after years living abroad" */
  you: string;
  blurb: string;
  /** where this timeline leaves yours: in childhood (a different upbringing) or from now on (a different next chapter) */
  splits: "none" | "childhood" | "now";
  upbringing?: Partial<Answers["upbringing"]>;
  events?: LifeEvent[];
};

export const UNIVERSES: Universe[] = [
  { id: "you", name: "Your universe", you: "You, as life actually went", blurb: "The life you described.", splits: "none" },
  {
    id: "warm",
    name: "The sheltered universe",
    you: "You, raised in a warm, steady home",
    blurb: "Warmest possible home, no adversity, never moved.",
    splits: "childhood",
    upbringing: { warmth: 5, harshness: 1, adversity: 1, ses: 4, moves: 1 },
  },
  {
    id: "restless",
    name: "The restless universe",
    you: "You, if home kept moving",
    blurb: "A new town and a new school every couple of years.",
    splits: "childhood",
    upbringing: { moves: 5, ses: 2 },
  },
  {
    id: "tough",
    name: "The hard-knocks universe",
    you: "You, if life hit harder early",
    blurb: "Cold, strict home, lots of instability.",
    splits: "childhood",
    upbringing: { warmth: 1, harshness: 5, adversity: 5, ses: 1, moves: 5 },
  },
  { id: "nomad", name: "The nomad universe", you: "You, after years living abroad", blurb: "University, then years living abroad.", splits: "now", events: ["university", "abroad", "job"] },
  {
    id: "growth",
    name: "The growth universe",
    you: "You, if you did the inner work",
    blurb: "Therapy or coaching plus a stable relationship.",
    splits: "now",
    events: ["therapy", "relationship", "job"],
  },
  { id: "settled", name: "The settled universe", you: "You, if you put down roots", blurb: "A long-term partner, a steady job, a child.", splits: "now", events: ["relationship", "job", "parenthood"] },
  { id: "drift", name: "The drift universe", you: "You, if the next years drift", blurb: "No big commitments, a long stretch out of work.", splits: "now", events: ["unemployment"] },
];

export type UniverseOutcome = {
  universe: Universe;
  events: LifeEvent[];
  /** counterfactual you today (z) */
  now: Vec;
  future: TraitForecast[];
  /** expected you at the horizon age (z) */
  futureZ: Vec;
  /** likeliest four-letter type at the horizon age, and how likely it is */
  type: ReturnType<typeof closestType>;
  /** average chance that a trait shifts meaningfully between now and the horizon */
  shift: number;
  /** percentile-point difference from your own universe at the horizon, per trait */
  diff: Vec;
  /** the trait that differs most from your own universe, or null when nothing differs by a whole point */
  biggest: { trait: Trait; points: number } | null;
};

/** The answers this universe's you would have given: same baby, same test, different upbringing or next chapter. */
export function universeAnswers(a: Answers, u: Universe, events?: LifeEvent[]): Answers {
  return { ...a, upbringing: { ...a.upbringing, ...(u.upbringing ?? {}) }, events: events ?? u.events ?? a.events };
}

/**
 * Runs the model for one universe. Counterfactual "now" = your actual now, shifted by how much the different upbringing
 * moves the model's prediction; the forecast then runs from there with that universe's life events.
 */
export function universeOutcome(a: Answers, report: Report, u: Universe, eventsOverride?: LifeEvent[]): UniverseOutcome {
  const alt = universeAnswers(a, u, eventsOverride);
  const altR = buildReport(alt);
  const now = {} as Vec;
  for (const t of TRAITS) now[t] = report.now[t] + (altR.predictedAdult[t] - report.predictedAdult[t]);
  const future = forecast(now, alt.age, alt.horizon, alt.events);
  const futureZ = Object.fromEntries(future.map((f) => [f.trait, f.expected])) as Vec;
  const diff = {} as Vec;
  let biggest: UniverseOutcome["biggest"] = null;
  for (const f of report.future) {
    const d = pct(futureZ[f.trait]) - pct(f.expected);
    diff[f.trait] = d;
    if (Math.abs(d) >= 1 && (!biggest || Math.abs(d) > Math.abs(biggest.points))) biggest = { trait: f.trait, points: d };
  }
  return {
    universe: u,
    events: alt.events,
    now,
    future,
    futureZ,
    // your direct type answers carry over: they measure the part of each letter the Big Five miss, which stays with you
    type: closestType(futureZ, report.detailed ? report.rel : undefined, report.oejts),
    shift: future.reduce((s, f) => s + f.pChange, 0) / future.length,
    diff,
    biggest,
  };
}

export function allOutcomes(a: Answers, report: Report): UniverseOutcome[] {
  return UNIVERSES.map((u) => universeOutcome(a, report, u));
}

const DIRECTION: Record<Trait, { up: string; down: string }> = {
  O: { up: "more curious and open to new things", down: "more practical and settled in what you know" },
  C: { up: "more organised and disciplined", down: "looser about plans and deadlines" },
  E: { up: "more outgoing", down: "quieter and more reserved" },
  A: { up: "warmer and more trusting", down: "blunter and more guarded" },
  N: { up: "more easily stressed", down: "calmer under pressure" },
};

/** One plain sentence on how this universe's you differs most from the real one. */
export function biggestDifference(o: UniverseOutcome, horizon: number): string {
  if (o.universe.id === "you") return "This is the baseline: every other universe is measured against it.";
  if (!o.biggest) return "Almost identical to you. A different world moves personality less than people expect.";
  const { trait, points } = o.biggest;
  const n = Math.abs(points);
  return `By ${horizon}, ${DIRECTION[trait][points > 0 ? "up" : "down"]}: about ${n} percentile ${n === 1 ? "point" : "points"} from your own universe.`;
}
