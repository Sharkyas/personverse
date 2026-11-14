import type { Vec } from "./model";
import { TRAITS } from "./params";
import data from "./celebs.json";

export type Celeb = { name: string; field: string; typing_label: string; note: string } & Vec;
export const CELEBS: Celeb[] = data as Celeb[];

export function nearestCelebs(p: Vec, k = 3): (Celeb & { match: number })[] {
  return CELEBS.map((c) => {
    const d = Math.sqrt(TRAITS.reduce((s, t) => s + (c[t] - p[t]) ** 2, 0));
    // max distance ≈ 223 (100*sqrt5); map to a friendly 0–100 match
    return { ...c, match: Math.round(100 - (d / 223) * 100) };
  })
    .sort((a, b) => b.match - a.match)
    .slice(0, k);
}
