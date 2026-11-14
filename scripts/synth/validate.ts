/*
 * Strict validators for the SYNTHETIC v2 data. They work from the prompt and the answer alone (no generator state),
 * so the same checks can score a model's output later. Every check has a short code; an example passes with none.
 *
 * CLI: node scripts/run-ts.cjs scripts/synth/validate.ts [dir]   (default data/synthetic-v2; exits 1 on any error)
 */
import fs from "node:fs";
import path from "node:path";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import { focusGaps, type CoachRequest } from "@/lib/coachLibrary";
import { checkPlan } from "@/lib/coachPrompt";
import { expected16, words } from "./writers";

export type Task = "coach" | "future" | "forecast" | "baby" | "type" | "question";

export function taskOf(prompt: string): Task | null {
  if (prompt.startsWith("You are an evidence-based personality-development coach")) return "coach";
  if (prompt.startsWith("Write a short voice note")) return "future";
  if (!prompt.startsWith("You explain one result")) return null;
  if (prompt.includes("Result to explain: the model gives")) return "forecast";
  if (prompt.includes("Result to explain: the estimate of their temperament as a baby")) return "baby";
  if (prompt.includes("Result to explain: their likely four-letter type")) return "type";
  if (prompt.includes('\nThey ask: "')) return "question";
  return null;
}

const NAME_TO_TRAIT = Object.fromEntries(TRAITS.map((t) => [TRAIT_META[t].name, t])) as Record<string, Trait>;
/** "Openness 68th percentile, Conscientiousness 55th percentile, ..." -> { O: 68, C: 55, ... } */
function pctLine(prompt: string, label: string): Record<Trait, number> | null {
  const line = prompt.split("\n").find((l) => l.startsWith(label));
  if (!line) return null;
  const out = {} as Record<Trait, number>;
  for (const m of line.matchAll(/(Openness|Conscientiousness|Extraversion|Agreeableness|Neuroticism) (\d+)(?:st|nd|rd|th)? ?(?:percentile)?/g)) out[NAME_TO_TRAIT[m[1]]] = Number(m[2]);
  return TRAITS.every((t) => typeof out[t] === "number") ? out : null;
}

export function parseCoachPrompt(prompt: string): (CoachRequest & { hasContext: boolean; under18: boolean }) | null {
  const user = /\nUser: (?:([^,\n]+), )?age (\d+)\. Early temperament type: (.+)\.\n/.exec(prompt);
  const nowPct = pctLine(prompt, "Current personality:");
  const babyPct = pctLine(prompt, "Estimated baby temperament:");
  const targetPct = pctLine(prompt, "Target (");
  const tname = /\nTarget \("(.*)"\):/.exec(prompt);
  const pc = /chosen age: (.+)\.\n/.exec(prompt);
  if (!user || !nowPct || !babyPct || !targetPct || !tname || !pc) return null;
  const pChange = {} as Record<Trait, number>;
  for (const m of pc[1].matchAll(/([OCEAN]) (\d+)%/g)) pChange[m[1] as Trait] = Number(m[2]) / 100;
  const age = Number(user[2]);
  return { name: user[1], age, temperamentType: user[3], nowPct, babyPct, targetPct, targetName: tname[1], pChange, hasContext: prompt.includes("\nExtra context ("), under18: age < 18 };
}

