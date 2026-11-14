import { TRAITS, type Trait, type Upbringing, type LifeEvent } from "./params";

// Early-temperament items, written for this app and modelled on the dimensions
// of Rothbart's IBQ-R/CBQ (surgency, negative affectivity, effortful control)
// and Thomas & Chess's nine temperament dimensions. Answered 1–5 about age 0–5.
export type TempItem = {
  id: string;
  text: string;
  dimension: string;
  loadings: Partial<Record<Trait, number>>;
};

export const TEMPERAMENT_ITEMS: TempItem[] = [
  { id: "activity", text: "As a baby I was very active: kicking, wriggling, always on the move.", dimension: "Activity level", loadings: { E: 0.5, C: -0.15 } },
  { id: "approach", text: "I went happily to strangers and new places rather than hiding behind a parent.", dimension: "Approach / withdrawal", loadings: { E: 0.6, N: -0.25, O: 0.2 } },
  { id: "smiley", text: "I smiled and laughed a lot and was easy to delight.", dimension: "Positive affect", loadings: { E: 0.5, A: 0.25, N: -0.15 } },
  { id: "fussy", text: "I cried a lot and was hard to soothe once upset.", dimension: "Distress / soothability", loadings: { N: 0.6, A: -0.15 } },
  { id: "fearful", text: "Loud noises, new toys or new people easily frightened me.", dimension: "Fear / behavioural inhibition", loadings: { N: 0.5, E: -0.35 } },
  { id: "adaptable", text: "I adjusted quickly when routines changed (new food, new carer, holidays).", dimension: "Adaptability", loadings: { N: -0.35, A: 0.25, O: 0.2 } },
  { id: "intense", text: "My reactions were big and loud, whether I was happy or angry.", dimension: "Intensity of reaction", loadings: { N: 0.3, E: 0.25, A: -0.25 } },
  { id: "attention", text: "I could focus on one toy or book for a long time.", dimension: "Attention span / persistence", loadings: { C: 0.55, O: 0.15 } },
  { id: "regular", text: "My sleeping and eating were regular and predictable.", dimension: "Rhythmicity", loadings: { C: 0.4, N: -0.15 } },
  { id: "waiting", text: "As a toddler I could wait my turn and stop when told.", dimension: "Inhibitory control", loadings: { C: 0.55, A: 0.2 } },
  { id: "curious", text: "I noticed small details and explored everything I could reach.", dimension: "Perceptual sensitivity / curiosity", loadings: { O: 0.6, E: 0.1 } },
  { id: "sharing", text: "I was gentle with other children and shared fairly easily.", dimension: "Affiliation", loadings: { A: 0.6 } },
];

export const CONFIDENCE_OPTIONS = [
  { value: 0.6, label: "Parents told me in detail" },
  { value: 1.0, label: "I've heard some stories" },
  { value: 1.4, label: "Mostly guessing" },
];

// Upbringing questions (1–5 scale, 3 = typical).
export const UPBRINGING_ITEMS: { id: Upbringing; text: string; low: string; high: string; stops: string[] }[] = [
  { id: "warmth", text: "Growing up, how warm and supportive was home?", low: "Cold / distant", high: "Very warm", stops: ["Cold, distant", "A bit cold", "About average", "Warm", "Very warm"] },
  { id: "harshness", text: "How strict were the rules and punishments?", low: "Very relaxed", high: "Very harsh", stops: ["Very relaxed", "Fairly relaxed", "About average", "Strict", "Very strict"] },
  { id: "adversity", text: "How many hard things happened when you were a child? (For example a loss, fighting at home, or a lot of upheaval.)", low: "None", high: "A lot", stops: ["None", "One or two", "Some", "Quite a lot", "A lot"] },
  { id: "ses", text: "Compared with other families, how was money at home?", low: "Struggling", high: "Very comfortable", stops: ["Struggling", "Tight", "About average", "Comfortable", "Very comfortable"] },
  { id: "moves", text: "How often did you move house or change school?", low: "Never", high: "Constantly", stops: ["Never", "Once", "A few times", "Often", "All the time"] },
  { id: "birthOrder", text: "Where do you come among your brothers and sisters?", low: "Oldest / only", high: "Youngest", stops: ["Only child or oldest", "Older side", "Middle", "Younger side", "Youngest"] },
];

