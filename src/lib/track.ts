// Trait tracker maths. Pure functions, so the page can recompute in the browser.
// Your first result is the baseline. For any later date we know what the model expects (same stability, maturation and
// life-event logic as the forecast) and how much a retest would wobble anyway, so each check-in can be read as
// "within the range", "higher than forecast" or "lower than forecast".
import { stabilityOver, maturation, type Vec } from "./model";
import { TRAITS, LIFE_EVENTS, TIPI_RETEST_R, type Trait } from "./params";
import type { Answers } from "./questions";

export type Checkin = { time: string; z: Vec };
export type Expect = { expected: number; sd: number; sdObs: number };
export type Status = { trait: Trait; zGap: number; verdict: "within" | "higher" | "lower"; slope: number | null; slopeSe: number | null };

const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const EVENT_WINDOW_YEARS = 3;
const NOISE_VAR = 2 * (1 - TIPI_RETEST_R); // error in the baseline plus error in the check-in
export const Z80 = 1.2816;

export const yearsBetween = (a: string | Date, b: string | Date) => (new Date(b).getTime() - new Date(a).getTime()) / YEAR_MS;

/** What the model expects your scores to be `years` after the baseline, with the true-change SD and the SD of an observed retest. */
export function expectAt(base: Vec, a: Answers, years: number): Record<Trait, Expect> {
  const y = Math.max(0, years);
  const r = stabilityOver(a.age, y);
  const mat = maturation(a.age, a.age + y);
  const sd = Math.sqrt(Math.max(0, 1 - r * r));
  const out = {} as Record<Trait, Expect>;
  for (const t of TRAITS) {
    let mu = (r - 1) * base[t] + mat[t];
    for (const e of a.events) if (e !== "practice") mu += LIFE_EVENTS[e].d[t] * Math.min(1, y / EVENT_WINDOW_YEARS);
    out[t] = { expected: base[t] + mu, sd, sdObs: Math.sqrt(sd * sd + NOISE_VAR) };
  }
  return out;
}

/** Ordinary least squares slope (SD per year) through baseline and check-ins, with its standard error. Needs 3+ points. */
function slope(xs: number[], ys: number[]): { b: number; se: number } | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (sxx < 1e-6) return null;
  const b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx;
  const rss = xs.reduce((s, x, i) => s + (ys[i] - my - b * (x - mx)) ** 2, 0);
  return { b, se: Math.sqrt(rss / (n - 2) / sxx) };
}

/** Read the latest check-in against the forecast, and the trend if there are enough points. */
export function assess(base: Vec, baseTime: string, a: Answers, checkins: Checkin[]): Status[] | null {
  if (!checkins.length) return null;
  const last = checkins[checkins.length - 1];
  const ex = expectAt(base, a, yearsBetween(baseTime, last.time));
  const xs = [0, ...checkins.map((c) => yearsBetween(baseTime, c.time))];
  return TRAITS.map((t) => {
    const zGap = (last.z[t] - ex[t].expected) / ex[t].sdObs;
    const s = slope(xs, [base[t], ...checkins.map((c) => c.z[t])]);
    return { trait: t, zGap, verdict: zGap > Z80 ? "higher" : zGap < -Z80 ? "lower" : "within", slope: s?.b ?? null, slopeSe: s?.se ?? null };
  });
}

function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A clearly-labelled example year of check-ins, drawn from the model itself, for people who have not checked in yet. */
export function simulateYear(base: Vec, baseTime: string, a: Answers, seed = 35): Checkin[] {
  const rnd = mulberry(seed);
  const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const months = [2, 4, 6, 9, 12];
  const drift = Object.fromEntries(TRAITS.map((t) => [t, g()])) as Vec; // one person's own direction of travel
  const t0 = new Date(baseTime).getTime();
  return months.map((m) => {
    const y = m / 12;
    const ex = expectAt(base, a, y);
    const z = Object.fromEntries(TRAITS.map((t) => [t, ex[t].expected + ex[t].sd * drift[t] + Math.sqrt(1 - TIPI_RETEST_R) * g()])) as Vec;
    return { time: new Date(t0 + y * YEAR_MS).toISOString(), z };
  });
}

/** An .ics calendar reminder for the next check-in. */
export function reminderIcs(url: string, when: Date): string {
  const d = when.toISOString().slice(0, 10).replace(/-/g, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Personalityverse//Tracker//EN",
    "BEGIN:VEVENT",
    `UID:${d}-${Math.random().toString(36).slice(2)}@personalityverse`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d}`,
    "SUMMARY:Personalityverse check-in (10 questions)",
    `DESCRIPTION:See if you are moving the way your forecast said: ${url}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
