// Scores the AI coach (local Gemma via the running app) on synthetic profiles, so we can report clear metrics.
// Usage: node scripts/eval_gemma.mjs [baseUrl] [n]
// Default base http://127.0.0.1:3000, n = 20. Writes research/gemma_eval.json and src/lib/gemmaEval.json.
import fs from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:3000";
const N = Number(process.argv[3] || 20);
const TRAITS = ["O", "C", "E", "A", "N"];
const TYPES = ["easy", "slow-to-warm-up", "spirited", "mixed"];

let seed = 20261114;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pctVec = () => Object.fromEntries(TRAITS.map((t) => [t, Math.round(10 + rnd() * 80)]));

function focus(now, target) {
  const g = TRAITS.map((t) => ({ t, g: target[t] - now[t] }))
    .filter((x) => Math.abs(x.g) >= 10)
    .sort((x, y) => Math.abs(y.g) - Math.abs(x.g));
  return (g.length ? g.slice(0, 2) : [{ t: "C", g: 10 }]).map((x) => x.t);
}

const rows = [];
for (let i = 0; i < N; i++) {
  const nowPct = pctVec();
  const targetPct = { ...nowPct };
  // two clear gaps of 15-40 points, random direction
  const [a, b] = [...TRAITS].sort(() => rnd() - 0.5);
  for (const t of [a, b]) targetPct[t] = Math.max(2, Math.min(98, nowPct[t] + (rnd() < 0.5 ? -1 : 1) * Math.round(15 + rnd() * 25)));
  const body = {
    age: 18 + Math.floor(rnd() * 10),
    temperamentType: pick(TYPES),
    nowPct,
    babyPct: pctVec(),
    targetPct,
    targetName: "custom",
    pChange: Object.fromEntries(TRAITS.map((t) => [t, 0.2 + rnd() * 0.5])),
  };
  const want = focus(nowPct, targetPct);
  const t0 = Date.now();
  let plan = null;
  try {
    const r = await fetch(`${BASE}/api/coach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    plan = await r.json();
  } catch (e) {
    plan = { error: String(e) };
  }
  const ms = Date.now() - t0;
  const weeks = Array.isArray(plan?.weeks) ? plan.weeks : [];
  const onFocus = weeks.filter((w) => want.includes(w.trait)).length;
  const text = JSON.stringify(plan ?? {});
  rows.push({
    ai: plan?.source === "ai",
    model: plan?.model ?? null,
    ms,
    weeks: weeks.length,
    onFocusShare: weeks.length ? onFocus / weeks.length : 0,
    coversBoth: want.every((t) => weeks.some((w) => w.trait === t)),
    ifThenOk: Array.isArray(plan?.ifThen) && plan.ifThen.length >= 2 && plan.ifThen.every((s) => /^if\b/i.test(s) && /\bthen\b/i.test(s)),
    narrationWords: typeof plan?.narration === "string" ? plan.narration.split(/\s+/).length : 0,
    emDashes: (text.match(/—/g) || []).length,
  });
  process.stdout.write(`${i + 1}/${N} ${rows.at(-1).ai ? "ai" : "fallback"} ${ms}ms focus ${Math.round(rows.at(-1).onFocusShare * 100)}%\n`);
}

const ai = rows.filter((r) => r.ai);
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const q = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
};
const out = {
  when: new Date().toISOString(),
  model: ai[0]?.model ?? null,
  n: rows.length,
  validJson: ai.length / rows.length,
  onFocus: mean(ai.map((r) => r.onFocusShare)),
  coversBoth: mean(ai.map((r) => (r.coversBoth ? 1 : 0))),
  eightWeeks: mean(ai.map((r) => (r.weeks === 8 ? 1 : 0))),
  ifThenFormat: mean(ai.map((r) => (r.ifThenOk ? 1 : 0))),
  narrationInRange: mean(ai.map((r) => (r.narrationWords >= 60 && r.narrationWords <= 130 ? 1 : 0))),
  noEmDash: mean(ai.map((r) => (r.emDashes === 0 ? 1 : 0))),
  latencyP50: q(rows.map((r) => r.ms), 0.5),
  latencyP90: q(rows.map((r) => r.ms), 0.9),
  note: "Synthetic profiles with two clear 15-40 point gaps. 'onFocus' = share of weekly challenges that target those two traits. Fallbacks (library plan) count as invalid AI output.",
};
fs.mkdirSync("research", { recursive: true });
fs.writeFileSync("research/gemma_eval.json", JSON.stringify({ ...out, rows }, null, 1));
fs.writeFileSync("src/lib/gemmaEval.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
