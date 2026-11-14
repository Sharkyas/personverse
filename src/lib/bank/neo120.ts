// The 120-statement facet test (IPIP-NEO-120, public domain): 30 facets, four statements each, scored against Johnson's
// published norms. It gives the detail the 50-statement test cannot, for example which side of Openness (ideas or art)
// or of Conscientiousness (order or drive) a person's score comes from.
import data from "./ipipNeo120.json";
import { IPIP_ITEMS } from "../questions";
import { TRAITS, type Trait } from "../params";
import type { Vec } from "../model";

export type NeoItem = { id: string; n: number; text: string; trait: Trait; facet: string; reverse: boolean; hint?: string; sameAs?: string };
type Norm = { mean: number; sd: number };
type NormSet = { domains: Record<Trait, Norm>; facets: Record<string, Norm> };

export const NEO_ITEMS = data.items as NeoItem[];
export const NEO_FACETS = data.facets as Record<string, { trait: Trait; name: string }>;
export const NEO_RELIABILITY = data.reliability;
const ADULT = data.norms.adult as NormSet;
const GROUPS = data.norms.groups as (NormSet & { sex: string; ageFrom: number; ageTo: number })[];

/** Statements needed before a facet (of 4) or a domain (of 24) is scored. */
export const NEO_MIN = { facet: 3, domain: 16 };

export type NeoAnswers = Record<string, number | null | undefined>;
export type NeoScore = {
  domains: Record<Trait, { mean: number | null; z: number | null; answered: number }>;
  facets: Record<string, { name: string; trait: Trait; mean: number | null; z: number | null; answered: number }>;
  /** domain z-scores for the traits with enough answers, in the shape the rest of the app uses */
  z: Partial<Vec>;
  /** reliability to pass to `modelFor` for the traits in `z` */
  rel: Partial<Vec>;
  normGroup: string;
};

/** Norms for a sex and age band when both are given, otherwise the pooled adult norms (the app's default: one adult yardstick for everyone). */
export function neoNorms(sex?: "M" | "F", age?: number): { norms: NormSet; label: string } {
  const g = sex && age != null ? GROUPS.find((x) => x.sex === sex && age >= x.ageFrom && age <= x.ageTo) : undefined;
  return g ? { norms: g, label: `${sex === "M" ? "men" : "women"} ${g.ageFrom || "under 21"}${g.ageFrom ? (g.ageTo > 100 ? "+" : `–${g.ageTo}`) : ""}` } : { norms: ADULT, label: "adults" };
}

export function scoreNeo120(a: NeoAnswers, opts: { sex?: "M" | "F"; age?: number } = {}): NeoScore {
  const { norms, label } = neoNorms(opts.sex, opts.age);
  const keyedBy = (pred: (it: NeoItem) => boolean) =>
    NEO_ITEMS.filter(pred)
      .map((it) => ({ it, v: a[it.id] }))
      .filter((x): x is { it: NeoItem; v: number } => typeof x.v === "number" && x.v >= 1 && x.v <= 5)
      .map(({ it, v }) => (it.reverse ? 6 - v : v));
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const facets: NeoScore["facets"] = {};
  for (const [key, f] of Object.entries(NEO_FACETS)) {
    const v = keyedBy((it) => it.facet === key);
    const m = v.length >= NEO_MIN.facet ? mean(v) : null;
    facets[key] = { name: f.name, trait: f.trait, mean: m, z: m == null ? null : (m - norms.facets[key].mean) / norms.facets[key].sd, answered: v.length };
  }
  const domains = {} as NeoScore["domains"];
  const z: Partial<Vec> = {};
  const rel: Partial<Vec> = {};
  for (const t of TRAITS) {
    const v = keyedBy((it) => it.trait === t);
    const m = v.length >= NEO_MIN.domain ? mean(v) : null;
    domains[t] = { mean: m, z: m == null ? null : (m - norms.domains[t].mean) / norms.domains[t].sd, answered: v.length };
    if (m != null) {
      z[t] = domains[t].z!;
      // Spearman–Brown: fewer statements answered, lower reliability.
      const k = v.length / 24;
      rel[t] = (k * NEO_RELIABILITY.domain) / (1 + (k - 1) * NEO_RELIABILITY.domain);
    }
  }
  return { domains, facets, z, rel, normGroup: label };
}

/** Fourteen statements are word-for-word in both tests. Copy those answers across so nobody is asked the same thing twice. */
export function prefillFromIpip50(ipip: (number | undefined)[]): NeoAnswers {
  const idx = new Map(IPIP_ITEMS.map((it, i) => [it.id, i]));
  const out: NeoAnswers = {};
  for (const it of NEO_ITEMS) {
    if (!it.sameAs) continue;
    const v = ipip[idx.get(it.sameAs)!];
    if (typeof v === "number" && v >= 1 && v <= 5) out[it.id] = v;
  }
  return out;
}

/** The statements still to ask, in the published order (facets interleaved), leaving out any already answered. */
export const neoRemaining = (a: NeoAnswers) => NEO_ITEMS.filter((it) => !(typeof a[it.id] === "number" && (a[it.id] as number) >= 1));

/** The two facets furthest above and below the person's own domain score: the "what makes yours different" detail for each trait. */
export function facetHighlights(score: NeoScore): Record<Trait, { high: string | null; low: string | null }> {
  return Object.fromEntries(
    TRAITS.map((t) => {
      const fs = Object.entries(score.facets).filter(([, f]) => f.trait === t && f.z != null);
      const dz = score.domains[t].z;
      if (fs.length < 2 || dz == null) return [t, { high: null, low: null }];
      const sorted = fs.sort((x, y) => y[1].z! - x[1].z!);
      const top = sorted[0];
      const bottom = sorted[sorted.length - 1];
      return [t, { high: top[1].z! - dz >= 0.5 ? top[1].name : null, low: dz - bottom[1].z! >= 0.5 ? bottom[1].name : null }];
    }),
  ) as Record<Trait, { high: string | null; low: string | null }>;
}
