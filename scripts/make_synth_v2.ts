/*
 * SYNTHETIC training data, version 2, for LoRA fine-tuning the Gemma coach and explainer.
 *
 * Unlike v1 (scripts/make_coach_data.ts), nothing here is produced by a teacher model. Each example is:
 *   1. a synthetic person, made by running random questionnaire answers through the app's own model, steered to
 *      cover all 16 four-letter types (clear and borderline), all 243 low/mid/high Big Five patterns, six age bands
 *      and eleven upbringing scenarios (scripts/synth/profiles.ts);
 *   2. the exact prompt the app serves (src/lib/coachPrompt.ts, futureSelfTemplate.ts, explainPrompt.ts);
 *   3. an ideal answer composed from a hand-written, research-checked library (scripts/synth/content.ts, qa.ts),
 *      with every number recomputed from the prompt by the validators (scripts/synth/validate.ts).
 *
 * The output is synthetic. It teaches format, focus, tone and honest use of the effect sizes. It is not evidence
 * about people and must never be used in, or mixed into, the prediction-accuracy evaluation (research/ipip_metrics.json).
 *
 * Run: node scripts/run-ts.cjs scripts/make_synth_v2.ts [--n 9000] [--seed 20261114] [--out data/synthetic-v2]
 * Deterministic: the same seed and n give byte-identical files.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pct } from "@/lib/model";
import { TRAITS, type Trait } from "@/lib/params";
import { ARCHETYPES } from "@/lib/archetypes";
import { type CoachRequest, type CoachContext } from "@/lib/coachLibrary";
import { buildCoachPrompt, JSON_SUFFIX } from "@/lib/coachPrompt";
import { FACETS, SELF_LABELS } from "@/lib/coachContext";
import { buildFutureSelfPrompt, type FutureSelfRequest } from "@/lib/futureSelfTemplate";
import { buildExplainPrompt, type ExplainRequest } from "@/lib/explainPrompt";
import { mbtiJourney } from "@/lib/mbti";
import { LIB } from "./synth/content";
import { makeProfile, rng, pick, int, shuffle, MBTI_ALL, UPBRINGING_SCENARIOS, type Profile, type Rnd, type Steer } from "./synth/profiles";
import { writePlan, writeFutureSelf, writeForecast, writeBaby, writeType, focusOf, STAGE_LABEL } from "./synth/writers";
import { QAS as QAS1 } from "./synth/qa";
import { QAS2 } from "./synth/qa2";
import { qualityOf } from "./synth/quality";
import { validateExample, validateDir, approxTokens, type Task } from "./synth/validate";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const N = Number(arg("n", "9000"));
const SEED = Number(arg("seed", "20261114"));
const OUT = arg("out", "data/synthetic-v2");
const VERSION = "2.1.0";
const QAS = [...QAS1, ...QAS2];

/** Share of each task. The coach plan is what the app serves most, so it gets most of the data. */
const MIX: [Task, number][] = [
  ["coach", 0.56],
  ["question", 0.2],
  ["forecast", 0.07],
  ["type", 0.06],
  ["baby", 0.05],
  ["future", 0.06],
];

/** Least-served question that applies to this person, by weight: answers that use the person's own scores come up three times as often as fixed ones, and the safety and hard cases carry their own higher weights (qa.ts, qa2.ts). */
const qaServed: Record<string, number> = {};
function nextQuestion(p: Profile) {
  const load = (q: (typeof QAS)[number]) => (qaServed[q.id] ?? 0) / (q.weight ?? (q.a.length > 0 ? 3 : 1));
  const qa = QAS.filter((q) => !q.when || q.when(p)).sort((x, y) => load(x) - load(y) || QAS.indexOf(x) - QAS.indexOf(y))[0];
  qaServed[qa.id] = (qaServed[qa.id] ?? 0) + 1;
  return qa;
}
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * How people really type: no capitals, no apostrophes, text-speak and the odd misspelling. The answer is written for
 * the clean question and stays clean; only the question in the prompt is roughened, so the model learns to read it.
 */
