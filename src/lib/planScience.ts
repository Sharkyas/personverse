// The science behind each step of a change plan: how the behaviour is meant to work, how strong the evidence is,
// what size of change to expect, and when. Effect sizes come from LIFE_EVENTS (practice: PEACH trial, est.; therapy:
// Roberts et al., 2017), so the plan and the odds above it always agree.
import { phi, maturation, type Vec } from "./model";
import { LIFE_EVENTS, TRAITS, TRAIT_META, type Trait } from "./params";

export type Dir = "up" | "down";
export type StepScience = { mechanism: string; evidence: string; strength: "good" | "some" | "thin"; src: string[] };

export const STEP_SCIENCE: Record<Trait, Record<Dir, StepScience>> = {
  O: {
    up: {
      mechanism: "Regular, small doses of novelty make unfamiliar ideas and places feel rewarding rather than tiring. The habit of seeking them out is what openness is.",
      evidence: "A cognitive-training programme raised openness in older adults, and spending time abroad raises it in students. In the PEACH coaching trial, people who wanted more openness moved towards it.",
      strength: "some",
      src: ["JEA2012", "ZN2013", "S2021"],
    },
    down: {
      mechanism: "Committing to routines and finishing before starting something new trades breadth for depth.",
      evidence: "Few studies try to lower openness. The direction follows the behaviour-first principle, but the size is our estimate.",
      strength: "thin",
      src: ["HF2015"],
    },
  },
  C: {
    up: {
      mechanism: "If–then plans hand the decision to a cue (a time, a place), so you don't rely on willpower in the moment. Repeating them builds the routines that conscientiousness describes.",
      evidence: "Across 94 studies, if–then plans had a medium-to-large effect on reaching goals (d = .65). In volitional change studies, conscientiousness is one of the traits people most often raise.",
      strength: "good",
      src: ["GS2006", "HF2015", "S2021"],
    },
    down: {
      mechanism: "Deliberately leaving slack, and shipping at 'good enough', loosens perfectionism and rigid planning.",
      evidence: "Rarely studied as a goal. The direction is sound but the size is our estimate.",
      strength: "thin",
      src: ["HF2015"],
    },
  },
  E: {
    up: {
      mechanism: "Acting extraverted for a while (talking first, starting conversations) tends to lift mood, even for introverts. That makes the behaviour easier to repeat.",
      evidence: "In experience-sampling studies, people felt better in the moments they acted extraverted. In a week-long randomised trial, acting extraverted lifted positive mood, though the most introverted participants also reported more tiredness.",
      strength: "good",
      src: ["FMA2002", "JSS2019", "S2021"],
    },
    down: {
      mechanism: "Protecting solo recharge time and listening more than you talk shifts how you spend social energy.",
      evidence: "Few trials try to lower extraversion. The size here is our estimate.",
      strength: "thin",
      src: ["HF2015"],
    },
  },
  A: {
    up: {
      mechanism: "Small, repeated acts of warmth and perspective-taking change how you read other people's intentions.",
      evidence: "People who set out to raise agreeableness with weekly challenges did so in the volitional change studies, but there are fewer trials than for the other traits.",
      strength: "some",
      src: ["HF2015", "H2019"],
    },
    down: {
      mechanism: "Practising saying no, giving honest feedback and negotiating builds assertiveness without losing warmth.",
      evidence: "Rarely studied as a goal. The direction follows the behaviour-first principle; the size is our estimate.",
      strength: "thin",
      src: ["HF2015"],
    },
  },
  N: {
    down: {
      mechanism: "Naming a feeling, checking the worst, best and most likely case, and facing small fears on purpose all weaken the habit of reacting to stress as a threat.",
      evidence: "Emotional stability is the trait interventions move most: d = .57 on average across 207 studies, mostly therapy. Putting feelings into words reduces the brain's alarm response in the moment.",
      strength: "good",
      src: ["R2017", "LEA2007", "S2021"],
    },
    up: {
      mechanism: "Noticing and sharing feelings you usually brush past builds emotional awareness. That is not the same as more anxiety.",
      evidence: "Raising neuroticism is not a goal anyone studies. We frame it as emotional awareness and keep the size small.",
      strength: "thin",
      src: ["HF2015"],
    },
  },
};

export const STRENGTH_LABEL: Record<StepScience["strength"], string> = { good: "Strong evidence", some: "Some evidence", thin: "Thin evidence" };

/** Which way each trait needs to move to reach the target (null when already within a quarter of an SD). */
export function directions(nowPct: Vec, targetPct: Vec): Record<Trait, Dir | null> {
  return Object.fromEntries(
    TRAITS.map((t) => {
      const g = targetPct[t] - nowPct[t];
      return [t, Math.abs(g) < 10 ? null : g > 0 ? "up" : "down"];
    }),
  ) as Record<Trait, Dir | null>;
}

export type Outlook = { trait: Trait; dir: Dir; now: number; target: number; challenges16w: number; coached16w: number; d: number; dCoach: number };

/** Where the focus traits are likely to be after 16 weeks: expected percentile with weekly challenges, and with coaching added. */
export function outlook(nowZ: Vec, targetPct: Vec, age: number): Outlook[] {
  const nowPct = Object.fromEntries(TRAITS.map((t) => [t, Math.round(phi(nowZ[t]) * 100)])) as Vec;
  const dirs = directions(nowPct, targetPct);
  const mat = maturation(age, age + 16 / 52);
  return TRAITS.filter((t) => dirs[t])
    .map((t) => {
      const dir = dirs[t]!;
      const s = dir === "up" ? 1 : -1;
      const d = Math.abs(LIFE_EVENTS.practice.d[t]);
      const dCoach = Math.abs(LIFE_EVENTS.therapy.d[t]) * 0.6;
      const z = nowZ[t] + mat[t];
      return {
        trait: t,
        dir,
        now: nowPct[t],
        target: targetPct[t],
        challenges16w: Math.round(phi(z + s * d) * 100),
        coached16w: Math.round(phi(z + s * (d + dCoach)) * 100),
        d,
        dCoach,
      };
    })
    .sort((a, b) => Math.abs(b.target - b.now) - Math.abs(a.target - a.now));
}

export const TIMELINE: { when: string; what: string; src: string }[] = [
  { when: "Weeks 1–2", what: "It feels like acting. That's expected: behaviour changes before the trait does.", src: "HF2015" },
  { when: "Weeks 3–8", what: "Your 8-week plan. Completing challenges is what predicts change. Signing up and skipping them can push you the other way.", src: "H2019" },
  { when: "Months 3–4", what: "Where the trials measure. In PEACH, friends and partners started to notice the increases.", src: "S2021" },
  { when: "+3 months", what: "In PEACH, the changes were still there three months after coaching ended.", src: "S2021" },
  { when: "1 year", what: "Check yourself against your forecast with the tracker. Expect noise week to week, and a trend over months.", src: "G2003" },
];

export const dirWord = (t: Trait, dir: Dir) => `${dir === "up" ? "more" : "less"} ${TRAIT_META[t].name.toLowerCase()}`;
