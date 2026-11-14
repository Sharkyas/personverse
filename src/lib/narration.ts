import { TRAIT_META, TRAITS } from "./params";
import type { Report } from "./model";
import { pct } from "./model";

export function narrationScript(r: Report, name: string | undefined, age: number, horizon: number): string {
  const hi = (v: number) => (v >= 60 ? "high" : v <= 40 ? "low" : "middling");
  const most = [...r.future].sort((a, b) => b.pChange - a.pChange)[0];
  const least = [...r.future].sort((a, b) => a.pChange - b.pChange)[0];
  const biggestDrift = TRAITS.map((t) => ({ t, d: pct(r.now[t]) - pct(r.temperament[t]) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  const dir = most.expected > most.now ? "rise" : "fall";
  return [
    `${name ? name + ", " : ""}welcome to your personalityverse.`,
    `As a baby, you looked like a ${r.temperamentType.label.replace(/"/g, "").toLowerCase()} temperament. ${r.temperamentType.blurb}`,
    `Since then, the biggest shift has been in ${TRAIT_META[biggestDrift.t].name.toLowerCase()}: you started ${hi(pct(r.temperament[biggestDrift.t]))} and today you're ${hi(pct(r.now[biggestDrift.t]))}.`,
    `Looking ahead to age ${horizon}, your most changeable trait is ${TRAIT_META[most.trait].name.toLowerCase()}, with a ${Math.round(most.pChange * 100)} percent chance of a meaningful shift, most likely a ${dir}.`,
    `Your most stable is ${TRAIT_META[least.trait].name.toLowerCase()}, at ${Math.round(least.pChange * 100)} percent.`,
    `Remember: about 40 percent of personality differences trace to genes, and most of the rest comes from experiences unique to you. Which means a lot of what comes next is up to you.`,
  ].join(" ");
}