// Ten-Item Personality Inventory (Gosling, Rentfrow & Swann, 2003), 1–7 scale.
export const TIPI_ITEMS: { text: string; trait: Trait; reverse: boolean }[] = [
  { text: "Extraverted, enthusiastic", trait: "E", reverse: false },
  { text: "Critical, quarrelsome", trait: "A", reverse: true },
  { text: "Dependable, self-disciplined", trait: "C", reverse: false },
  { text: "Anxious, easily upset", trait: "N", reverse: false },
  { text: "Open to new experiences, complex", trait: "O", reverse: false },
  { text: "Reserved, quiet", trait: "E", reverse: true },
  { text: "Sympathetic, warm", trait: "A", reverse: false },
  { text: "Disorganised, careless", trait: "C", reverse: true },
  { text: "Calm, emotionally stable", trait: "N", reverse: true },
  { text: "Conventional, uncreative", trait: "O", reverse: true },
];

// 50-item IPIP Big-Five Factor Markers (Goldberg, 1992; public domain), in the original interleaved order, 1–5 scale.
// Scored against norms fitted on ~11,000 adults in the open openpsychometrics.org dataset (scripts/fit_ipip.py).
export const IPIP_ITEMS: { id: string; text: string; trait: Trait; reverse: boolean }[] = [
  { id: "E1", text: "I am the life of the party.", trait: "E", reverse: false },
  { id: "N1", text: "I get stressed out easily.", trait: "N", reverse: false },
  { id: "A1", text: "I feel little concern for others.", trait: "A", reverse: true },
  { id: "C1", text: "I am always prepared.", trait: "C", reverse: false },
  { id: "O1", text: "I have a rich vocabulary.", trait: "O", reverse: false },
  { id: "E2", text: "I don't talk a lot.", trait: "E", reverse: true },
  { id: "N2", text: "I am relaxed most of the time.", trait: "N", reverse: true },
  { id: "A2", text: "I am interested in people.", trait: "A", reverse: false },
  { id: "C2", text: "I leave my belongings around.", trait: "C", reverse: true },
  { id: "O2", text: "I have difficulty understanding abstract ideas.", trait: "O", reverse: true },
  { id: "E3", text: "I feel comfortable around people.", trait: "E", reverse: false },
  { id: "N3", text: "I worry about things.", trait: "N", reverse: false },
  { id: "A3", text: "I insult people.", trait: "A", reverse: true },
  { id: "C3", text: "I pay attention to details.", trait: "C", reverse: false },
  { id: "O3", text: "I have a vivid imagination.", trait: "O", reverse: false },
  { id: "E4", text: "I keep in the background.", trait: "E", reverse: true },
  { id: "N4", text: "I seldom feel blue.", trait: "N", reverse: true },
  { id: "A4", text: "I sympathise with others' feelings.", trait: "A", reverse: false },
  { id: "C4", text: "I make a mess of things.", trait: "C", reverse: true },
  { id: "O4", text: "I am not interested in abstract ideas.", trait: "O", reverse: true },
  { id: "E5", text: "I start conversations.", trait: "E", reverse: false },
  { id: "N5", text: "I am easily disturbed.", trait: "N", reverse: false },
  { id: "A5", text: "I am not interested in other people's problems.", trait: "A", reverse: true },
  { id: "C5", text: "I get chores done right away.", trait: "C", reverse: false },
  { id: "O5", text: "I have excellent ideas.", trait: "O", reverse: false },
  { id: "E6", text: "I have little to say.", trait: "E", reverse: true },
  { id: "N6", text: "I get upset easily.", trait: "N", reverse: false },
  { id: "A6", text: "I have a soft heart.", trait: "A", reverse: false },
  { id: "C6", text: "I often forget to put things back in their proper place.", trait: "C", reverse: true },
  { id: "O6", text: "I do not have a good imagination.", trait: "O", reverse: true },
  { id: "E7", text: "I talk to a lot of different people at parties.", trait: "E", reverse: false },
  { id: "N7", text: "I change my mood a lot.", trait: "N", reverse: false },
  { id: "A7", text: "I am not really interested in others.", trait: "A", reverse: true },
  { id: "C7", text: "I like order.", trait: "C", reverse: false },
  { id: "O7", text: "I am quick to understand things.", trait: "O", reverse: false },
  { id: "E8", text: "I don't like to draw attention to myself.", trait: "E", reverse: true },
  { id: "N8", text: "I have frequent mood swings.", trait: "N", reverse: false },
  { id: "A8", text: "I take time out for others.", trait: "A", reverse: false },
  { id: "C8", text: "I shirk my duties.", trait: "C", reverse: true },
  { id: "O8", text: "I use difficult words.", trait: "O", reverse: false },
  { id: "E9", text: "I don't mind being the centre of attention.", trait: "E", reverse: false },
  { id: "N9", text: "I get irritated easily.", trait: "N", reverse: false },
  { id: "A9", text: "I feel others' emotions.", trait: "A", reverse: false },
  { id: "C9", text: "I follow a schedule.", trait: "C", reverse: false },
  { id: "O9", text: "I spend time reflecting on things.", trait: "O", reverse: false },
  { id: "E10", text: "I am quiet around strangers.", trait: "E", reverse: true },
  { id: "N10", text: "I often feel blue.", trait: "N", reverse: false },
  { id: "A10", text: "I make people feel at ease.", trait: "A", reverse: false },
  { id: "C10", text: "I am exacting in my work.", trait: "C", reverse: false },
  { id: "O10", text: "I am full of ideas.", trait: "O", reverse: false },
];
/** Plain-English help shown under the harder statements. The statements themselves keep their tested wording. */
export const IPIP_HINTS: Record<string, string> = {
  E1: "You liven up a gathering.",
  E4: "In groups you stay out of the spotlight.",
  E9: "Being watched by a room doesn't bother you.",
  N2: "Calm and not on edge, most days.",
  N4: "Seldom means rarely. Blue means sad or down.",
  N5: "Small things unsettle you or throw you off.",
  N10: "Blue means sad or down.",
  A1: "Other people's problems don't worry you much.",
  A3: "You say hurtful or rude things to people.",
  A4: "You feel for people when they're upset.",
  A5: "You'd rather not hear about other people's troubles.",
  A10: "People relax around you.",
  C5: "You don't put off small jobs.",
  C8: "Shirk means dodge what you're supposed to do.",
  C10: "You hold your work to high, precise standards.",
  O1: "You know and use a lot of words.",
  O2: "Abstract means ideas rather than things, like theories or philosophy.",
  O4: "Abstract means ideas rather than things, like theories or philosophy.",
  O8: "Long or unusual words.",
  O9: "You often stop and think things over.",
};
export const IPIP_SCALE = ["Not me at all", "Not really me", "In between", "Mostly me", "Very much me"];
export type Inventory = "quick" | "detailed";
/** Detailed answers count for a trait once at least this many of its 10 items are answered. */
export const IPIP_MIN_PER_TRAIT = 6;