const TYPOS: [RegExp, string][] = [
  [/\byou\b/g, "u"],
  [/\byour\b/g, "ur"],
  [/\bare\b/g, "r"],
  [/\bbecause\b/g, "cos"],
  [/\bpersonality\b/g, "personalty"],
  [/\breally\b/g, "rly"],
  [/\bpeople\b/g, "ppl"],
  [/\bplease\b/g, "pls"],
  [/\bsomething\b/g, "smth"],
  [/\bwhat\b/g, "wat"],
  [/\babout\b/g, "abt"],
  [/\bprobably\b/g, "prob"],
  [/\bthough\b/g, "tho"],
  [/\bto be honest\b/g, "tbh"],
  [/\bdifferent\b/g, "diffrent"],
  [/\bactually\b/g, "actualy"],
];
function messy(q: string, r: Rnd): string {
  let s = q.toLowerCase().replace(/[\u2019']/g, "");
  const end = r();
  s = s.replace(/[?.!]+$/, end < 0.5 ? "" : end < 0.75 ? "??" : "?");
  for (const [re, to] of TYPOS) if (r() < 0.4) s = s.replace(re, to);
  if (r() < 0.25) s = s.replace(/, /g, " ");
  return s;
}
const TYPE_PCT: Record<string, [Trait, number]> = { E: ["E", 75], I: ["E", 25], N: ["O", 85], S: ["O", 35], F: ["A", 72], T: ["A", 30], J: ["C", 72], P: ["C", 30] };

function chooseTarget(r: Rnd, p: Profile): { targetPct: Record<Trait, number>; targetName?: string; mode: string } {
  const x = r();
  const now = p.nowPct;
  if (x < 0.36) {
    const a = pick(r, ARCHETYPES);
    return { targetPct: { ...a.target }, targetName: a.name, mode: "archetype" };
  }
  if (x < 0.66) {
    const t = { ...now };
    for (const k of shuffle(r, TRAITS).slice(0, int(r, 2, 3))) {
      const up = k === "N" ? r() < 0.2 : r() < 0.62;
      t[k] = clamp(now[k] + (up ? 1 : -1) * int(r, 12, 45), 3, 97);
    }
    return { targetPct: t, mode: "custom" };
  }
  if (x < 0.76) {
    // "I want to be more like an ENTJ": move the trait behind each letter that differs.
    const flips = shuffle(r, [0, 1, 2, 3]).slice(0, int(r, 1, 2));
    const pairs = ["EI", "SN", "TF", "JP"];
    const target = [...p.mbti].map((ch, i) => (flips.includes(i) ? pairs[i].replace(ch, "") : ch)).join("");
    const t = { ...now };
    for (const i of flips) {
      const [trait, v] = TYPE_PCT[target[i]];
      t[trait] = v;
    }
    return { targetPct: t, targetName: target, mode: "type" };
  }
  if (x < 0.82) {
    const t = { ...now };
    for (const k of TRAITS) t[k] = clamp(now[k] + int(r, -8, 8), 1, 99);
    return { targetPct: t, mode: "no-gap" };
  }
  if (x < 0.87) {
    // Hard case: the far end of the scale on two traits, a gap no single plan can close.
    const t = { ...now };
    // Nobody asks to be as anxious as possible, so neuroticism only ever goes to the calm end here.
    const pool = shuffle(r, TRAITS).filter((k) => k !== "N" || now.N >= 40);
    for (const k of pool.slice(0, 2)) t[k] = k === "N" || now[k] >= 50 ? int(r, 3, 12) : int(r, 88, 97);
    return { targetPct: t, mode: "far" };
  }
  if (x < 0.91) {
    // Hard case: every trait is well off target, so the plan has to choose two and say so.
    const t = { ...now };
    for (const k of TRAITS) {
      const up = k === "N" ? r() < 0.15 : r() < 0.7;
      const v = now[k] + (up ? 1 : -1) * int(r, 15, 40);
      t[k] = v < 3 || v > 97 ? clamp(now[k] - (up ? 1 : -1) * int(r, 15, 40), 3, 97) : v;
    }
    return { targetPct: t, mode: "all-five" };
  }
  const t = { ...now };
  const k = pick(r, TRAITS);
  const up = k === "N" ? r() < 0.2 : r() < 0.6;
  t[k] = clamp(now[k] + (up ? 1 : -1) * int(r, 15, 45), 3, 97);
  return { targetPct: t, mode: "single" };
}

function chooseContext(r: Rnd, p: Profile, b: CoachRequest): CoachContext | undefined {
  if (r() < 0.35) return undefined; // exactly the prompt the app serves today
  const c: CoachContext = {};
  const fs = focusOf(b);
  if (r() < 0.45) c.mbti = { type: p.mbti, letters: p.letters.map((l) => ({ letter: l.letter, p: Math.max(0.5, l.p) })) };
  if (r() < 0.45) {
    const u = p.answers.upbringing;
    c.upbringing = { warmth: u.warmth, harshness: u.harshness, adversity: u.adversity, ses: u.ses, moves: u.moves };
  }
  if (r() < 0.45) {
    const out: NonNullable<CoachContext["facets"]> = [];
    if (r() < 0.7) {
      // a facet that is on the side the person wants to move away from, so the plan can aim at it
      const f = fs[0];
      const have = [...new Set(LIB[f.t][f.dir].map((x) => x[1]))];
      out.push({ trait: f.t, name: pick(r, have), level: f.dir === "up" ? "low" : "high" });
    }
    for (let i = int(r, 0, 2); i > 0; i--) {
      const t = pick(r, TRAITS);
      const name = pick(r, FACETS[t]);
      if (out.some((x) => x.name === name)) continue;
      out.push({ trait: t, name, level: r() * 100 < p.nowPct[t] ? "high" : "low" });
    }
    if (out.length) c.facets = out;
  }
  if (r() < 0.2) {
    const mine = `16Personalities ${p.mbti}-${p.nowPct.N >= 50 ? "T" : "A"}`;
    c.selfLabel = r() < 0.25 ? mine : pick(r, SELF_LABELS);
  }
  if (r() < 0.5) c.stage = STAGE_LABEL[p.stage];
  const ev = p.answers.events.filter((e) => e !== "practice");
  if (ev.length && r() < 0.4) c.events = ev;
  return Object.keys(c).length ? c : undefined;
}

type Example = { id: string; task: Task; prompt: string; response: string; meta: Record<string, unknown> };

function build(task: Task, p: Profile, r: Rnd): Example {
  const base = { id: p.id, task, synthetic: true, ...p.tags, steer: p.steer, ...(TRAITS.some((t) => p.nowPct[t] <= 3 || p.nowPct[t] >= 97) ? { extreme: true } : {}) };
  if (task === "coach") {
    const tgt = chooseTarget(r, p);
    const b: CoachRequest = { name: p.name, age: p.age, temperamentType: p.temperamentType, nowPct: p.nowPct, babyPct: p.babyPct, targetPct: tgt.targetPct, targetName: tgt.targetName, pChange: p.pChange };
    b.context = chooseContext(r, p, b);
    const { plan, meta } = writePlan(r, b, p.defaultStage);
    return { id: p.id, task, prompt: buildCoachPrompt(b) + JSON_SUFFIX, response: JSON.stringify(plan), meta: { ...base, targetMode: tgt.mode, context: Object.keys(b.context ?? {}), ...meta } };
  }
  if (task === "future") {
    const b: FutureSelfRequest = {
      name: p.name,
      age: p.age,
      horizon: p.horizon,
      temperamentType: p.temperamentType,
      nowPct: p.nowPct,
      futurePct: Object.fromEntries(p.report.future.map((f) => [f.trait, pct(f.expected)])) as Record<Trait, number>,
      events: p.answers.events,
    };
    return { id: p.id, task, prompt: buildFutureSelfPrompt(b) + JSON_SUFFIX, response: JSON.stringify(writeFutureSelf(r, b)), meta: base };
  }
  let req: ExplainRequest;
  let out: unknown;
  let extra: Record<string, unknown> = {};
  if (task === "forecast") {
    const f = pick(r, p.report.future);
    req = {
      kind: "forecast",
      name: p.name,
      age: p.age,
      horizon: p.horizon,
      trait: f.trait,
      nowPct: pct(f.now),
      expectedPct: pct(f.expected),
      pChange: f.pChange,
      pUp: f.pUp,
      pDown: f.pDown,
      drivers: f.drivers.filter((d) => Math.abs(d.effect) >= 0.005).map((d) => ({ label: d.label, effect: Number(d.effect.toFixed(2)) })).filter((d) => d.effect !== 0),
    };
    out = writeForecast(r, req);
    extra = { trait: f.trait };
  } else if (task === "baby") {
    const bc = p.report.backcast;
    const types = (Object.entries(bc.types) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, pr]) => ({ type, p: pr }));
    req = {
      kind: "baby",
      name: p.name,
      age: p.age,
      method: p.report.reverse ? "backwards" : "stories",
      recall: ({ "0.6": "told in detail", "1": "some stories", "1.4": "mostly guessing" } as const)[String(p.answers.confidence) as "0.6" | "1" | "1.4"],
      parentsRated: bc.parentsUsed,
      babyPct: Object.fromEntries(TRAITS.map((t) => [t, pct(bc.traits[t].mean)])) as Record<Trait, number>,
      range: Object.fromEntries(TRAITS.map((t) => [t, [pct(bc.traits[t].lo), pct(bc.traits[t].hi)]])) as Record<Trait, [number, number]>,
      nowPct: p.nowPct,
      types,
      pDrift: Object.fromEntries(TRAITS.map((t) => [t, bc.traits[t].pDrift])) as Record<Trait, number>,
    };
    out = writeBaby(r, req);
  } else if (task === "type") {
    const j = mbtiJourney(p.report, 1500);
    req = {
      kind: "type",
      name: p.name,
      age: p.age,
      horizon: p.horizon,
      type: p.mbti,
      letters: p.letters.map((l) => ({ letter: l.letter, other: l.letter === l.first ? l.second : l.first, p: l.p })),
      runnersUp: p.types.slice(1, 3),
      pTypeChanges: j.pTypeChanges,
      nowPct: p.nowPct,
      ...(p.direct ? { direct: p.direct } : {}),
    };
    out = writeType(r, req);
  } else {
    // Rotate through the questions so each one is covered, skipping those that do not apply to this person.
    const qa = nextQuestion(p);
    const question = qa.q(p, r);
    const context = qa.ctx?.(p, r, question);
    out = { answer: qa.a(p, r, question).replace(/\s+/g, " ").trim(), evidence: qa.evidence, nextStep: qa.next(p, r) };
    const rough = r() < 0.22;
    req = { kind: "question", name: p.name, age: p.age, question: rough ? messy(question, r) : question, nowPct: p.nowPct, context };
    extra = { qa: qa.id, topic: qa.topic, ...(qa.edge ? { edge: qa.edge } : {}), ...(rough ? { messy: true } : {}) };
  }
  return { id: p.id, task, prompt: buildExplainPrompt(req) + JSON_SUFFIX, response: JSON.stringify(out), meta: { ...base, ...extra } };
}

