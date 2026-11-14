/*
 * Dataset-level quality figures for the SYNTHETIC v2 data: how varied the answers are. A composed dataset can pass
 * every per-example check and still be repetitive, so the manifest records these and a test holds them to a floor.
 */
import { sentences } from "./validate";

type Row = { task: string; response: string };
const strings = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : []);
const top = (xs: string[]) => {
  const c = new Map<string, number>();
  let best = 0;
  for (const x of xs) {
    const n = (c.get(x) ?? 0) + 1;
    c.set(x, n);
    if (n > best) best = n;
  }
  return { distinct: c.size, most: best };
};
const share = (a: number, b: number) => (b ? Number((a / b).toFixed(4)) : 0);

export function qualityOf(rows: Row[]) {
  const parsed = rows.map((r) => ({ task: r.task, o: JSON.parse(r.response) as Record<string, unknown> }));
  const coach = parsed.filter((r) => r.task === "coach").map((r) => r.o as { headline: string; summary: string; narration: string; watchOut: string; ifThen: string[]; weeks: { challenge: string }[] });
  const slots = coach.flatMap((p) => p.weeks.map((w) => w.challenge));
  const ch = top(slots);
  // Sentences of four words or more, so that enum values ("C", "raises", "strong") do not count as repeats.
  const sents = parsed.flatMap((r) => strings(r.o).flatMap(sentences)).filter((x) => x.split(/\s+/).length >= 4);
  const st = top(sents);
  const tri = new Set<string>();
  let nTri = 0;
  for (const r of parsed) {
    const w = strings(r.o).join(" ").toLowerCase().split(/\s+/);
    for (let i = 0; i + 2 < w.length; i++) {
      tri.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
      nTri++;
    }
  }
  const byTask: Record<string, number> = {};
  for (const t of [...new Set(rows.map((r) => r.task))].sort()) {
    const rs = rows.filter((r) => r.task === t).map((r) => r.response);
    byTask[t] = share(new Set(rs).size, rs.length);
  }
  return {
    distinctAnswerShareByTask: byTask,
    coachChallengeTextsDistinct: ch.distinct,
    mostUsedChallengeShareOfWeeks: share(ch.most, slots.length),
    coachSummariesDistinctShare: share(new Set(coach.map((p) => p.summary)).size, coach.length),
    coachNarrationsDistinctShare: share(new Set(coach.map((p) => p.narration)).size, coach.length),
    coachHeadlinesDistinct: new Set(coach.map((p) => p.headline)).size,
    coachIfThenDistinct: new Set(coach.flatMap((p) => p.ifThen)).size,
    coachWatchOutsDistinct: new Set(coach.map((p) => p.watchOut)).size,
    sentencesDistinct: st.distinct,
    mostRepeatedSentenceShare: share(st.most, sents.length),
    distinctTrigramRatio: share(tri.size, nTri),
  };
}
