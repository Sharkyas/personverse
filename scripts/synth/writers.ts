/*
 * Writers for the SYNTHETIC v2 data: given a synthetic person (profiles.ts) they compose the ideal answer to each
 * prompt from the hand-written library (content.ts). Every number they state is computed from the app's own model
 * or read from research/research.md, and the validators (validate.ts) recompute them from the prompt alone.
 */
import { invPhi, phi } from "@/lib/model";
import { TRAITS, TRAIT_META, LIFE_EVENTS, type Trait, type LifeEvent } from "@/lib/params";
import { focusGaps, type CoachRequest, type CoachContext } from "@/lib/coachLibrary";
import { FACETS, STAGES } from "@/lib/coachContext";
import type { FutureSelfRequest } from "@/lib/futureSelfTemplate";
import type { ForecastExplain, BabyExplain, TypeExplain } from "@/lib/explainPrompt";
import { LIB, IF_THEN, IF_THEN_GENERIC, WORDS, EVIDENCE, THIN_WATCHOUT, GENERIC_WATCHOUT, SLOTS, type Dir, type StageKey, type Ch } from "./content";
import { pick, shuffle, type Rnd } from "./profiles";

export const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const pc = (p: number) => Math.round(p * 100);
/** "a 46%" / "an 88%": the article that goes before a number. */
export const an = (n: number) => (/^(8|11$|18$)/.test(String(n)) ? "an" : "a");

/** Size of change the app assumes for 16 weeks of completed weekly challenges (params.ts: LIFE_EVENTS.practice). */
export const PRACTICE_D = 0.35;
/** Where a trait is expected to be after 16 weeks of challenges, as a percentile. */
export function expected16(nowPct: number, dir: Dir): number {
  const z = invPhi(Math.min(99, Math.max(1, nowPct)) / 100);
  return Math.round(phi(z + (dir === "up" ? 1 : -1) * PRACTICE_D) * 100);
}

export const STAGE_OF: Record<string, StageKey> = Object.fromEntries(STAGES.map((s, i) => [s, (["school", "uni", "work", "between", "caring", "retired"] as StageKey[])[i]]));
export const STAGE_LABEL: Record<StageKey, string> = Object.fromEntries(Object.entries(STAGE_OF).map(([k, v]) => [v, k])) as Record<StageKey, string>;
export const fill = (text: string, stage: StageKey) => text.replace(/\{(\w+)\}/g, (_, k) => SLOTS[stage][k] ?? k);

type Focus = { t: Trait; g: number; dir: Dir; now: number; target: number };
export function focusOf(b: Pick<CoachRequest, "nowPct" | "targetPct">): Focus[] {
  return focusGaps(b).map((f) => ({ t: f.t, g: f.g, dir: f.g > 0 ? "up" : "down", now: Math.round(b.nowPct[f.t]), target: Math.round(b.targetPct[f.t]) }));
}

const LEVELS: Record<number, { std: number[]; gentle: number[] }> = {
  3: { std: [1, 2, 3], gentle: [1, 1, 2] },
  4: { std: [1, 2, 2, 3], gentle: [1, 1, 2, 3] },
  5: { std: [1, 2, 2, 3, 3], gentle: [1, 1, 2, 2, 3] },
  8: { std: [1, 1, 2, 2, 2, 3, 3, 3], gentle: [1, 1, 1, 2, 2, 2, 3, 3] },
};

/** Facets the person flagged that sit on the side they want to move away from (low when raising, high when lowering). */
function priorityFacets(f: Focus, ctx?: CoachContext): string[] {
  return (ctx?.facets ?? []).filter((x) => x.trait === f.t && x.level === (f.dir === "up" ? "low" : "high")).map((x) => x.name);
}

function pickWeeks(r: Rnd, f: Focus, n: number, ctx: CoachContext | undefined, stage: StageKey) {
  // Someone starting from the far end gets a gentler ramp: graded practice starts where the person is.
  const extreme = f.dir === "up" ? f.now <= 15 : f.now >= 85;
  const seq = LEVELS[n][extreme ? "gentle" : "std"];
  const prio = priorityFacets(f, ctx);
  const pool = shuffle(r, LIB[f.t][f.dir]);
  const used = new Set<Ch>();
  const out: { trait: Trait; challenge: string; why: string; facet: string; level: number }[] = [];
  let lastFacet = "";
  for (const lv of seq) {
    const cands = pool.filter((c) => c[0] === lv && !used.has(c));
    const fallback = pool.filter((c) => !used.has(c));
    const from = cands.length ? cands : fallback;
    const c = from.find((x) => prio.includes(x[1]) && x[1] !== lastFacet) ?? from.find((x) => prio.includes(x[1])) ?? from.find((x) => x[1] !== lastFacet) ?? from[0];
    used.add(c);
    lastFacet = c[1];
    out.push({ trait: f.t, challenge: fill(c[2], stage), why: fill(c[3], stage), facet: c[1], level: c[0] });
  }
  return out;
}

export type Plan = {
  headline: string;
  summary: string;
  weeks: { week: number; trait: Trait; challenge: string; why: string }[];
  ifThen: string[];
  watchOut: string;
  narration: string;
};

