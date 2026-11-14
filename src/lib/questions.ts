import type { Trait, Upbringing, LifeEvent } from "./params";

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
};

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
};
