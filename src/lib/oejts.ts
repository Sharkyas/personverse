/*
 * Direct type questions: the Open Extended Jungian Type Scales 1.2 (Eric Jorgenson, Open Psychometrics, 2015).
 * Items licensed CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/); used unchanged apart from
 * spelling and small wording fixes. 32 bipolar items, 8 per letter pair, each answered 1-5 between two descriptions.
 *
 * Scoring follows the published key: each item leans toward one letter, and the midpoint (all 3s) is the cut. We
 * only ask the items for letters the Big Five leaves uncertain, so a partial set is scored the same way.
 */
import type { Dim } from "./mbti";

export type OejtsItem = { id: string; left: string; right: string; dim: Dim; /** +1: answering 5 leans to the dim's second letter (I, N, F, P) */ sign: 1 | -1 };

// Signs come from the published key (IE = 30 - Q3 - Q7 - Q11 + Q15 - Q19 + Q23 + Q27 - Q31, more than 24 = E; etc.),
// flipped where our second letter is the key's first (we use E/I, S/N, T/F, J/P with I, N, F, P second).
export const OEJTS_ITEMS: OejtsItem[] = [
  { id: "Q1", left: "Makes lists", right: "Relies on memory", dim: "JP", sign: 1 },
  { id: "Q2", left: "Sceptical", right: "Wants to believe", dim: "TF", sign: 1 },
  { id: "Q3", left: "Bored by time alone", right: "Needs time alone", dim: "EI", sign: 1 },
  { id: "Q4", left: "Accepts things as they are", right: "Unsatisfied with the way things are", dim: "SN", sign: 1 },
  { id: "Q5", left: "Keeps a clean room", right: "Just puts stuff wherever", dim: "JP", sign: 1 },
  { id: "Q6", left: "Thinks \"robotic\" is an insult", right: "Strives to have a mechanical mind", dim: "TF", sign: -1 },
  { id: "Q7", left: "Energetic", right: "Mellow", dim: "EI", sign: 1 },
  { id: "Q8", left: "Prefers multiple-choice tests", right: "Prefers essay answers", dim: "SN", sign: 1 },
  { id: "Q9", left: "Chaotic", right: "Organised", dim: "JP", sign: -1 },
  { id: "Q10", left: "Easily hurt", right: "Thick-skinned", dim: "TF", sign: -1 },
  { id: "Q11", left: "Works best in groups", right: "Works best alone", dim: "EI", sign: 1 },
  { id: "Q12", left: "Focused on the present", right: "Focused on the future", dim: "SN", sign: 1 },
  { id: "Q13", left: "Plans far ahead", right: "Plans at the last minute", dim: "JP", sign: 1 },
  { id: "Q14", left: "Wants people's respect", right: "Wants their love", dim: "TF", sign: 1 },
  { id: "Q15", left: "Gets worn out by parties", right: "Gets fired up by parties", dim: "EI", sign: -1 },
  { id: "Q16", left: "Fits in", right: "Stands out", dim: "SN", sign: 1 },
  { id: "Q17", left: "Keeps options open", right: "Commits", dim: "JP", sign: -1 },
  { id: "Q18", left: "Wants to be good at fixing things", right: "Wants to be good at fixing people", dim: "TF", sign: 1 },
  { id: "Q19", left: "Talks more", right: "Listens more", dim: "EI", sign: 1 },
  { id: "Q20", left: "Tells people what happened", right: "Tells people what it meant", dim: "SN", sign: 1 },
  { id: "Q21", left: "Gets work done right away", right: "Procrastinates", dim: "JP", sign: 1 },
  { id: "Q22", left: "Follows the heart", right: "Follows the head", dim: "TF", sign: -1 },
  { id: "Q23", left: "Stays at home", right: "Goes out on the town", dim: "EI", sign: -1 },
  { id: "Q24", left: "Wants the big picture", right: "Wants the details", dim: "SN", sign: -1 },
  { id: "Q25", left: "Improvises", right: "Prepares", dim: "JP", sign: -1 },
  { id: "Q26", left: "Bases morality on justice", right: "Bases morality on compassion", dim: "TF", sign: 1 },
  { id: "Q27", left: "Finds it hard to yell very loudly", right: "Yelling to someone far away comes naturally", dim: "EI", sign: -1 },
  { id: "Q28", left: "Theoretical", right: "Empirical", dim: "SN", sign: -1 },
  { id: "Q29", left: "Works hard", right: "Plays hard", dim: "JP", sign: 1 },
  { id: "Q30", left: "Uncomfortable with emotions", right: "Values emotions", dim: "TF", sign: 1 },
  { id: "Q31", left: "Likes performing in front of people", right: "Avoids public speaking", dim: "EI", sign: 1 },
  { id: "Q32", left: "Likes to know who, what and when", right: "Likes to know why", dim: "SN", sign: 1 },
];

export const OEJTS_CREDIT =
  "Direct type questions: Open Extended Jungian Type Scales 1.2 by Eric Jorgenson (openpsychometrics.org), CC BY-NC-SA 4.0.";

export type Oejts = Record<string, number>;

/** Lean toward the dim's second letter from whatever items were answered: sum of signed (answer - 3), and how many. */
export function directLean(ans: Oejts | undefined, dim: Dim): { n: number; lean: number } {
  let n = 0;
  let lean = 0;
  for (const it of OEJTS_ITEMS) {
    const v = ans?.[it.id];
    if (it.dim !== dim || !v || v < 1 || v > 5) continue;
    n++;
    lean += it.sign * (v - 3);
  }
  return { n, lean };
}

/**
 * How much the direct answers count, in log-odds per unit of lean / sqrt(n). No response data for these items is public
 * yet, so this weight is set by hand rather than fitted: a steady moderate lean on all 8 items (every answer one step
 * off the middle) counts as about 9-to-1 evidence, and a full lean (every answer at the end) as about 80-to-1.
 */
export const DIRECT_WEIGHT = 0.78;

/**
 * Per letter pair. Big Five answers predict T/F and J/P well, but E/I and S/N less so: S/N rests almost entirely on
 * Openness, and the 50-statement norms come from a very open online sample. So for E/I and S/N the direct answers count
 * for more (a steady moderate lean on all 8 items is about 30-to-1 evidence) and are always asked.
 */
export const DIRECT_WEIGHT_BY_DIM: Record<Dim, number> = { EI: 1.2, SN: 1.2, TF: DIRECT_WEIGHT, JP: DIRECT_WEIGHT };

/** Clamp untrusted input: only known item ids, whole numbers 1-5. */
export function sanitizeOejts(raw: unknown): Oejts | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: Oejts = {};
  for (const it of OEJTS_ITEMS) {
    const n = Number(o[it.id]);
    if (Number.isFinite(n) && n >= 1 && n <= 5) out[it.id] = Math.round(n);
  }
  return Object.keys(out).length ? out : undefined;
}