const BABY_OPEN: Record<string, string[]> = {
  spirited: [
    "You started out as a spirited baby, intense and quick to let everyone know how you felt.",
    "As a baby you were the spirited sort: big reactions, strong opinions and not much patience.",
    "You began life as a spirited baby with big feelings and plenty of volume.",
    "The baby version of you was spirited: lively, loud and hard to ignore.",
  ],
  slow: [
    "You started out as a slow-to-warm-up baby, cautious with anything new and happier once you had the measure of it.",
    "As a baby you were slow to warm up: watchful first, settled later.",
    "You began life as a slow-to-warm-up baby who liked to size things up before joining in.",
    "The baby version of you was slow to warm up, wary of new faces and fine once things were familiar.",
  ],
  easy: [
    "You started out as an easy baby, regular, cheerful and quick to adapt.",
    "As a baby you were the easy sort, smiley, settled and happy to go along with things.",
    "You began life with an easy temperament: predictable, adaptable and hard to upset.",
    "The baby version of you had an easy temperament, calm in new places and quick to settle.",
  ],
  mixed: [
    "You started out with a mixed temperament, a bit of everything and no single neat box.",
    "As a baby you had a mixed temperament: some caution, some spark and some calm.",
    "You began life with a mixed temperament that did not fit one type, like about a third of babies.",
    "The baby version of you had a mixed temperament, easy on some days and anything but on others.",
  ],
};
const babyKey = (type: string) => {
  const t = type.toLowerCase();
  return t.startsWith("spirit") ? "spirited" : t.startsWith("slow") ? "slow" : t.startsWith("easy") ? "easy" : "mixed";
};
const BABY_HONEST = [
  "Early temperament is only a loose guide to the adult, so that was a starting point and not a script.",
  "That early wiring nudges where you start and leaves most of the story open.",
  "Babies do not arrive with a fixed personality, and yours left plenty of room.",
  "What you were like then predicts only a little of who you are now.",
  "The link between a baby's temperament and the adult is real but weak, so nothing was settled then.",
  "Plenty of babies like that grow into very different adults, which is why this is a sketch and no more.",
];
const NARR_REAL = [
  "People who finish challenges like these usually see a real shift within three or four months.",
  "Stick with it, and the research says the change tends to show within about four months and to last.",
  "Do the challenges, not just read them, and in a few months the people around you may start to notice.",
  "In the trials, people who kept going changed measurably in about three months, and it held afterwards.",
  "Finishing the weekly challenges is what moved people in the studies, usually by a modest, lasting amount within four months.",
  "Give it about four months of finished challenges, which is how long the research took to show a lasting shift.",
];
const NARR_CLOSE = ["Week one is short on purpose, so start it today.", "Read week one now and decide when you will do it.", "Start with week one today.", "Week one starts now, and it is a small one.", "Begin this week, keep it small and keep going.", "Week one is waiting, and it is deliberately easy.", "Pick a day for week one and you have begun."];
const NARR_EXTRA = [
  "The first fortnight will feel a bit like acting, which is normal and fades.",
  "None of it asks you to become someone else, only to repeat a few small things until they feel like yours.",
  "You will not notice much in the first two weeks, and that is exactly as expected.",
  "If a week feels too big, halve it and do that, because a finished small step beats a skipped large one.",
  "Other people tend to notice later than you do, so do not wait for comments before trusting it.",
];

function headline(r: Rnd, fs: Focus[], b: CoachRequest, noGap: boolean): string {
  const a = pick(r, WORDS[fs[0].t][fs[0].dir].adj);
  const bb = fs[1] ? pick(r, WORDS[fs[1].t][fs[1].dir].adj) : undefined;
  const short = (x: string) => words(x) <= 2;
  const named = b.targetName && b.targetName !== "custom" ? b.targetName : undefined;
  const opts: string[] = [];
  if (noGap) opts.push("Holding steady where you already are", "Already close: a plan to stay there", "Keeping what you have built", "Close to target, so keep it steady");
  else {
    if (bb) opts.push(`${cap(a)}, ${bb}: eight small weeks`, `Two gaps, eight weeks: ${a}, ${bb}`, `${cap(a)} and ${bb}, one week at a time`, `${cap(a)} first, then ${bb}`, `Small steps to ${a} and ${bb}`, `Eight weeks: ${a} and ${bb}`);
    else opts.push(`Becoming ${a}, step by step`, `${cap(a)}: one small challenge a week`, `${cap(a)}, one week at a time`, `Eight weeks on being ${a}`, `One trait, eight weeks: ${a}`);
    if (named) opts.push(`Your eight weeks towards ${named}`, `Closing the gap to ${named}`);
    if (b.name && short(a) && (!bb || short(bb))) opts.push(bb ? `A ${a}, ${bb} ${b.name}` : `A ${a} ${b.name}`);
  }
  const ok = opts.filter((o) => words(o) <= 8);
  return pick(r, ok.length ? ok : [`${cap(a)}, week by week`]);
}

const LETTER_TRAIT: Record<string, Trait> = { "E/I": "E", "S/N": "O", "T/F": "A", "J/P": "C" };
/** Which way the driving trait must move to flip a letter. */
const FLIP: Record<string, Dir> = { E: "down", I: "up", S: "up", N: "down", T: "up", F: "down", J: "down", P: "up" };

const EVENT_LINES: Partial<Record<LifeEvent, Partial<Record<string, string>>>> = {
  job: { "C:up": "Starting a first full-time job tends to nudge conscientiousness up a little by itself, so the timing helps.", "N:down": "Starting a first full-time job tends to go with slightly lower neuroticism, so the timing helps." },
  relationship: { "N:down": "A first long-term relationship tends to go with slightly lower neuroticism, which works in your favour.", "E:up": "A first long-term relationship tends to go with a small rise in extraversion, which works in your favour." },
  university: { "C:up": "University tends to nudge conscientiousness the same way by a small amount.", "A:up": "University tends to nudge agreeableness the same way by a small amount.", "N:down": "University tends to nudge neuroticism the same way by a small amount.", "O:up": "University tends to nudge openness the same way by a small amount." },
  abroad: { "O:up": "Living abroad tends to raise openness a little by itself, so the two will work together.", "N:down": "Living abroad tends to go with slightly lower neuroticism, so the two will work together.", "A:up": "Living abroad tends to go with slightly higher agreeableness, so the two will work together." },
  unemployment: { "C:up": "Long spells out of work tend to pull conscientiousness down a little, which makes a routine like this more useful, not less." },
  therapy: { "N:down": "Therapy has the best-documented effect of anything on neuroticism, so combining it with these challenges is the strongest option you have." },
};

