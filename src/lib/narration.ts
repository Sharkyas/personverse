import { TRAITS, type Trait } from "./params";
import type { Report } from "./model";
import { pct } from "./model";

/** How each trait is said out loud: plain words, no psychology jargon. */
const SPOKEN: Record<Trait, string> = {
  O: "how open you are to new things",
  C: "how organised you are",
  E: "how outgoing you are",
  A: "how warm you are with people",
  N: "how strongly you feel stress",
};

/** The short read-aloud version of the results: warm, plain and about 40 seconds long. */
export function narrationScript(r: Report, name: string | undefined, age: number, horizon: number): string {
  const most = [...r.future].sort((a, b) => b.pChange - a.pChange)[0];
  const least = [...r.future].sort((a, b) => a.pChange - b.pChange)[0];
  const biggestDrift = TRAITS.map((t) => ({ t, d: pct(r.now[t]) - pct(r.temperament[t]) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  const dir = most.expected > most.now ? "upwards" : "downwards";
  const baby = r.temperamentType.label.replace(/ \(.*\)/, "").replace(/"/g, "").toLowerCase();
  return [
    `${name ? "Hi " + name + ". " : ""}Here's your personalityverse.`,
    r.reverse
      ? `Working back from today, your baby temperament was probably ${baby}, though that's an estimate. ${r.temperamentType.blurb}`
      : `As a baby, your temperament was ${baby}. ${r.temperamentType.blurb}`,
    `Since then, ${SPOKEN[biggestDrift.t]} has ${biggestDrift.d > 0 ? "risen" : "fallen"} the most.`,
    `Looking ahead to ${horizon}, the part of you most likely to change is ${SPOKEN[most.trait]}. The odds of a real shift are about ${Math.round(most.pChange * 100)} percent, most likely ${dir}.`,
    `Your steadiest part is ${SPOKEN[least.trait]}, with odds of about ${Math.round(least.pChange * 100)} percent.`,
    `Genes explain about 40 percent of personality differences. Most of the rest comes from your own experiences, so plenty of what comes next is up to you.`,
  ].join(" ");
}
