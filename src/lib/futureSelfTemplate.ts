import { TRAITS, TRAIT_META, type Trait } from "./params";

// Offline "voice note from future you": used by the server without AI, and by the browser if the network drops.
export type FutureSelfRequest = {
  name?: string;
  age: number;
  horizon: number;
  temperamentType: string;
  nowPct: Record<Trait, number>;
  futurePct: Record<Trait, number>;
  events: string[];
};

function babyLine(type: string) {
  if (type.startsWith("Spirited")) return "That spirited, loud little baby";
  if (type.startsWith("Easy")) return "That easy, smiley baby";
  if (type.startsWith("Slow")) return "That cautious baby who took a while to warm up";
  return "That baby who was a bit of everything";
}

export function futureSelfTemplate(b: FutureSelfRequest) {
  const moves = TRAITS.map((t) => ({ t, d: b.futurePct[t] - b.nowPct[t] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  const [m1, m2] = moves;
  const word = (t: Trait, d: number) =>
    t === "N" ? (d < 0 ? "calmer than you'd believe" : "a bit more sensitive") : d > 0 ? `more ${TRAIT_META[t].high.split(",")[0]}` : `less ${TRAIT_META[t].high.split(",")[0]}`;
  return `Hey${b.name ? " " + b.name : ""}, it's you, at ${b.horizon}. I won't spoil everything, but I'm ${word(m1.t, m1.d)}, and ${word(m2.t, m2.d)}. ${babyLine(b.temperamentType)} is still in here somewhere. Most of what changed came from small things you did over and over, not one big moment. So keep going. Oh, and the stuff you're worrying about this week? I genuinely can't remember it.`;
}