function summary(r: Rnd, fs: Focus[], b: CoachRequest, noGap: boolean, usedFacet: string | undefined): string {
  const targetRef = b.targetName && b.targetName !== "custom" ? b.targetName : "your target";
  const [A, B] = fs;
  const wA = WORDS[A.t][A.dir];
  if (noGap) {
    const near = [...TRAITS].sort((x, y) => Math.abs(b.targetPct[y] - b.nowPct[y]) - Math.abs(b.targetPct[x] - b.nowPct[x]))[0];
    const d = Math.abs(Math.round(b.targetPct[near]) - Math.round(b.nowPct[near]));
    const widest = d === 0 ? "You match it exactly on every trait." : `The widest difference is ${d} ${d === 1 ? "point" : "points"}, on ${TRAIT_META[near].name.toLowerCase()}.`;
    return pick(r, [
      `You are already within ten points of ${targetRef} on all five traits, so there is no large gap to close. ${widest} The eight weeks below are a light conscientiousness routine, a sensible default when nothing needs fixing, so expect it to steady what you have and not to move your scores far.`,
      `Nothing here is far from ${targetRef}. ${widest} With no real gap to close, the plan defaults to a gentle conscientiousness routine, so treat it as maintenance and expect small changes at most.`,
      `You are already within ten points of ${targetRef} on all five traits, so there is no large gap to close. The eight weeks below are a light conscientiousness routine, a sensible default when nothing needs fixing. Expect it to steady what you have, not to move your scores far.`,
      `Nothing here is far from ${targetRef}: every trait sits within ten points of it. With no real gap to close, the plan defaults to a gentle conscientiousness routine. Treat it as maintenance, and expect small changes at most.`,
      `On all five traits you are within ten points of ${targetRef}, which means the honest answer is that you are nearly there. The plan is a light conscientiousness routine to keep things steady, since there is no large gap to work on.`,
    ]);
  }
  let s1: string;
  if (B) {
    const wB = WORDS[B.t][B.dir];
    s1 = pick(r, [
      `Your two biggest gaps are ${wA.noun}, where you sit at the ${ord(A.now)} percentile against a target of the ${ord(A.target)}, and ${wB.noun}, at the ${ord(B.now)} against the ${ord(B.target)}.`,
      `The plan concentrates on becoming ${wA.more} and ${wB.more}, the two places where you are furthest from ${targetRef}.`,
      `${b.name ? b.name + ", the" : "The"} furthest you are from ${targetRef} is on ${wA.noun} (${ord(A.now)} percentile now, ${ord(A.target)} wanted) and ${wB.noun} (${ord(B.now)} now, ${ord(B.target)} wanted).`,
      `To reach ${targetRef} you would need to be ${wA.more} and ${wB.more}; those are your two largest gaps, at about ${Math.abs(Math.round(A.g))} and ${Math.abs(Math.round(B.g))} points.`,
      `Two gaps stand out against ${targetRef}: ${wA.noun}, at the ${ord(A.now)} percentile now with the ${ord(A.target)} wanted, and ${wB.noun}, at the ${ord(B.now)} now with the ${ord(B.target)} wanted.`,
    ]);
  } else {
    s1 = pick(r, [
      `Only one trait is meaningfully off ${targetRef}: ${wA.noun}, at the ${ord(A.now)} percentile against a target of the ${ord(A.target)}.`,
      `Your one real gap is ${wA.noun}: you are at the ${ord(A.now)} percentile and want the ${ord(A.target)}, so all eight weeks go there.`,
      `${cap(wA.noun)} is the only trait more than ten points from ${targetRef} (${ord(A.now)} percentile now, ${ord(A.target)} wanted), so the whole plan is about becoming ${wA.more}.`,
      `There is one gap worth a plan: ${wA.noun}, where you are at the ${ord(A.now)} percentile and aiming for the ${ord(A.target)}.`,
    ]);
  }
  const exp = expected16(A.now, A.dir);
  const reach = A.dir === "up" ? exp >= A.target - 2 : exp <= A.target + 2;
  const s2 = reach
    ? pick(r, [
        `A gap of that size is about what sixteen weeks of completed weekly challenges usually closes, so the ${ord(A.target)} percentile is a realistic aim for ${wA.noun}.`,
        `That is within reach: people who finish challenges like these typically move by about a third of a standard deviation in three to four months, which covers your ${wA.noun} gap.`,
        `For ${wA.noun} that is realistic, because about four months of finished challenges typically moves a trait by a third of a standard deviation, roughly the distance you need.`,
        `Sixteen weeks of completed challenges typically moves a trait by about a third of a standard deviation, which is close to the whole distance for your ${wA.noun}.`,
      ])
    : pick(r, [
        `People who complete weekly challenges typically shift by about a third of a standard deviation in three to four months, which would take your ${wA.noun} to roughly the ${ord(exp)} percentile, so treat the ${ord(A.target)} as a longer-term direction.`,
        `Realistically, sixteen weeks of finished challenges moves a trait by about a third of a standard deviation: for ${wA.noun} that means around the ${ord(exp)} percentile, not the ${ord(A.target)}, and in the trials the gains lasted after coaching stopped.`,
        `Expect ${wA.noun} to reach somewhere near the ${ord(exp)} percentile after about four months of doing the challenges; the ${ord(A.target)} is the direction, not the deadline.`,
        `Four months of completed challenges is worth about a third of a standard deviation, enough to move your ${wA.noun} to around the ${ord(exp)} percentile, so the ${ord(A.target)} will take longer than one plan.`,
        `A third of a standard deviation is the usual gain from sixteen weeks of finished challenges, which puts your ${wA.noun} near the ${ord(exp)} percentile; the ${ord(A.target)} is a direction to keep heading in.`,
      ]);
  // Third sentence: the single most useful extra fact. Context the person gave comes first.
  const c = b.context;
  const s3: string[] = [];
  if (usedFacet) s3.push(`Your standout facet there is ${usedFacet}, so most of the ${wA.noun} weeks practise exactly that.`);
  if (c?.mbti) {
    const weakest = [...c.mbti.letters].sort((x, y) => x.p - y.p)[0];
    const i = c.mbti.letters.indexOf(weakest);
    const pair = ["E/I", "S/N", "T/F", "J/P"][i];
    const f = fs.find((x) => x.t === LETTER_TRAIT[pair]);
    if (f && weakest.p < 0.7)
      s3.push(
        f.dir === FLIP[weakest.letter]
          ? `It could also tip your closest letter call, ${pair}, where ${weakest.letter} is only ${pc(weakest.p)}% likely and is an estimate from your Big Five scores in the first place.`
          : `It would also firm up the ${weakest.letter} in your estimated type, which is currently your closest letter call at ${pc(weakest.p)}%.`,
      );
  }
  if (c?.upbringing) {
    const u = c.upbringing;
    if ((u.adversity ?? 1) >= 3 && fs.some((f) => f.t === "N" && f.dir === "down")) s3.push("A harder childhood is linked to higher neuroticism on average, but it is a nudge and not a sentence, and the same exercises work.");
    else if ((u.warmth ?? 3) <= 2 && fs.some((f) => (f.t === "A" && f.dir === "up") || (f.t === "N" && f.dir === "down"))) s3.push("Growing up in a colder home has only a small average effect on adult traits, so it does not limit how far you can move.");
    else if ((u.harshness ?? 3) >= 4 && fs.some((f) => f.t === "C" || f.t === "N")) s3.push("Strict parenting leaves a small mark on average, far smaller than what you do from here.");
  }
  for (const e of (c?.events ?? []) as LifeEvent[]) for (const f of fs) if (EVENT_LINES[e]?.[`${f.t}:${f.dir}`]) s3.push(EVENT_LINES[e]![`${f.t}:${f.dir}`]!);
  if (c?.selfLabel && (s3.length === 0 || r() < 0.5))
    s3.push(pick(r, [`You describe yourself as ${c.selfLabel}; that is a label we have not measured, so the plan follows your trait scores.`, `The plan is built on your measured traits, not on the ${c.selfLabel} label, which we treat as a description and nothing more.`]));
  if (!s3.length) {
    const p = pc(b.pChange[A.t]);
    if (p <= 30) s3.push(`Left alone, the model gives your ${wA.noun} ${an(p)} ${p}% chance of a meaningful shift by your chosen age, so the practice is doing most of the work.`);
    if (p >= 45) s3.push(`The model already gives your ${wA.noun} ${an(p)} ${p}% chance of a meaningful shift by your chosen age, in either direction, and practice is how you choose which.`);
    if (A.t === "C" && A.dir === "up" && b.age >= 18 && b.age <= 45) s3.push("Age is on your side too: people on average become more conscientious through their twenties and thirties.");
    if (A.t === "N" && A.dir === "down" && b.age <= 45) s3.push("Time helps as well, since most people grow calmer between their twenties and forties.");
    if (A.t === "N" && A.dir === "down") s3.push("Emotional stability is the trait that interventions move most, so this is the gap with the best odds.");
    if (A.now <= 3 || A.now >= 97) s3.push("A score this far out is partly the luck of the day, so a retest may sit a little closer to the middle before any practice begins.");
    if (EVIDENCE[A.t][A.dir] === "thin") s3.push(`Few studies have tried to move ${wA.noun} in this direction, so that figure is an estimate.`);
    if (B) s3.push(`The same pace applies to ${WORDS[B.t][B.dir].noun}.`);
    if (r() < 0.2) return `${s1} ${s2}`;
  }
  if (!s3.length) return `${s1} ${s2}`;
  return `${s1} ${s2} ${pick(r, s3)}`;
}