function tally<T>(xs: T[], key: (x: T) => string | string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) for (const k of [key(x)].flat()) out[k] = (out[k] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}

function main() {
  const t0 = Date.now();
  const r = rng(SEED);
  // Task schedule: fixed shares, shuffled.
  const tasks: Task[] = shuffle(r, MIX.flatMap(([t, share]) => Array<Task>(Math.round(N * share)).fill(t))).slice(0, N);
  while (tasks.length < N) tasks.push("coach");
  const grid: string[] = [];
  for (const a of "LMH") for (const b of "LMH") for (const c of "LMH") for (const d of "LMH") for (const e of "LMH") grid.push(a + b + c + d + e);
  const scenarios = [...Object.keys(UPBRINGING_SCENARIOS), "random"];
  const examples: Example[] = [];
  const rejected: Record<string, number> = {};
  const seenPrompt = new Set<string>();
  let seed = SEED * 7 + 1;
  let k = 0;
  while (examples.length < N) {
    const i = k++;
    if (k > N * 3 + 200) throw new Error(`too many rejections: ${JSON.stringify(rejected)}`);
    const mode = i % 22;
    const steer: Steer =
      mode < 9
        ? { kind: "mbti", type: MBTI_ALL[Math.floor(i / 22) % 16], borderline: [[], [], [0], [1], [2], [3], [0, 2], [1, 3], [2, 3]][mode] }
        : mode < 15
          ? { kind: "grid", pattern: grid[(Math.floor(i / 22) * 6 + (mode - 9)) % grid.length] }
          : mode < 20
            ? { kind: "pop" }
            : mode === 20
              ? { kind: "extreme" }
              : { kind: "flat" };
    const p = makeProfile(seed++, steer, scenarios[i % scenarios.length]);
    const task = tasks[examples.length];
    const ex = build(task, p, rng(seed * 31 + 7));
    const errs = validateExample(ex.prompt, ex.response);
    if (approxTokens(ex.prompt.length + ex.response.length) > 1900) errs.push("too-long");
    if (seenPrompt.has(ex.prompt)) errs.push("duplicate-prompt");
    if (errs.length) {
      for (const e of errs) rejected[`${task}:${e.replace(/:\d+$/, "")}`] = (rejected[`${task}:${e.replace(/:\d+$/, "")}`] ?? 0) + 1;
      if (process.argv.includes("--debug") && errs.some((e) => rejected[`${task}:${e.replace(/:\d+$/, "")}`] === 1)) console.log(errs.join(" "), "\n", ex.response, "\n");
      continue;
    }
    seenPrompt.add(ex.prompt);
    examples.push(ex);
  }
  // Top up rare four-letter types so every one is well covered (the population has few INFJs and INTJs).
  const minPerType = Math.round(N / 16 / 2.5);
  const count = () => tally(examples, (e) => String(e.meta.mbti));
  let guard = 0;
  for (const type of MBTI_ALL) {
    while ((count()[type] ?? 0) < minPerType && guard++ < 200000) {
      const p = makeProfile(seed++, { kind: "mbti", type, borderline: pick(r, [[], [], [0], [1], [2], [3]]) });
      if (p.mbti !== type) continue;
      const task = tasks[examples.length % tasks.length];
      const ex = build(task, p, rng(seed * 31 + 7));
        if (validateExample(ex.prompt, ex.response).length || seenPrompt.has(ex.prompt)) continue;
      seenPrompt.add(ex.prompt);
      examples.push(ex);
    }
  }

  // Split 90/5/5 by a hash of the person, so the split is stable when more data is added.
  const bucket = (id: string) => parseInt(crypto.createHash("sha1").update(`${SEED}:${id}`).digest("hex").slice(0, 8), 16) % 100;
  const split = (e: Example) => (bucket(e.id) < 90 ? "train" : bucket(e.id) < 95 ? "valid" : "test");
  fs.mkdirSync(path.join(OUT, "meta"), { recursive: true });
  const counts: Record<string, number> = {};
  for (const s of ["train", "valid", "test"]) {
    const rows = examples.filter((e) => split(e) === s);
    counts[s] = rows.length;
    fs.writeFileSync(path.join(OUT, `${s}.jsonl`), rows.map((e) => JSON.stringify({ messages: [{ role: "user", content: e.prompt }, { role: "assistant", content: e.response }] })).join("\n") + "\n");
    fs.writeFileSync(path.join(OUT, "meta", `${s}.meta.jsonl`), rows.map((e) => JSON.stringify(e.meta)).join("\n") + "\n");
  }

  const coach = examples.filter((e) => e.task === "coach");
  const uniq = (xs: string[]) => new Set(xs).size;
  const toks = examples.map((e) => approxTokens(e.prompt.length + e.response.length)).sort((a, b) => a - b);
  const manifest = {
    name: "PersonalityVerse synthetic coach and explainer data",
    version: VERSION,
    synthetic: true,
    notice: "Every example is SYNTHETIC: invented people, with ideal answers composed from a hand-written library. For fine-tuning format, focus and tone only. Never use it as evidence about people, and never mix it into the prediction-accuracy evaluation.",
    generator: "scripts/make_synth_v2.ts",
    seed: SEED,
    format: "MLX-LM chat: one JSON object per line, {\"messages\":[{\"role\":\"user\"},{\"role\":\"assistant\"}]}",
    counts: { ...counts, total: examples.length },
    tokensEstimated: { median: toks[Math.floor(toks.length / 2)], p95: toks[Math.floor(toks.length * 0.95)], max: toks[toks.length - 1], limit: 2048 },
    rejectedDuringGeneration: rejected,
    coverage: {
      task: tally(examples, (e) => e.task),
      mbtiType: tally(examples, (e) => String(e.meta.mbti)),
      borderlineLetters: tally(examples, (e) => String(e.meta.borderline)),
      bigFivePatternsCovered: `${uniq(examples.map((e) => String(e.meta.b5)))} of 243`,
      profileSteer: tally(examples, (e) => String(e.meta.steer)),
      floorOrCeilingScore: examples.filter((e) => e.meta.extreme).length,
      answeredDirectTypeQuestions: examples.filter((e) => e.meta.direct).length,
      ageBand: tally(examples, (e) => String(e.meta.ageBand)),
      upbringingScenario: tally(examples, (e) => String(e.meta.scenario)),
      babyTemperament: tally(examples, (e) => String(e.meta.temperament)),
      questionnaire: tally(examples, (e) => String(e.meta.inventory)),
      coachFocus: tally(coach, (e) => e.meta.focus as string[]),
      coachPrimaryFocus: tally(coach, (e) => (e.meta.focus as string[])[0]),
      coachTargetMode: tally(coach, (e) => String(e.meta.targetMode)),
      coachContextFields: tally(coach, (e) => ((e.meta.context as string[]).length ? (e.meta.context as string[]) : ["none"])),
      coachStage: tally(coach, (e) => String(e.meta.stage)),
      coachFacetsPractised: tally(coach, (e) => [...new Set(e.meta.facets as string[])]),
      questions: tally(examples.filter((e) => e.task === "question"), (e) => String(e.meta.qa)),
      questionTopics: tally(examples.filter((e) => e.task === "question"), (e) => String(e.meta.topic)),
      questionHardCases: tally(examples.filter((e) => e.meta.edge), (e) => String(e.meta.edge)),
      questionsTypedRoughly: examples.filter((e) => e.meta.messy).length,
    },
    quality: qualityOf(examples.map((e) => ({ task: e.task, response: e.response }))),
    uniqueness: {
      prompts: uniq(examples.map((e) => e.prompt)),
      responses: uniq(examples.map((e) => e.response)),
      coachPlansDistinct: `${uniq(coach.map((e) => e.response))} of ${coach.length}`,
    },
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  // A few rendered examples for human review.
  const show = (e: Example) => `### ${e.task} (${e.id})\n\n**Prompt**\n\n\`\`\`\n${e.prompt}\n\`\`\`\n\n**Answer**\n\n\`\`\`json\n${JSON.stringify(JSON.parse(e.response), null, 2)}\n\`\`\`\n`;
  const picks = (["coach", "coach", "question", "question", "forecast", "type", "baby", "future"] as Task[]).map((t, i) => examples.filter((e) => e.task === t && (t !== "coach" || (i === 0) === ((e.meta.context as string[]).length === 0)))[i * 3 + 2]);
  fs.writeFileSync(path.join(OUT, "SAMPLES.md"), `# Samples from the synthetic v2 data\n\nSYNTHETIC examples, picked by position, not by quality. Regenerated by \`scripts/make_synth_v2.ts\`.\n\n${picks.filter(Boolean).map(show).join("\n")}`);

  const v = validateDir(OUT);
  console.log(JSON.stringify({ counts: manifest.counts, tokens: manifest.tokensEstimated, rejected, uniqueness: manifest.uniqueness, quality: manifest.quality, seconds: Math.round((Date.now() - t0) / 1000), validationErrors: v.errors.length }, null, 2));
  for (const e of v.errors.slice(0, 20)) console.log("  " + e);
  if (v.errors.length) process.exit(1);
}
main();