export const FUTURE_EVENTS: LifeEvent[] = [
  "university",
  "job",
  "relationship",
  "abroad",
  "parenthood",
  "unemployment",
  "therapy",
  "practice",
];

export type Answers = {
  temperament: Record<string, number>; // 1–5
  confidence: number;
  upbringing: Record<Upbringing, number>; // 1–5
  tipi: number[]; // 10 x 1–7
  age: number;
  horizon: number; // forecast target age
  events: LifeEvent[];
  name?: string;
  /** false = the user skipped the baby questions, so baby you is worked out backwards. Missing = answered (older profiles). */
  babyKnown?: boolean;
  /** Ratings of up to two parents or carers, 1–5 per trait (null = not sure), and how sure the user is (1 very, 2 fairly, 3 guessing). */
  parents?: ParentRatings;
  /** "detailed" = the user also took the 50-item IPIP; its answers (1–5, 0 = skipped) are in IPIP_ITEMS order. */
  inventory?: Inventory;
  ipip?: number[];
};

export type ParentRating = { traits: Partial<Record<Trait, number | null>>; sure: number };
export type ParentRatings = ParentRating[];

export const PARENT_ITEMS: { trait: Trait; text: string }[] = [
  { trait: "E", text: "Outgoing, loves company" },
  { trait: "N", text: "Worries a lot, gets stressed easily" },
  { trait: "C", text: "Organised, does what they say" },
  { trait: "A", text: "Kind, easy to get on with" },
  { trait: "O", text: "Curious, creative, likes new ideas" },
];
export const SURE_OPTIONS = [
  { value: 1, label: "I know them well" },
  { value: 2, label: "Fairly sure" },
  { value: 3, label: "Mostly guessing" },
];

export const DEFAULT_ANSWERS: Answers = {
  temperament: Object.fromEntries(TEMPERAMENT_ITEMS.map((i) => [i.id, 3])),
  confidence: 1.0,
  upbringing: { warmth: 3, harshness: 3, adversity: 1, ses: 3, moves: 2, birthOrder: 1 },
  tipi: Array(10).fill(4),
  age: 20,
  horizon: 35,
  events: ["university", "job"],
};

