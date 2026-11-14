/*
 * SYNTHETIC training data for fine-tuning the Gemma coach (distillation).
 *
 * 1. Makes realistic random users by running the app's own model on random questionnaire answers.
 * 2. Builds the exact coach prompt the app serves (src/lib/coachPrompt.ts).
 * 3. Asks a larger local "teacher" Gemma (default gemma4:26b via Ollama) for the plan.
 * 4. Keeps only answers that pass every quality check (8 weeks, all on the right traits, if-then format, length, no em dash).
 *
 * The output is synthetic and is only used to teach format and focus. It is never used as evidence or for the
 * prediction-accuracy metrics. Resumable: re-running appends until --n examples have passed.
 *
 * Run: node scripts/run-ts.cjs scripts/make_coach_data.ts --n 800 --teacher gemma4:26b
 * Writes data/coach/{train,valid}.jsonl (90/10) and data/coach/all.jsonl.
 */
import fs from "node:fs";
import path from "node:path";
import { buildReport, toPct } from "@/lib/model";
import { sanitizeAnswers, TEMPERAMENT_ITEMS, IPIP_ITEMS, TIPI_ITEMS, FUTURE_EVENTS } from "@/lib/questions";
import { ARCHETYPES } from "@/lib/archetypes";
import { TRAITS, type Trait } from "@/lib/params";
import { focusGaps, type CoachRequest } from "@/lib/coachLibrary";
import { buildCoachPrompt, checkPlan, JSON_SUFFIX } from "@/lib/coachPrompt";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const N = Number(arg("n", "800"));
const TEACHER = arg("teacher", "gemma4:26b");
const OLLAMA = arg("ollama", "http://127.0.0.1:11434");
const OUT = arg("out", "data/coach");
const SEED = Number(arg("seed", "7"));

let seed = SEED;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const NAMES = ["Sam", "Aisha", "Tom", "Priya", "Jack", "Mei", "Omar", "Chloe", "Leo", "Zara", "Ben", "Hana", "Kofi", "Ella", "Ravi", "Maya", "Dan", "Sofia", "Yusuf", "Isla"];

function randomUser(): CoachRequest {
  // A person who leans one way: draw a latent profile, then answer with noise.
  const lean = Object.fromEntries(TRAITS.map((t) => [t, (rnd() + rnd() + rnd() - 1.5) * 1.2])) as Record<Trait, number>;
  const ans = (t: Trait, rev: boolean, k: number) => {
    const v = 3 + (rev ? -1 : 1) * lean[t] + (rnd() - 0.5) * 2;
    return Math.max(1, Math.min(k, Math.round(k === 7 ? 4 + (v - 3) * 1.5 : v)));
  };
  const a = sanitizeAnswers({
    temperament: Object.fromEntries(TEMPERAMENT_ITEMS.map((i) => [i.id, int(1, 5)])),
    upbringing: { warmth: int(1, 5), harshness: int(1, 5), adversity: int(1, 5), ses: int(1, 5), moves: int(1, 5), birthOrder: int(1, 5) },
    tipi: TIPI_ITEMS.map((it) => ans(it.trait, it.reverse, 7)),
    age: int(16, 45),
    horizon: 0,
    events: FUTURE_EVENTS.filter(() => rnd() < 0.3),
    babyKnown: rnd() < 0.3,
    inventory: "detailed",
    ipip: IPIP_ITEMS.map((it) => ans(it.trait, it.reverse, 5)),
  });
  a.horizon = Math.min(80, a.age + int(3, 20));
  const r = buildReport(a);
  const nowPct = toPct(r.now);
  let targetPct: Record<Trait, number>;
  let targetName: string | undefined;
  if (rnd() < 0.55) {
    const ar = pick(ARCHETYPES);
    targetPct = { ...ar.target };
    targetName = ar.name;
  } else {
    targetPct = { ...nowPct };
    const k = int(1, 3);
    for (const t of [...TRAITS].sort(() => rnd() - 0.5).slice(0, k)) targetPct[t] = Math.max(3, Math.min(97, nowPct[t] + (rnd() < 0.5 ? -1 : 1) * int(12, 40)));
  }
  const pChange = Object.fromEntries(r.future.map((f) => [f.trait, f.pChange])) as Record<Trait, number>;
  return {
    name: rnd() < 0.5 ? pick(NAMES) : undefined,
    age: a.age,
    temperamentType: r.temperamentType.label.replace(/ \(.*\)$/, ""),
    nowPct,
    babyPct: toPct(r.temperament),
    targetPct,
    targetName,
    pChange,
  };
}

async function teacher(prompt: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No format:"json" (Ollama's MLX runner rejects it for Gemma 4 with a 501) and no thinking (3x slower, same answer).
      body: JSON.stringify({ model: TEACHER, messages: [{ role: "user", content: prompt }], stream: false, think: false, options: { temperature: 0.8 } }),
      signal: AbortSignal.timeout(180_000),
    });
    const j = (await res.json()) as { message?: { content?: string } };
    const txt = j.message?.content ?? "";
    return JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const all = path.join(OUT, "all.jsonl");
  const have = fs.existsSync(all) ? fs.readFileSync(all, "utf8").split("\n").filter(Boolean).length : 0;
  seed = SEED + have * 7919; // resume with fresh profiles
  let kept = have;
  let tried = 0;
  const t0 = Date.now();
  if (process.argv.includes("--dry")) {
    for (let i = 0; i < 3; i++) {
      const b = randomUser();
      console.log(JSON.stringify({ focus: focusGaps(b), now: b.nowPct, target: b.targetPct, type: b.temperamentType, age: b.age }));
    }
    console.log("---\n" + buildCoachPrompt(randomUser()));
    return;
  }
  let fails = 0;
  while (kept < N) {
    const b = randomUser();
    const prompt = buildCoachPrompt(b) + JSON_SUFFIX;
    const plan = await teacher(prompt);
    tried++;
    if (!plan) {
      if (++fails >= 5) throw new Error(`teacher ${TEACHER} at ${OLLAMA} is not answering`);
      continue;
    }
    fails = 0;
    const focus = focusGaps(b).map((f) => f.t);
    const q = checkPlan(plan, b, focus);
    if (!q.pass) {
      process.stdout.write(`rejected (${Object.entries(q.checks).filter(([, v]) => !v).map(([k]) => k).join(",")})\n`);
      continue;
    }
    fs.appendFileSync(all, JSON.stringify({ messages: [{ role: "user", content: prompt }, { role: "assistant", content: JSON.stringify(plan) }] }) + "\n");
    kept++;
    const rate = (Date.now() - t0) / 1000 / Math.max(1, kept - have);
    process.stdout.write(`kept ${kept}/${N} (tried ${tried}, ~${rate.toFixed(0)} s each)\n`);
  }
  // 90/10 split, deterministic
  const lines = fs.readFileSync(all, "utf8").split("\n").filter(Boolean);
  const train: string[] = [];
  const valid: string[] = [];
  lines.forEach((l, i) => (i % 10 === 9 ? valid : train).push(l));
  fs.writeFileSync(path.join(OUT, "train.jsonl"), train.join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, "valid.jsonl"), valid.join("\n") + "\n");
  console.log(`done: ${train.length} train, ${valid.length} valid, acceptance ${(100 * (kept - have) / Math.max(1, tried)).toFixed(0)}%`);
}
main();