function watchOut(r: Rnd, fs: Focus[], b: CoachRequest, noGap: boolean): string {
  const [A, B] = fs;
  const c: [number, string][] = [];
  if (b.age < 18) c.push([0.4, "If any of this adds to exam or school pressure, shrink the challenge instead of dropping the plan, and tell an adult you trust if the worry is not shifting."]);
  if (fs.some((f) => f.t === "N" && f.dir === "down") && b.nowPct.N >= 85) c.push([0.7, pick(r, ["This is coaching, not treatment: if worry or low mood is getting in the way of daily life, speak to your GP as well.", "A plan like this is not a substitute for professional help, so if anxiety or low mood is making ordinary days hard, see your GP alongside it."])]);
  if ((b.context?.upbringing?.adversity ?? 1) >= 4) c.push([0.5, "If these exercises stir up difficult memories, pause and talk to your GP or a counsellor, because a plan like this is not built for that."]);
  if (!noGap && EVIDENCE[A.t][A.dir] === "thin") c.push([0.75, pick(r, THIN_WATCHOUT[A.t])]);
  if (B && EVIDENCE[B.t][B.dir] === "thin") c.push([0.45, pick(r, THIN_WATCHOUT[B.t])]);
  if (fs.some((f) => f.t === "E" && f.dir === "up") && b.nowPct.E <= 20) c.push([0.5, "Acting more outgoing lifts mood for most people, but the most introverted also report more tiredness, so keep your recharge time."]);
  if (!noGap && Math.abs(A.g) >= 40) c.push([0.4, "A gap this large is a long-run direction: sixteen weeks typically moves a trait by about a third of a standard deviation, not the whole distance."]);
  for (const [p, s] of shuffle(r, c)) if (r() < p) return s;
  return pick(r, GENERIC_WATCHOUT);
}

function narration(r: Rnd, fs: Focus[], b: CoachRequest, noGap: boolean): string {
  const [A, B] = fs;
  const wA = WORDS[A.t][A.dir];
  const wB = B ? WORDS[B.t][B.dir] : undefined;
  const targetRef = b.targetName && b.targetName !== "custom" ? b.targetName : undefined;
  let open = pick(r, BABY_OPEN[babyKey(b.temperamentType)]);
  if (b.name && r() < 0.6) open = `${b.name}, ${lower(open)}`;
  const honest = pick(r, BABY_HONEST);
  const goal = noGap
    ? pick(r, [`Today you are already close to ${targetRef ?? "the person you are aiming to be"}, so this plan is about keeping it that way.`, `At ${b.age} you are nearly where you want to be, and the job now is to hold it.`])
    : wB
      ? pick(r, [
          `Now, at ${b.age}, you are aiming to be ${wA.more} and ${wB.more}.`,
          `These days the goal is clear: ${wA.more}, and ${wB.more}.`,
          `Where you are heading is ${targetRef ?? "your own target"}: ${wA.more} and ${wB.more} than you are today.`,
          `What you want next is to be ${wA.more} and ${wB.more}, and both can be worked on.`,
        ])
      : pick(r, [`What you want next is to be ${wA.more}, and that can be worked on.`, `Now, at ${b.age}, you are aiming to be ${wA.more}.`, `These days the goal is one clear thing: to be ${wA.more}.`, `Where you are heading is ${targetRef ?? "your own target"}: ${wA.more} than you are today.`]);
  const plan = noGap
    ? "Over eight weeks you will keep a light routine of planning ahead and finishing what you start, one small challenge a week."
    : wB
      ? pick(r, [
          `Over eight weeks you will practise ${wA.doing} and ${wB.doing}, starting small and asking a little more each week.`,
          `The plan is eight weekly challenges built around ${wA.doing} and ${wB.doing}, easy at first and harder by the end.`,
          `For the next eight weeks there is one small challenge a week: ${wA.doing}, and ${wB.doing}.`,
          `Each of the next eight weeks has one challenge, some about ${wA.doing} and some about ${wB.doing}, and they get harder slowly.`,
        ])
      : pick(r, [`Each of the next eight weeks has one challenge about ${wA.doing}, and they get harder slowly.`, `Over eight weeks you will practise ${wA.doing}, starting small and asking a little more each week.`, `The plan is eight weekly challenges built around ${wA.doing}, easy at first and harder by the end.`]);
  const real = noGap ? "Expect steadiness more than change, which is the point when you are already close." : pick(r, NARR_REAL);
  const close = pick(r, NARR_CLOSE);
  let parts = [open, honest, goal, plan, real, close];
  const count = () => words(parts.join(" "));
  if (count() > 108) parts = [open, goal, plan, real, close];
  if (count() > 108) parts = [open, goal, plan, close];
  const extra = shuffle(r, NARR_EXTRA);
  while (count() < 74 && extra.length) parts.splice(parts.length - 1, 0, extra.pop()!);
  return parts.join(" ");
}