// A believable profile for live demos: a shy, fussy-but-curious baby who grew into a sociable, slightly anxious student.
export const DEMO_ANSWERS: Answers = {
  temperament: { activity: 3, approach: 2, smiley: 4, fussy: 4, fearful: 4, adaptable: 2, intense: 4, attention: 4, regular: 2, waiting: 3, curious: 5, sharing: 3 },
  confidence: 1.0,
  upbringing: { warmth: 4, harshness: 3, adversity: 2, ses: 3, moves: 3, birthOrder: 1 },
  tipi: [5, 3, 5, 4, 6, 4, 6, 3, 4, 2],
  age: 20,
  horizon: 35,
  events: ["university", "job", "abroad"],
  parents: [
    { traits: { E: 4, N: 4, C: 3, A: 4, O: 4 }, sure: 1 },
    { traits: { E: 2, N: 3, C: 4, A: 3, O: null }, sure: 2 },
  ],
};

/** Untrusted free text that ends up in a prompt: letters, digits and light punctuation only, capped. */
export function cleanText(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/\s+/g, " ").replace(/[^\p{L}\p{M}\p{N}' ,.()&-]/gu, "").replace(/ +/g, " ").trim().slice(0, max);
  return s || undefined;
}

/** Turn untrusted JSON (a POST body or a stored document) into valid Answers: unknown keys dropped, values clamped, gaps filled from the defaults. */
export function sanitizeAnswers(raw: unknown): Answers {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, lo: number, hi: number, d: number) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
  };
  const rec = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
  const t = rec(o.temperament);
  const u = rec(o.upbringing);
  const tipi = Array.isArray(o.tipi) ? o.tipi : [];
  const age = num(o.age, 16, 70, DEFAULT_ANSWERS.age);
  const conf = CONFIDENCE_OPTIONS.find((c) => c.value === Number(o.confidence))?.value ?? DEFAULT_ANSWERS.confidence;
  const events = Array.isArray(o.events) ? [...new Set(o.events.filter((e): e is LifeEvent => FUTURE_EVENTS.includes(e as LifeEvent)))] : [];
  const name = typeof o.name === "string" ? o.name.replace(/[^\p{L}\p{M}' -]/gu, "").trim().slice(0, 30) : "";
  return {
    temperament: Object.fromEntries(TEMPERAMENT_ITEMS.map((i) => [i.id, num(t[i.id], 1, 5, DEFAULT_ANSWERS.temperament[i.id])])),
    confidence: conf,
    upbringing: Object.fromEntries(UPBRINGING_ITEMS.map((i) => [i.id, num(u[i.id], 1, 5, DEFAULT_ANSWERS.upbringing[i.id])])) as Answers["upbringing"],
    tipi: DEFAULT_ANSWERS.tipi.map((d, i) => num(tipi[i], 1, 7, d)),
    age,
    horizon: num(o.horizon, age + 1, 80, Math.max(age + 1, DEFAULT_ANSWERS.horizon)),
    events,
    ...(name ? { name } : {}),
    ...(o.babyKnown === false ? { babyKnown: false } : {}),
    ...(Array.isArray(o.parents) ? { parents: o.parents.slice(0, 2).map(cleanParent) } : {}),
    ...(o.inventory === "detailed" && Array.isArray(o.ipip)
      ? { inventory: "detailed" as const, ipip: IPIP_ITEMS.map((_, i) => num((o.ipip as unknown[])[i], 0, 5, 0)) }
      : {}),
  };
}

function cleanParent(p: unknown): ParentRating {
  const o = (p && typeof p === "object" ? p : {}) as { traits?: Record<string, unknown>; sure?: unknown };
  const tr = o.traits && typeof o.traits === "object" ? o.traits : {};
  const traits: ParentRating["traits"] = {};
  for (const t of TRAITS) {
    const v = Number(tr[t]);
    traits[t] = tr[t] != null && Number.isFinite(v) ? Math.min(5, Math.max(1, Math.round(v))) : null;
  }
  const sure = Number(o.sure);
  return { traits, sure: [1, 2, 3].includes(sure) ? sure : 2 };
}

export const EMPTY_PARENTS: ParentRatings = [
  { traits: {}, sure: 2 },
  { traits: {}, sure: 2 },
];