export const sentences = (s: string) => s.trim().split(/(?<=[.!?])\s+(?=[A-Z"'(])/).filter(Boolean);
const ordinals = (s: string) => [...s.matchAll(/\b(\d+)(?:st|nd|rd|th)\b/g)].map((m) => Number(m[1]));
const percents = (s: string) => [...s.matchAll(/\b(\d+)%/g)].map((m) => Number(m[1]));
const near = (x: number, set: number[], tol = 0) => set.some((y) => Math.abs(x - y) <= tol);

const CLICHES = /\b(journey|unlock|unleash|embrace|game[- ]changer|comfort zone|best version of yourself|superpower|deep dive|at the end of the day|rome wasn't built|transformative|empower)\b/i;
const AMERICAN = /\b(organiz|behavior|favorite|color\b|center\b|realiz|recogniz|program\b|practic(ing|ed)\b|neighbor|honor\b|skeptic|counselor|apologiz|prioritiz|judgment)\w*/i;
const IZE_OK = new Set(["s", "pr", "se", "res", "caps", "overs", "outs", "downs"]);
const DIAGNOSE = /\byou (have|are suffering from|suffer from|probably have|clearly have) (an? )?(anxiety disorder|depression|adhd|autism|ocd|bipolar|personality disorder|narciss)/i;

function common(text: string, errs: string[]) {
  if (/[—–]/.test(text)) errs.push("dash");
  if (/```/.test(text)) errs.push("fence");
  if (/\{\w+\}/.test(text)) errs.push("unfilled-slot");
  if (CLICHES.test(text)) errs.push(`cliche:${CLICHES.exec(text)![0]}`);
  if (AMERICAN.test(text)) errs.push(`american:${AMERICAN.exec(text)![0]}`);
  for (const m of text.matchAll(/\b(\w+)iz(?:e|ed|ing|es|ation|ations)\b/gi)) if (!IZE_OK.has(m[1].toLowerCase())) errs.push(`american:${m[0]}`);
  if (DIAGNOSE.test(text)) errs.push("diagnosis");
  if (/\s{2,}/.test(text) || /\s[,;:]|\s\.(?!\d)/.test(text)) errs.push("spacing");
  if (/\ba (8\d?|11|18)(st|nd|rd|th|%)/.test(text) || /\ban (?!8|11|18)\d+(st|nd|rd|th|%)/.test(text)) errs.push("a-an");
  // Wrong article before a filled slot ("an work social", "a evening"), and a doubled word ("low low mood").
  const art = /\ban (?!hour|honest|heir|honour)[bcdfghjklmnpqrstvwyz][a-z]/.exec(text) ?? /\ba (?!one\b|once\b|uni|use|usual|user|euro)[aeiou][a-z]/.exec(text);
  if (art) errs.push(`a-an:${art[0]}`);
  const dbl = /\b([a-z]{3,}) \1\b/i.exec(text);
  if (dbl && !/^(that|had) /i.test(dbl[0])) errs.push(`doubled-word:${dbl[0]}`);
  if (/undefined|NaN|\[object/.test(text)) errs.push("template-leak");
}
const exactKeys = (o: Record<string, unknown>, keys: string[], errs: string[]) => {
  if (Object.keys(o).join(",") !== keys.join(",")) errs.push(`keys:${Object.keys(o).join(",")}`);
};
const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v === v.trim();

export function validateExample(prompt: string, response: string): string[] {
  const errs: string[] = [];
  const task = taskOf(prompt);
  if (!task) return ["unknown-task"];
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(response);
  } catch {
    return ["json"];
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) return ["json-object"];
  common(response, errs);

  if (task === "coach") {
    exactKeys(o, ["headline", "summary", "weeks", "ifThen", "watchOut", "narration"], errs);
    const b = parseCoachPrompt(prompt);
    if (!b) return [...errs, "prompt-parse"];
    const focus = focusGaps(b);
    const ft = focus.map((f) => f.t);
    const q = checkPlan(o, b, ft);
    for (const [k, v] of Object.entries(q.checks)) if (!v) errs.push(`app:${k}`);
    if (!str(o.headline) || words(o.headline as string) > 8) errs.push("headline-length");
    const sum = String(o.summary ?? "");
    const ns = sentences(sum).length;
    if (ns < 2 || ns > 3) errs.push(`summary-sentences:${ns}`);
    const weeks = (Array.isArray(o.weeks) ? o.weeks : []) as { week: number; trait: Trait; challenge: string; why: string }[];
    weeks.forEach((w, i) => {
      if (Object.keys(w).join(",") !== "week,trait,challenge,why") errs.push("week-keys");
      if (w.week !== i + 1) errs.push("week-order");
      if (!str(w.challenge) || w.challenge.length < 25 || w.challenge.length > 260) errs.push("challenge-length");
      if (!str(w.why) || sentences(w.why).length !== 1) errs.push("why-sentences");
    });
    if (new Set(weeks.map((w) => w.challenge)).size !== weeks.length) errs.push("duplicate-challenge");
    if (focus.length === 2) {
      const n = (t: Trait) => weeks.filter((w) => w.trait === t).length;
      if (n(ft[0]) < n(ft[1])) errs.push("allocation");
      if (n(ft[1]) < 3) errs.push("allocation-min");
    }
    const it = (Array.isArray(o.ifThen) ? o.ifThen : []) as string[];
    if (it.length !== 2 || !it.every((s) => /^If .+, then I will .+\.$/.test(s))) errs.push("ifthen-format");
    if (!str(o.watchOut) || sentences(o.watchOut as string).length !== 1) errs.push("watchout-sentences");
    const narr = String(o.narration ?? "");
    const nw = words(narr);
    if (nw < 70 || nw > 110) errs.push(`narration-words:${nw}`);
    const tk = b.temperamentType.toLowerCase().slice(0, 4);
    if (!narr.toLowerCase().includes(tk)) errs.push("narration-temperament");
    if (!/\byou\b/i.test(narr)) errs.push("narration-person");
    // Numbers in the summary must come from the prompt or from the app's own effect size.
    const [A, B] = focus;
    const noGap = TRAITS.every((t) => Math.abs(b.targetPct[t] - b.nowPct[t]) < 10);
    if (!noGap) {
      const okOrd = [A, B].filter(Boolean).flatMap((f) => [b.nowPct[f.t], b.targetPct[f.t]]);
      const exp = expected16(b.nowPct[A.t], A.g > 0 ? "up" : "down");
      for (const n of ordinals(sum)) if (!near(n, okOrd) && !near(n, [exp], 3)) errs.push(`summary-percentile:${n}`);
      const letterOdds = percents(prompt.split("\n").find((l) => l.startsWith("- Likely four-letter type")) ?? "");
      for (const n of percents(sum)) if (!near(n, [A, B].filter(Boolean).map((f) => Math.round(b.pChange[f.t] * 100))) && !near(n, letterOdds)) errs.push(`summary-percent:${n}`);
      // The expected figure must never be presented as reaching beyond the target.
      const m = /(?:roughly|around|near) the (\d+)(?:st|nd|rd|th) percentile/.exec(sum);
      if (m && (A.g > 0 ? Number(m[1]) > b.targetPct[A.t] : Number(m[1]) < b.targetPct[A.t])) errs.push("summary-overshoot");
    }
    if (b.under18 && /\b(pub|bar|wine|beer|drinks?|night out)\b/i.test(response)) errs.push("under18-content");
    return errs;
  }

  if (task === "future") {
    exactKeys(o, ["text"], errs);
    const t = String(o.text ?? "");
    const n = words(t);
    if (n < 60 || n > 90) errs.push(`future-words:${n}`);
    if (/percentile|%|\bSD\b|standard deviation/i.test(t)) errs.push("future-numbers");
    const allowed = [...prompt.matchAll(/age (\d+)/g)].map((m) => m[1]);
    for (const m of t.matchAll(/\d+/g)) if (!allowed.includes(m[0])) errs.push(`future-digit:${m[0]}`);
    if (!/likely|forecast|probable|guaranteed|odds|prove me wrong|swear/i.test(t)) errs.push("future-certainty");
    if (/\b(salary|rich|promotion|married|wife|husband|boss|£|\$)\b/i.test(t)) errs.push("future-specifics");
    return errs;
  }

  const promptOrd = ordinals(prompt);
  const promptPct = percents(prompt);
  const agesIn = [...prompt.matchAll(/age (\d+)/g)].map((m) => Number(m[1]));

  if (task === "forecast") {
    exactKeys(o, ["headline", "explanation", "drivers", "caveat"], errs);
    if (!str(o.headline) || words(o.headline as string) > 10) errs.push("headline-length");
    const ex = String(o.explanation ?? "");
    const ns = sentences(ex).length;
    if (ns < 3 || ns > 4) errs.push(`explanation-sentences:${ns}`);
    for (const n of ordinals(ex)) if (!near(n, promptOrd)) errs.push(`explain-percentile:${n}`);
    for (const n of percents(ex)) if (!near(n, promptPct)) errs.push(`explain-percent:${n}`);
    const given = [...prompt.matchAll(/^- (.+): ([+-])(\d\.\d\d)$/gm)].map((m) => ({ label: m[1], effect: (m[2] === "+" ? 1 : -1) * Number(m[3]) }));
    const ds = (Array.isArray(o.drivers) ? o.drivers : []) as { label: string; effect: string; plain: string }[];
    if (ds.length > 3) errs.push("drivers-count");
    let last = Infinity;
    for (const d of ds) {
      if (Object.keys(d).join(",") !== "label,effect,plain") errs.push("driver-keys");
      const g = given.find((x) => x.label === d.label);
      if (!g) {
        errs.push("driver-label");
        continue;
      }
      if ((g.effect > 0 ? "raises" : "lowers") !== d.effect) errs.push("driver-sign");
      if (Math.abs(g.effect) > last + 1e-9) errs.push("driver-order");
      last = Math.abs(g.effect);
      if (!str(d.plain) || sentences(d.plain).length !== 1) errs.push("driver-plain");
    }
    if (given.some((g) => Math.abs(g.effect) >= 0.005) && !ds.length) errs.push("drivers-missing");
    if (!str(o.caveat) || sentences(o.caveat as string).length !== 1) errs.push("caveat-sentences");
    const yrs = agesIn.length >= 3 ? Math.abs(agesIn[2] - agesIn[1]) : null;
    for (const m of ex.matchAll(/over (\d+) years/g)) if (yrs !== null && Number(m[1]) !== yrs) errs.push("explain-years");
    return errs;
  }

  if (task === "baby") {
    exactKeys(o, ["headline", "explanation", "mostCertain", "caveat"], errs);
    if (!str(o.headline) || words(o.headline as string) > 10) errs.push("headline-length");
    const ex = String(o.explanation ?? "");
    const ns = sentences(ex).length;
    if (ns < 3 || ns > 4) errs.push(`explanation-sentences:${ns}`);
    const all = `${ex} ${o.mostCertain}`;
    for (const n of ordinals(all)) if (!near(n, promptOrd)) errs.push(`explain-percentile:${n}`);
    for (const n of percents(all)) if (!near(n, promptPct)) errs.push(`explain-percent:${n}`);
    if (!/cannot be measured at birth|can't be measured at birth/i.test(ex)) errs.push("baby-honesty");
    const ranges = [...prompt.matchAll(/percentile \((\d+)(?:st|nd|rd|th) to (\d+)(?:st|nd|rd|th)\)/g)].map((m) => Number(m[2]) - Number(m[1]));
    const w = /spans (\d+) percentile points/.exec(String(o.mostCertain));
    if (!w || Number(w[1]) !== Math.min(...ranges)) errs.push("baby-narrowest");
    for (const k of ["mostCertain", "caveat"]) if (!str(o[k]) || sentences(o[k] as string).length !== 1) errs.push(`${k}-sentences`);
    return errs;
  }

  if (task === "type") {
    exactKeys(o, ["headline", "explanation", "closestCall", "caveat"], errs);
    if (!str(o.headline) || words(o.headline as string) > 10) errs.push("headline-length");
    const ex = String(o.explanation ?? "");
    const ns = sentences(ex).length;
    if (ns < 3 || ns > 4) errs.push(`explanation-sentences:${ns}`);
    const type = /Likeliest type: ([EI][SN][TF][JP])\./.exec(prompt)?.[1] ?? "";
    if (!ex.includes(type) || !String(o.headline).includes(type)) errs.push("type-name");
    for (const t of `${o.headline} ${ex} ${o.closestCall}`.matchAll(/\b[EI][SN][TF][JP]\b/g)) if (!prompt.includes(t[0])) errs.push(`type-invented:${t[0]}`);
    const all = `${ex} ${o.closestCall}`;
    for (const n of ordinals(all)) if (!near(n, promptOrd)) errs.push(`explain-percentile:${n}`);
    for (const n of percents(all)) if (!near(n, promptPct)) errs.push(`explain-percent:${n}`);
    for (const n of percents(String(o.caveat))) if (n !== 47) errs.push(`caveat-percent:${n}`);
    if (!/not taken the MBTI|did not sit the MBTI|did not take the MBTI/i.test(ex)) errs.push("type-honesty");
    const cc = /Closest call: ([EISNTFJP]) against ([EISNTFJP])\./.exec(prompt);
    if (cc && !new RegExp(`\\b${cc[1]}\\b`).test(String(o.closestCall))) errs.push("closest-letter");
    for (const k of ["closestCall", "caveat"]) if (!str(o[k]) || sentences(o[k] as string).length !== 1) errs.push(`${k}-sentences`);
    return errs;
  }

  // question
  exactKeys(o, ["answer", "evidence", "nextStep"], errs);
  const a = String(o.answer ?? "");
  const n = words(a);
  if (n < 60 || n > 110) errs.push(`answer-words:${n}`);
  if (!["strong", "some", "thin"].includes(o.evidence as string)) errs.push("evidence-enum");
  if (!str(o.nextStep) || sentences(o.nextStep as string).length !== 1 || words(o.nextStep as string) > 40) errs.push("nextstep");
  const question = /\nThey ask: "(.*)"\n/.exec(prompt)?.[1] ?? "";
  const now = pctLine(prompt, "Current personality:");
  if (!now) return [...errs, "prompt-parse"];
  const own = TRAITS.map((t) => now[t]);
  const okOrd = [...own, ...own.map((p) => expected16(p, "up")), ...ordinals(question), 45, 55, 85, 95, 90];
  for (const x of ordinals(a)) if (!near(x, okOrd)) errs.push(`answer-percentile:${x}`);
  if (/hopeless|low for weeks|feel empty/i.test(question)) {
    if (!a.includes("116 123") || !/\bGP\b/.test(a) || !String(o.nextStep).includes("116 123")) errs.push("safety-signpost");
  }
  if (/Do my results mean I have|do you think I've got/i.test(question)) {
    if (!/\bGP\b/.test(a) || !/can't tell|cannot tell/i.test(a)) errs.push("safety-diagnosis");
  }
  return errs;
}

// ---------- dataset level ----------
export type Row = { messages: { role: string; content: string }[] };
/** Rough upper bound on tokens: English prose in these prompts runs at about 4 characters per token for Gemma. */
export const approxTokens = (chars: number) => Math.ceil(chars / 3.6);

export function validateDir(dir: string) {
  const errors: string[] = [];
  const splits = ["train", "valid", "test"] as const;
  const seen = new Map<string, string>();
  const counts: Record<string, number> = {};
  const byTask: Record<string, number> = {};
  let maxTokens = 0;
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  if (manifest.synthetic !== true) errors.push("manifest: synthetic flag missing");
  for (const s of splits) {
    const lines = fs.readFileSync(path.join(dir, `${s}.jsonl`), "utf8").split("\n").filter(Boolean);
    const meta = fs.readFileSync(path.join(dir, "meta", `${s}.meta.jsonl`), "utf8").split("\n").filter(Boolean);
    if (meta.length !== lines.length) errors.push(`${s}: meta has ${meta.length} lines, data has ${lines.length}`);
    counts[s] = lines.length;
    if (manifest.counts?.[s] !== lines.length) errors.push(`${s}: manifest count ${manifest.counts?.[s]} != ${lines.length}`);
    lines.forEach((line, i) => {
      const at = `${s}:${i + 1}`;
      let row: Row;
      try {
        row = JSON.parse(line);
      } catch {
        return errors.push(`${at} not JSON`);
      }
      const m = row.messages;
      if (Object.keys(row).join(",") !== "messages" || !Array.isArray(m) || m.length !== 2 || m[0].role !== "user" || m[1].role !== "assistant" || Object.keys(m[0]).join(",") !== "role,content" || Object.keys(m[1]).join(",") !== "role,content")
        return errors.push(`${at} not in MLX chat format`);
      const [u, a] = [m[0].content, m[1].content];
      if (seen.has(u)) errors.push(`${at} duplicate prompt (also ${seen.get(u)})`);
      seen.set(u, at);
      const tk = approxTokens(u.length + a.length);
      maxTokens = Math.max(maxTokens, tk);
      if (tk > 1900) errors.push(`${at} too long (${tk} tokens est.)`);
      const task = taskOf(u) ?? "unknown";
      byTask[task] = (byTask[task] ?? 0) + 1;
      const mt = meta[i] ? JSON.parse(meta[i]) : {};
      if (mt.task !== task) errors.push(`${at} meta task ${mt.task} != ${task}`);
      if (mt.synthetic !== true) errors.push(`${at} meta not marked synthetic`);
      const e = validateExample(u, a);
      if (e.length) errors.push(`${at} [${task}] ${e.join(" ")}`);
    });
  }
  return { errors, counts, byTask, maxTokens };
}

if (process.argv[2]?.endsWith("synth/validate.ts")) {
  const dir = process.argv[3] ?? "data/synthetic-v2";
  const r = validateDir(dir);
  console.log(JSON.stringify({ counts: r.counts, byTask: r.byTask, maxTokensEst: r.maxTokens, errors: r.errors.length }, null, 2));
  for (const e of r.errors.slice(0, 40)) console.log("  " + e);
  process.exit(r.errors.length ? 1 : 0);
}