/** The stage of life the writer assumes: the one stated in the prompt, otherwise the default for the person's age. */
export function stageFor(b: CoachRequest, defaultStage: StageKey): StageKey {
  return b.context?.stage ? STAGE_OF[b.context.stage] ?? defaultStage : defaultStage;
}

export function writePlan(r: Rnd, b: CoachRequest, defStage: StageKey): { plan: Plan; meta: Record<string, unknown> } {
  const fs = focusOf(b);
  const noGap = TRAITS.every((t) => Math.abs(b.targetPct[t] - b.nowPct[t]) < 10);
  const stage = stageFor(b, defStage);
  const [A, B] = fs;
  const split = B ? (Math.abs(A.g) / Math.max(1, Math.abs(B.g)) >= 1.6 ? [5, 3] : [4, 4]) : [8];
  const wa = pickWeeks(r, A, split[0], b.context, stage);
  const wb = B ? pickWeeks(r, B, split[1], b.context, stage) : [];
  const order = !B ? "AAAAAAAA" : split[0] === 5 ? pick(r, ["ABAABAAB", "AABABABA", "ABABAABA"]) : pick(r, ["ABABABAB", "ABBAABBA", "AABBAABB"]);
  const weeks = [...order].map((k, i) => {
    const w = (k === "A" ? wa : wb).shift()!;
    return { week: i + 1, trait: w.trait, challenge: w.challenge, why: w.why, facet: w.facet, level: w.level };
  });
  const prio = priorityFacets(A, b.context);
  const usedFacet = prio.find((f) => weeks.filter((w) => w.trait === A.t && w.facet === f).length >= 2);
  const it1 = fill(pick(r, IF_THEN[A.t][A.dir]), stage);
  const it2 = B && r() < 0.8 ? fill(pick(r, IF_THEN[B.t][B.dir]), stage) : pick(r, IF_THEN_GENERIC);
  const plan: Plan = {
    headline: headline(r, fs, b, noGap),
    summary: summary(r, fs, b, noGap, usedFacet ? `${A.dir === "up" ? "low" : "high"} ${usedFacet}` : undefined),
    weeks: weeks.map(({ week, trait, challenge, why }) => ({ week, trait, challenge, why })),
    ifThen: [it1, it2],
    watchOut: watchOut(r, fs, b, noGap),
    narration: narration(r, fs, b, noGap),
  };
  return { plan, meta: { focus: fs.map((f) => `${f.t}:${f.dir}`), noGap, stage, split: split.join("/"), facets: weeks.map((w) => w.facet), levels: weeks.map((w) => w.level) } };
}

// ---------- future self ----------
const FUTURE_WORD: Record<Trait, Record<Dir, string[]>> = {
  N: { down: ["less bothered by the things keeping you up now", "calmer than you'd believe", "a good deal less rattled by things", "much harder to wind up"], up: ["a little more alert to what could go wrong, and better prepared for it", "a touch more easily rattled, which I'm told is called caring", "a bit more of a worrier, in a useful way"] },
  C: { up: ["someone who replies to messages on the same day", "more organised (yes, really, there's a calendar and I use it)", "better at finishing things, annoyingly", "the sort of person who is early for trains"], down: ["less ruled by the to-do list", "a bit less of a planner, and happier for it", "more relaxed about lists than you are"] },
  E: { up: ["the one who suggests the plan, at least some of the time", "a bit louder in a room than you are", "quicker to start the conversation", "more at ease with a crowd"], down: ["more selective about where my energy goes", "happier with a quiet night in", "a little quieter, and perfectly content about it"] },
  O: { up: ["reading things you'd currently scroll past", "more curious, with odder hobbies to show for it", "more willing to try the strange thing on the menu"], down: ["clearer about what I like and what I don't", "more settled in my tastes", "a bit more set in my ways, cheerfully so"] },
  A: { up: ["slower to take offence", "softer with people than you are", "a bit more patient with everyone, even in queues"], down: ["more willing to disagree out loud", "better at saying no", "a little more blunt, which saves a surprising amount of time"] },
};
const FUTURE_BABY: Record<string, string[]> = {
  spirited: ["That spirited baby with the big lungs is still in here, just better at choosing the moment.", "The spirited baby you were is still in here, now with slightly better timing."],
  slow: ["That cautious baby who sized everything up first is still in here, and still right more often than not.", "The baby who took a while to warm up is still in here, and still likes to look before leaping."],
  easy: ["That easy, smiley baby is still in here, though mornings remain a negotiation.", "The easy baby you were is still in here, still fairly hard to ruffle."],
  mixed: ["That baby who was a bit of everything still refuses to fit one box, and I've stopped trying.", "The baby who was a bit of everything is still in here, still hard to pin down."],
};
const FUTURE_HEDGE = ["Remember I'm a forecast, and forecasts are wrong about individual people all the time.", "This is the likely version and not the only one, so don't hold me to it.", "None of this is guaranteed, mind: I'm one likely version of you, not the only one.", "I'm only the most likely future, so feel free to prove me wrong.", "Take it with a pinch of salt, since I'm a forecast and not a promise.", "I can't swear to any of it, because I'm one probable you among several."];
const FUTURE_CLOSE = ["That's all from me. Go and have a decent lunch.", "Anyway, be kind to yourself as you are now. I remember that person fondly.", "Go easy on yourself this week.", "Oh, and whatever you're fretting about today? I honestly can't remember it.", "Keep going, and drink some water.", "Anyway, carry on. You're doing better than you think.", "Right, I'll let you get on."];

