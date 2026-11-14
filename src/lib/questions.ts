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
export const UPBRINGING_ITEMS: { id: Upbringing; text: string; low: string; high: string }[] = [
  { id: "warmth", text: "How warm and emotionally supportive was home growing up?", low: "Cold / distant", high: "Very warm" },
  { id: "harshness", text: "How strict or harsh was discipline?", low: "Very relaxed", high: "Very harsh" },
  { id: "adversity", text: "How many difficult experiences did you face as a child (loss, conflict at home, instability)?", low: "None", high: "A lot" },
  { id: "ses", text: "Compared with others, how comfortable were your family's finances?", low: "Struggling", high: "Very comfortable" },
  { id: "moves", text: "How often did you move home or change school?", low: "Never", high: "Constantly" },
  { id: "birthOrder", text: "Where are you in your siblings?", low: "Oldest / only", high: "Youngest" },
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
};

export type ParentRating = { traits: Partial<Record<Trait, number | null>>; sure: number };
export type ParentRatings = ParentRating[];

export const PARENT_ITEMS: { trait: Trait; text: string }[] = [
  { trait: "E", text: "Confident and outgoing" },
  { trait: "N", text: "Anxious or easily stressed" },
  { trait: "C", text: "Organised and reliable" },
  { trait: "A", text: "Warm and easy to get on with" },
  { trait: "O", text: "Curious, creative, into new ideas" },
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
