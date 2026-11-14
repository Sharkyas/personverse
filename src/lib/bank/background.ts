// Scoring for the longer upbringing and parent questions. Both return the shapes the model already takes
// (Answers.upbringing and ParentRating), so the forecast and the working-backwards code need no changes.
import up from "./upbringingItems.json";
import par from "./parentItems.json";
import { TRAITS, type Trait, type Upbringing } from "../params";
import type { ParentRating } from "../questions";

export type UpbringingItem = { id: string; scale: string; type: "agree" | "yesno" | "choice"; reverse?: boolean; sensitive?: boolean; text: string; stops?: string[] };
export type UpbringingScale = { label: string; composite: Upbringing | null; inModel: boolean; scoring?: string };
export const UPBRINGING_BANK = up.items as UpbringingItem[];
export const UPBRINGING_SCALES = up.scales as Record<string, UpbringingScale>;
export const UPBRINGING_ANSWERS = up.answers;
export const UPBRINGING_INTRO = up.intro;
export const BIRTH_ORDER_ITEM = up.birthOrder;

/** Answers by item id. Agree and choice items: 1–5. Yes/no items: 1 = yes, 0 = no. null or missing = skipped or "prefer not to say". */
export type BackgroundAnswers = Record<string, number | null | undefined>;

export type ScaleScore = { label: string; score: number | null; answered: number; of: number; inModel: boolean };
export type UpbringingScore = {
  scales: Record<string, ScaleScore>;
  /** whole numbers 1–5 for the scales the model uses; spread onto Answers.upbringing. Scales with too few answers are left out so the default stands. */
  upbringing: Partial<Record<Upbringing, number>>;
  /** the same on a continuous 1–5 scale, for display */
  fine: Partial<Record<Upbringing, number>>;
  adversityCount: number | null;
};

const clamp5 = (x: number) => Math.min(5, Math.max(1, x));

export function scoreUpbringing(a: BackgroundAnswers): UpbringingScore {
  const scales: Record<string, ScaleScore> = {};
  const upbringing: UpbringingScore["upbringing"] = {};
  const fine: UpbringingScore["fine"] = {};
  let adversityCount: number | null = null;
  for (const [key, sc] of Object.entries(UPBRINGING_SCALES)) {
    const items = UPBRINGING_BANK.filter((it) => it.scale === key);
    let score: number | null = null;
    let answered = 0;
    if (sc.scoring === "count") {
      const vals = items.map((it) => a[it.id]).filter((v): v is number => v === 0 || v === 1);
      answered = vals.length;
      if (answered >= Math.ceil(items.length / 2)) {
        adversityCount = vals.reduce((s, v) => s + v, 0);
        score = up.adversityBands.map[Math.min(adversityCount, up.adversityBands.map.length - 1)];
      }
    } else {
      const vals = items
        .map((it) => ({ it, v: a[it.id] }))
        .filter((x): x is { it: UpbringingItem; v: number } => typeof x.v === "number" && x.v >= 1 && x.v <= 5)
        .map(({ it, v }) => (it.reverse ? 6 - v : v));
      answered = vals.length;
      if (answered >= Math.ceil(items.length / 2)) score = vals.reduce((s, v) => s + v, 0) / answered;
    }
    scales[key] = { label: sc.label, score, answered, of: items.length, inModel: sc.inModel };
    if (sc.composite && score != null) {
      fine[sc.composite] = clamp5(score);
      upbringing[sc.composite] = Math.round(clamp5(score));
    }
  }
  const b = a[BIRTH_ORDER_ITEM.id];
  if (typeof b === "number" && b >= 1 && b <= 5) upbringing.birthOrder = fine.birthOrder = Math.round(b);
  return { scales, upbringing, fine, adversityCount };
}

// ---------- parents and carers ----------
export type ParentItem = { id: string; trait: Trait; reverse: boolean; text: string };
export const PARENT_BANK = par.items as ParentItem[];
export const PARENT_SCALE = par.scale;
export const PARENT_KNOW = par.know;
export const PARENT_INTRO = par.intro;

export type ParentScore = {
  /** drop-in replacement for one entry of Answers.parents */
  rating: ParentRating;
  /** continuous 1–5 per trait before rounding, and how many of the three statements were answered */
  fine: Partial<Record<Trait, number>>;
  answered: Record<Trait, number>;
};

/**
 * Three statements per trait instead of one adjective. `know` is the answer to PARENT_KNOW (1 lived with them, 2 saw them
 * often, 3 rarely). A trait with no answers stays null ("not sure"). If most statements were skipped the rating is treated
 * as a guess whatever `know` says.
 */
export function scoreParent(a: BackgroundAnswers, know: number = 2): ParentScore {
  const traits: ParentRating["traits"] = {};
  const fine: ParentScore["fine"] = {};
  const answered = { O: 0, C: 0, E: 0, A: 0, N: 0 } as Record<Trait, number>;
  let total = 0;
  for (const t of TRAITS) {
    const vals = PARENT_BANK.filter((it) => it.trait === t)
      .map((it) => ({ it, v: a[it.id] }))
      .filter((x): x is { it: ParentItem; v: number } => typeof x.v === "number" && x.v >= 1 && x.v <= 5)
      .map(({ it, v }) => (it.reverse ? 6 - v : v));
    answered[t] = vals.length;
    total += vals.length;
    if (!vals.length) {
      traits[t] = null;
      continue;
    }
    fine[t] = vals.reduce((s, v) => s + v, 0) / vals.length;
    traits[t] = Math.round(fine[t]!);
  }
  const sure = total < 6 ? 3 : [1, 2, 3].includes(know) ? know : 2;
  return { rating: { traits, sure }, fine, answered };
}
