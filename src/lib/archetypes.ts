import type { Vec } from "./model";

// Target personalities users can aim for (percentiles vs peers). Illustrative, not clinical types.
export const ARCHETYPES: { id: string; name: string; emoji: string; tagline: string; target: Vec }[] = [
  { id: "strategist", name: "The Steady Strategist", emoji: "♟️", tagline: "Calm under pressure, plans three moves ahead.", target: { O: 65, C: 85, E: 50, A: 50, N: 15 } },
  { id: "spark", name: "The Spark", emoji: "⚡", tagline: "Lights up a room and starts things.", target: { O: 80, C: 50, E: 90, A: 65, N: 35 } },
  { id: "quant", name: "The Quant", emoji: "📈", tagline: "Curious, rigorous, unflappable with numbers on the line.", target: { O: 85, C: 85, E: 40, A: 40, N: 20 } },
  { id: "diplomat", name: "The Diplomat", emoji: "🤝", tagline: "Warm, trusted, the person everyone confides in.", target: { O: 65, C: 65, E: 60, A: 90, N: 30 } },
  { id: "founder", name: "The Founder", emoji: "🚀", tagline: "Bold, driven, comfortable with risk.", target: { O: 85, C: 75, E: 80, A: 35, N: 25 } },
  { id: "creator", name: "The Creator", emoji: "🎨", tagline: "Imaginative, expressive, follows curiosity.", target: { O: 95, C: 45, E: 60, A: 60, N: 50 } },
];