export function writeFutureSelf(r: Rnd, b: FutureSelfRequest): { text: string } {
  const moves = TRAITS.map((t) => ({ t, d: b.futurePct[t] - b.nowPct[t] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  const big = moves.filter((m) => Math.abs(m.d) >= 4).slice(0, 2);
  const w = (m: { t: Trait; d: number }) => pick(r, FUTURE_WORD[m.t][m.d > 0 ? "up" : "down"]);
  const hello = pick(r, [
    `Hi${b.name ? " " + b.name : ""}, it's you, at ${b.horizon}.`,
    `Hello from ${b.horizon}. Yes, it's me, which is to say you.`,
    `${b.name ? b.name + ", it's" : "It's"} your future self calling. Don't panic.`,
    `Hey${b.name ? " " + b.name : ""}, it's you, from further down the line.`,
    `${b.name ? b.name + ", hello" : "Hello"} from ${b.horizon}. It's you, a bit older and not much wiser.`,
  ]);
  const change = !big.length
    ? pick(r, ["Honest answer: I'm mostly still you. Nothing dramatic shifts, and that's no bad thing.", "The surprising news is how little changes. I'm recognisably you, just with more practice."])
    : big.length === 1
      ? pick(r, [`If things go the likely way, I'm ${w(big[0])}.`, `The odds say I end up ${w(big[0])}, and not much else moves.`])
      : pick(r, [`If things go the likely way, I'm ${w(big[0])}, and ${w(big[1])}.`, `The odds say I end up ${w(big[0])}. Also ${w(big[1])}.`]);
  const cause = b.events.length
    ? pick(r, ["The big changes you're expecting play a part, though a smaller one than you'd guess. It's mostly the small things you repeat.", "Some of it comes from what life throws at you, but more comes from ordinary habits, repeated."])
    : pick(r, ["It happens slowly, through things you do most days without thinking of them as important.", "Most of it comes from small things you repeat, not one big moment.", "There's no single turning point. It's ordinary habits, done often."]);
  const baby = pick(r, FUTURE_BABY[babyKey(b.temperamentType)]);
  const hedge = pick(r, FUTURE_HEDGE);
  const close = pick(r, FUTURE_CLOSE);
  let parts = [hello, change, cause, baby, hedge, close];
  const count = () => words(parts.join(" "));
  if (count() > 88) parts = [hello, change, baby, hedge, close];
  if (count() > 88) parts = [hello, change, baby, hedge];
  if (count() < 62) parts.splice(parts.length - 1, 0, "Be patient with it: change like this is slow, and it mostly goes unnoticed while it happens.");
  return { text: parts.join(" ") };
}

// ---------- explain: forecast ----------
const MATURE: Record<Trait, { up: string; down: string }> = {
  C: { up: "On average people become more conscientious as they move through adulthood, most of all between 20 and 40.", down: "Conscientiousness usually rises with age, so a fall here would be unusual." },
  N: { down: "Most people grow calmer with age, especially through their twenties and thirties.", up: "Neuroticism usually falls with age, so a rise here would be unusual." },
  A: { up: "Agreeableness tends to creep up with age, mostly later in life.", down: "Agreeableness usually rises slightly with age, so a fall here would be unusual." },
  E: { up: "Assertiveness tends to rise in early adulthood, which lifts extraversion a little overall.", down: "Sociability tends to ease off slowly in later decades, which lowers extraversion a little." },
  O: { up: "Openness tends to rise through the late teens and early twenties.", down: "Openness tends to drift down slowly from the thirties onwards." },
};

const EVENT_PHRASE: Record<string, string> = {
  "Long-term relationship": "A first long-term relationship",
  "First full-time job": "Starting a first full-time job",
  University: "Going to university",
  "Living abroad": "Living abroad",
  "Becoming a parent": "Becoming a parent",
};

function driverPlain(label: string, effect: number, t: Trait, nowPct: number): string {
  const T = TRAIT_META[t].name.toLowerCase();
  const dir = effect > 0 ? "up" : "down";
  if (label.startsWith("Natural drift")) return `Scores far from the middle tend to drift back towards it over the years, and yours starts ${nowPct >= 50 ? "above" : "below"} average.`;
  if (label.startsWith("Maturation")) return MATURE[t][dir];
  if (label.startsWith("Therapy")) return `Therapy and coaching have the best-documented effects on personality, and they are largest for emotional stability.`;
  if (label.startsWith("Long unemployment")) return `Long spells out of work are linked to slightly ${dir === "up" ? "higher" : "lower"} ${T} on average, less so if work is found quickly.`;
  const what = EVENT_PHRASE[label] ?? label;
  return `${what} goes with slightly ${dir === "up" ? "higher" : "lower"} ${T} on average, and the size used here is an estimate.`;
}

export function writeForecast(r: Rnd, b: ForecastExplain) {
  const T = TRAIT_META[b.trait].name.toLowerCase();
  const p = pc(b.pChange);
  const up = pc(b.pUp);
  const down = pc(b.pDown);
  const now = Math.round(b.nowPct);
  const exp = Math.round(b.expectedPct);
  const years = b.horizon - b.age;
  const lean = up >= down + 8 ? "up" : down >= up + 8 ? "down" : "even";
  const headline =
    p < 25
      ? pick(r, [`Your ${T} looks likely to stay put`, `Not much movement expected in your ${T}`])
      : p < 50
        ? pick(r, [`A fair chance your ${T} shifts`, lean === "even" ? `Your ${T} could go either way` : `Your ${T} may well drift ${lean}`])
        : pick(r, [`Your ${T} is more likely than not to move`, lean === "even" ? `Expect your ${T} to move, direction unclear` : `Your ${T} will probably head ${lean}`]);
  const s1 = pick(r, [
    `The model gives your ${T} ${an(p)} ${p}% chance of moving by half a standard deviation or more between ${b.age} and ${b.horizon}: ${up}% for a rise and ${down}% for a fall.`,
    `Between ${b.age} and ${b.horizon} there is ${an(p)} ${p}% chance that your ${T} shifts meaningfully, made up of ${an(up)} ${up}% chance it rises and ${an(down)} ${down}% chance it falls.`,
  ]);
  const s2 =
    Math.abs(exp - now) < 3
      ? pick(r, [`Its single best guess is that you stay close to the ${ord(now)} percentile.`, `The most likely single outcome is that you stay near the ${ord(now)} percentile.`])
      : pick(r, [`Its single best guess is that you go from the ${ord(now)} percentile to about the ${ord(exp)}.`, `The most likely single outcome is a move from the ${ord(now)} percentile to around the ${ord(exp)}.`]);
  const ds = [...b.drivers].filter((d) => Math.abs(d.effect) >= 0.005).sort((x, y) => Math.abs(y.effect) - Math.abs(x.effect)).slice(0, 3);
  const top = ds[0];
  const net = ds.reduce((a, d) => a + d.effect, 0);
  const s3 = top && Math.abs(net) > 0.03 && Math.sign(net) !== Math.sign(top.effect)
    ? `The biggest single push is ${top.effect > 0 ? "upwards" : "downwards"}, from ${top.label.startsWith("Natural") ? "the natural drift towards average" : top.label.startsWith("Maturation") ? "ordinary maturation" : lower(top.label)}, but the other factors together outweigh it.`
    : top
    ? `The biggest push ${top.effect > 0 ? "upwards" : "downwards"} comes from ${top.label.startsWith("Natural") ? "the natural drift towards average" : top.label.startsWith("Maturation") ? "ordinary maturation" : lower(top.label)}.`
    : `None of the usual pushes is large for you, so the odds come almost entirely from ordinary unpredictability.`;
  const s4 = pick(r, [
    `The rest is ordinary unpredictability: over ${years} years people's standing on a trait is far from fixed, and the model cannot see what your life will bring.`,
    `Most of the uncertainty is simply time, because over ${years} years people move around more than they expect.`,
    `What is left is chance and everything the model cannot see, which over ${years} years adds up to a lot.`,
  ]);
  const caveat = pick(r, [
    "These are averages across thousands of people, so they describe the odds for someone like you, not your own future.",
    "Life events are partly chosen by personality in the first place, so their effects here are associations, not guarantees.",
    "Half a standard deviation is a convention for a meaningful change, and a stricter test would give lower odds.",
    "The model knows your age, your scores and the events you picked, and nothing else about your life, so treat the figure as a rough guide.",
    "A forecast like this is strongest for groups and weakest for one person, so hold it loosely.",
    "The effects of life events used here are small and some are estimates, so they shift the odds only slightly.",
  ]);
  return {
    headline,
    explanation: `${s1} ${s2} ${s3} ${s4}`,
    drivers: ds.map((d) => ({ label: d.label, effect: d.effect > 0 ? "raises" : "lowers", plain: driverPlain(d.label, d.effect, b.trait, now) })),
    caveat,
  };
}

// ---------- explain: baby ----------
export function writeBaby(r: Rnd, b: BabyExplain) {
  const [t1, t2] = b.types;
  const width = (t: Trait) => Math.round(b.range[t][1]) - Math.round(b.range[t][0]);
  const narrow = [...TRAITS].sort((x, y) => width(x) - width(y))[0];
  const drift = [...TRAITS].sort((x, y) => b.pDrift[y] - b.pDrift[x])[0];
  const far = [...TRAITS].sort((x, y) => Math.abs(b.babyPct[y] - 50) - Math.abs(b.babyPct[x] - 50))[0];
  const name = (t: Trait) => TRAIT_META[t].name.toLowerCase();
  const headline = pick(r, [`Probably ${/^[aeiou]/i.test(t1.type) ? "an" : "a"} ${t1.type.toLowerCase()} baby, but only probably`, "Our best guess at baby you", "A rough sketch of you as a baby", `Most likely ${t1.type.toLowerCase()}, with wide margins`]);
  const from = b.method === "stories" ? `the stories you have been told${b.parentsRated ? " and your ratings of your parents" : ""}` : `who you are now and how you grew up${b.parentsRated ? ", plus your ratings of your parents" : ""}`;
  const how =
    b.method === "stories"
      ? pick(r, [`Personality cannot be measured at birth, so this is an estimate of your early temperament built from ${from}.`, `This is an estimate of your early temperament and not a measurement, because personality cannot be measured at birth; it is built from ${from}.`])
      : pick(r, [`Personality cannot be measured at birth, so this is an estimate of your early temperament worked out backwards from ${from}.`, `This is an estimate of your early temperament and not a measurement, because personality cannot be measured at birth; it is worked out backwards from ${from}.`]);
  const s2 = pick(r, [
    `The likeliest picture is ${/^[aeiou]/i.test(t1.type) ? "an" : "a"} ${t1.type.toLowerCase()} baby at ${pc(t1.p)}%, with ${t2.type.toLowerCase()} next at ${pc(t2.p)}%.`,
    `${cap(t1.type.toLowerCase())} is the single likeliest type at ${pc(t1.p)}%, ahead of ${t2.type.toLowerCase()} at ${pc(t2.p)}%, which leaves plenty of room for the others.`,
  ]);
  const s3 = pick(r, [
    `Trait by trait the ranges are wide: your ${name(far)} as a baby is put at the ${ord(Math.round(b.babyPct[far]))} percentile, but could plausibly have been anywhere from the ${ord(Math.round(b.range[far][0]))} to the ${ord(Math.round(b.range[far][1]))}.`,
    `The range for each trait is broad: for ${name(far)} the best guess is the ${ord(Math.round(b.babyPct[far]))} percentile, with anything from the ${ord(Math.round(b.range[far][0]))} to the ${ord(Math.round(b.range[far][1]))} still plausible.`,
  ]);
  const s4 = pick(r, [
    `The trait most likely to have moved since is ${name(drift)}, with ${an(pc(b.pDrift[drift]))} ${pc(b.pDrift[drift])}% chance that you now sit meaningfully away from where you started.`,
    `Since then, ${name(drift)} is the trait most likely to have shifted: there is ${an(pc(b.pDrift[drift]))} ${pc(b.pDrift[drift])}% chance that you now sit meaningfully away from that starting point.`,
  ]);
  const mostCertain = pick(r, [
    `We can say most about ${name(narrow)}, where the range runs from the ${ord(Math.round(b.range[narrow][0]))} to the ${ord(Math.round(b.range[narrow][1]))} percentile, and even that spans ${width(narrow)} percentile points.`,
    `The narrowest range is for ${name(narrow)}, from the ${ord(Math.round(b.range[narrow][0]))} to the ${ord(Math.round(b.range[narrow][1]))} percentile, which still spans ${width(narrow)} percentile points.`,
  ]);
  const caveat = pick(r, [
    "Infant temperament only weakly predicts adult traits, with correlations of about .1 to .3, so treat this as a sketch and not a record.",
    b.method === "stories" ? "Family stories about babyhood are coloured by who you became, which is one reason the ranges are so wide." : "Working backwards from the adult can only narrow things a little, because most of what shapes a person happens after infancy.",
    "This describes the odds for people with answers like yours, and it cannot recover what you were actually like at six months old.",
    "Nobody measured you as a baby, so every figure here is an inference with wide margins and should be read for fun more than for fact.",
  ]);
  return { headline, explanation: `${how} ${s2} ${s3} ${s4}`, mostCertain, caveat };
}

// ---------- explain: type ----------
const DIM_TRAIT: Record<string, Trait> = { E: "E", I: "E", S: "O", N: "O", T: "A", F: "A", J: "C", P: "C" };
export function writeType(r: Rnd, b: TypeExplain) {
  const sorted = [...b.letters].sort((x, y) => x.p - y.p);
  const weakest = sorted[0];
  const surest = sorted[3];
  const tn = (l: string) => TRAIT_META[DIM_TRAIT[l]].name.toLowerCase();
  const diff = (a: string, c: string) => [...a].filter((ch, i) => ch !== c[i]).length;
  const headline =
    weakest.p < 0.65
      ? pick(r, [`Most likely ${b.type}, with ${weakest.letter} and ${weakest.other} close`, `${b.type}, give or take one letter`, `Probably ${b.type}, but ${weakest.letter}/${weakest.other} is a coin toss`])
      : pick(r, [`A fairly clear ${b.type}`, `${b.type} on the evidence of your traits`, `Most likely ${b.type}`]);
  const direct = b.direct?.length ? b.direct : undefined;
  const s1 = direct
    ? pick(r, [
        `Your likeliest four-letter type is ${b.type}, worked out from your Big Five scores and then adjusted by your answers to the extra either-or questions; you have not taken the MBTI itself.`,
        `${b.type} is the best fit once your Big Five scores are combined with the extra either-or questions you answered, and it remains an estimate, since you did not sit the MBTI.`,
      ])
    : pick(r, [
        `Your likeliest four-letter type is ${b.type}, worked out from your Big Five scores; you have not taken the MBTI itself.`,
        `${b.type} is the best fit for your Big Five scores, which is how this type was estimated, since you did not sit the MBTI.`,
      ]);
  const sp = ord(Math.round(b.nowPct[DIM_TRAIT[surest.letter]]));
  const s2 = pick(r, [
    `The surest letter is ${surest.letter} at ${pc(surest.p)}%, which fits your ${tn(surest.letter)} at the ${sp} percentile.`,
    `${surest.letter} is the letter we are most sure of, at ${pc(surest.p)}%, in line with your ${tn(surest.letter)} at the ${sp} percentile.`,
  ]);
  const [r1, r2] = b.runnersUp;
  const s3 = pick(r, [
    `The next most likely types are ${r1.type} (${pc(r1.p)}%) and ${r2.type} (${pc(r2.p)}%), ${diff(b.type, r1.type) === 1 ? "the first of which differs from yours by a single letter" : "which shows how spread out the odds are"}.`,
    `After ${b.type}, the likeliest are ${r1.type} at ${pc(r1.p)}% and ${r2.type} at ${pc(r2.p)}%, so read the letters as odds and not as a verdict.`,
  ]);
  const s4 = pick(r, [
    `By age ${b.horizon} there is ${an(pc(b.pTypeChanges))} ${pc(b.pTypeChanges)}% chance that your likeliest type is a different one, mostly because anyone near the middle of a scale crosses it easily.`,
    `There is also ${an(pc(b.pTypeChanges))} ${pc(b.pTypeChanges)}% chance that a different type comes out on top by age ${b.horizon}, since a small shift in a trait is enough to cross a midpoint.`,
  ]);
  const dirWord = FLIP[weakest.letter] === "up" ? "rise" : "fall";
  const pairOf: Record<string, string> = { E: "E/I", I: "E/I", S: "S/N", N: "S/N", T: "T/F", F: "T/F", J: "J/P", P: "J/P" };
  const dw = direct?.find((d) => d.pair === pairOf[weakest.letter]);
  const closestCall = dw
    ? `${weakest.letter} against ${weakest.other} is still your closest call at ${pc(weakest.p)}%, even after the extra questions, where your answers ${dw.leans ? `leant towards ${dw.leans}` : "did not lean either way"}, and a ${dirWord} in ${tn(weakest.letter)} would tip it to ${weakest.other}.`
    : weakest.p < 0.75
      ? `${weakest.letter} against ${weakest.other} is your closest call at ${pc(weakest.p)}%, and a modest ${dirWord} in ${tn(weakest.letter)} would tip it to ${weakest.other}.`
      : `Even your least certain letter, ${weakest.letter}, sits at ${pc(weakest.p)}%, so it would take a large ${dirWord} in ${tn(weakest.letter)} to tip it to ${weakest.other}.`;
  const caveat = pick(r, [
    "Four-letter types cut smooth traits into two boxes, so people near the middle often get a different letter on retest: in one UK sample only 47% kept all four letters over a few weeks.",
    "Treat the letters as shorthand for your trait scores, because they add nothing beyond them and leave out neuroticism altogether.",
    "The letters are estimated from published correlations between the MBTI and the Big Five, so they are a probability and not a test result.",
    "A type is a summary of where you fall on four scales today, and people close to a midpoint should expect the letter to change from one sitting to the next.",
  ]);
  return { headline, explanation: `${s1} ${s2} ${s3} ${s4}`, closestCall, caveat };
}

export { FACETS, LIFE_EVENTS };
