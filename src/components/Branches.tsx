"use client";
// The branching multiverse: one baby, timelines that split in childhood and again from today, each ending in another you.
// Every number comes from the real model (src/lib/universes.ts re-runs buildReport and forecast per universe).
import { useEffect, useMemo, useRef, useState } from "react";
import type { Report } from "@/lib/model";
import type { Answers } from "@/lib/questions";
import { allOutcomes, biggestDifference, type UniverseOutcome } from "@/lib/universes";

/** Top-to-bottom (or left-to-right on small screens) order of the timelines; your own runs through the middle. */
const ORDER = ["warm", "restless", "nomad", "growth", "you", "settled", "drift", "tough"];
const T = { baby: 0, leave1: 0.08, child: 0.32, now: 0.56, fan: 0.78, end: 1 };
const pc = (p: number) => `${Math.round(p * 100)}%`;

type Geo = { vertical: boolean; w: number; h: number; t0: number; tLen: number; slot: (i: number) => number };
const HORIZONTAL: Geo = { vertical: false, w: 1000, h: 440, t0: 40, tLen: 700, slot: (i) => 40 + i * 50 };
const VERTICAL: Geo = { vertical: true, w: 360, h: 480, t0: 30, tLen: 380, slot: (i) => 24 + i * 44.5 };

function Chart({
  geo,
  outcomes,
  shown,
  drawn,
  age,
  horizon,
  onHover,
  onPick,
}: {
  geo: Geo;
  outcomes: UniverseOutcome[];
  shown: string;
  drawn: boolean;
  age: number;
  horizon: number;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
}) {
  const xy = (t: number, s: number) => (geo.vertical ? `${s.toFixed(1)},${(geo.t0 + t * geo.tLen).toFixed(1)}` : `${(geo.t0 + t * geo.tLen).toFixed(1)},${s.toFixed(1)}`);
  const pt = (t: number, s: number) => (geo.vertical ? { cx: s, cy: geo.t0 + t * geo.tLen } : { cx: geo.t0 + t * geo.tLen, cy: s });
  const centre = geo.slot(ORDER.indexOf("you"));
  const rows = ORDER.map((id, i) => ({ o: outcomes.find((x) => x.universe.id === id)!, s: geo.slot(i), i }));
  const path = (o: UniverseOutcome, s: number) => {
    if (o.universe.splits === "none") return `M${xy(T.baby, centre)} L${xy(T.end, centre)}`;
    const [a, b] = o.universe.splits === "childhood" ? [T.leave1, T.child] : [T.now, T.fan];
    const m = (a + b) / 2;
    return `M${xy(T.baby, centre)} L${xy(a, centre)} C${xy(m, centre)} ${xy(m, s)} ${xy(b, s)} L${xy(T.end, s)}`;
  };
  const stages = [
    { t: T.baby, label: "Baby you, age 0" },
    { t: (T.leave1 + T.child) / 2, label: "Childhood" },
    { t: T.now, label: `Now, age ${age}` },
    { t: T.end, label: `Age ${horizon}` },
  ];
  const tPos = (t: number) => geo.t0 + t * geo.tLen;
  const you = rows.find((r) => r.o.universe.id === "you")!;
  const summary = `Timelines branching from baby you at age 0. Three split away in childhood and four split from today, ending at age ${horizon} in ${rows.length} universes. Your own path ends as ${you.o.type.type}. Full figures are in the table that follows.`;

  return (
    <svg viewBox={`0 0 ${geo.w} ${geo.h}`} role="img" aria-label={summary} className={`block h-auto w-full ${drawn ? "branches-drawn" : ""}`}>
      {/* stage guides */}
      <g className="branch-fade" style={{ "--d": "0ms" } as React.CSSProperties}>
        {stages.map((st) =>
          geo.vertical ? (
            <line key={st.label} x1={8} x2={geo.w - 8} y1={tPos(st.t)} y2={tPos(st.t)} stroke="#fff" strokeOpacity={0.07} strokeDasharray="2 5" />
          ) : (
            <line key={st.label} x1={tPos(st.t)} x2={tPos(st.t)} y1={14} y2={geo.h - 34} stroke="#fff" strokeOpacity={0.07} strokeDasharray="2 5" />
          ),
        )}
        {geo.vertical ? (
          <g fontSize={10.5} fill="#a8a6c4">
            <text x={centre + 12} y={tPos(T.baby) + 4}>Baby you, age 0</text>
            <text x={centre - 12} y={tPos(0.42)} textAnchor="end">Childhood</text>
            <text x={centre - 12} y={tPos(T.now) - 7} textAnchor="end">Now, age {age}</text>
            <text x={geo.w / 2} y={geo.h - 6} textAnchor="middle">Likeliest type in each universe at age {horizon}</text>
          </g>
        ) : (
          <g fontSize={12} fill="#a8a6c4">
            {stages.map((st, i) => (
              <text key={st.label} x={tPos(st.t)} y={geo.h - 12} textAnchor={i === 0 ? "start" : "middle"}>
                {st.label}
              </text>
            ))}
          </g>
        )}
      </g>

      {/* the timelines */}
      <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
        {rows.map(({ o, s, i }) => {
          const mine = o.universe.id === "you";
          const on = shown === o.universe.id;
          const base = mine ? 0.95 : 0.3 + 0.5 * o.type.p;
          return (
            <path
              key={o.universe.id}
              className="branch-line"
              d={path(o, s)}
              pathLength={1}
              stroke={on ? "#c4b5fd" : mine ? "#a78bfa" : "#e9e7f7"}
              strokeOpacity={on ? 1 : shown === "you" ? base : base * 0.55}
              strokeWidth={(1.25 + 5.5 * o.type.p) * (geo.vertical ? 0.8 : 1)}
              style={{ "--d": `${200 + i * 110}ms` } as React.CSSProperties}
            />
          );
        })}
      </g>

      {/* nodes and labels */}
      <g className="branch-fade" style={{ "--d": "900ms" } as React.CSSProperties}>
        <circle {...pt(T.baby, centre)} r={6} fill="#09090d" stroke="#c4b5fd" strokeWidth={1.5} />
        <circle {...pt(T.baby, centre)} r={2} fill="#c4b5fd" />
        {[T.leave1, T.now].map((t) => (
          <circle key={t} {...pt(t, centre)} r={3.5} fill="#09090d" stroke="#c4b5fd" strokeWidth={1.25} />
        ))}
        {rows.map(({ o, s }) => {
          const on = shown === o.universe.id;
          const mine = o.universe.id === "you";
          const p = pt(T.end, s);
          return (
            <g key={o.universe.id}>
              <circle {...p} r={on ? 5.5 : 4} fill={on || mine ? "#c4b5fd" : "#09090d"} stroke={on || mine ? "#c4b5fd" : "#e9e7f7"} strokeOpacity={on || mine ? 1 : 0.55} strokeWidth={1.25} />
              {geo.vertical ? (
                <>
                  <text x={p.cx} y={p.cy + 20} textAnchor="middle" fontSize={10.5} fontWeight={600} letterSpacing=".02em" fill={on || mine ? "#f4f3fb" : "#d9d7ee"}>
                    {o.type.type}
                  </text>
                  <text x={p.cx} y={p.cy + 34} textAnchor="middle" fontSize={9.5} fill="#a8a6c4">
                    {pc(o.type.p)}
                  </text>
                </>
              ) : (
                <>
                  <text x={p.cx + 18} y={p.cy - 1} fontSize={16} fontWeight={600} letterSpacing=".01em" fill={on || mine ? "#f4f3fb" : "#d9d7ee"}>
                    {o.type.type}
                    <tspan dx={8} fontSize={12} fontWeight={400} fill="#a8a6c4">
                      {pc(o.type.p)}
                    </tspan>
                  </text>
                  <text x={p.cx + 18} y={p.cy + 15} fontSize={12} fill={on ? "#c4b5fd" : "#a8a6c4"}>
                    {o.universe.name}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* generous hit areas; yours last so the shared trunk belongs to your path */}
      <g fill="none" stroke="transparent" strokeWidth={geo.vertical ? 30 : 24} style={{ cursor: "pointer" }}>
        {[...rows.filter((r) => r.o.universe.id !== "you"), you].map(({ o, s }) => (
          <path key={o.universe.id} d={path(o, s)} pointerEvents="stroke" onPointerEnter={() => onHover(o.universe.id)} onPointerLeave={() => onHover(null)} onClick={() => onPick(o.universe.id)} />
        ))}
      </g>
    </svg>
  );
}

export function Branches({ answers, report }: { answers: Answers; report: Report }) {
  const outcomes = useMemo(() => allOutcomes(answers, report), [answers, report]);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState("you");
  const shown = hover ?? pinned;
  const o = outcomes.find((x) => x.universe.id === shown)!;
  const ordered = ORDER.map((id) => outcomes.find((x) => x.universe.id === id)!);
  const distinct = new Set(outcomes.map((x) => x.type.type)).size;

  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setDrawn(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setDrawn(true), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chart = { outcomes, shown, drawn, age: answers.age, horizon: answers.horizon, onHover: setHover, onPick: setPinned };

  return (
    <section className="mb-20 mt-20 sm:mt-24" aria-labelledby="branches-h">
      <div className="flex items-center gap-4">
        <p className="kicker">Your multiverse</p>
        <span aria-hidden="true" className="hairline min-w-6 flex-1" />
      </div>
      <h2 id="branches-h" className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.08] sm:text-[2.6rem]">
        One baby, <span className="accent-serif text-[var(--accent-soft)]">{outcomes.length} versions</span> of you
      </h2>
      <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--color-muted)]">
        Every line starts with the same baby. Some split away in childhood, with a different home; others split today, with a different next chapter. Each ends at age{" "}
        {answers.horizon} as the type that version of you would most likely be. Thicker, brighter lines are surer of their type. Across all {outcomes.length} universes you land on{" "}
        {distinct === 1 ? "the same type every time" : `${distinct} different types`}.
      </p>

      <div ref={ref} className="card relative mt-8 overflow-hidden p-3 sm:p-6">
        <div className="hidden lg:block">
          <Chart geo={HORIZONTAL} {...chart} />
        </div>
        <div className="mx-auto max-w-md lg:hidden">
          <Chart geo={VERTICAL} {...chart} />
        </div>

        <table className="sr-only">
          <caption>Every universe, where it splits from yours, and how it ends at age {answers.horizon}</caption>
          <thead>
            <tr>
              <th scope="col">Universe</th>
              <th scope="col">Splits from your timeline</th>
              <th scope="col">Likeliest type</th>
              <th scope="col">Chance of that type</th>
              <th scope="col">Average chance a trait shifts a lot</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((x) => (
              <tr key={x.universe.id}>
                <th scope="row">{x.universe.name}</th>
                <td>{x.universe.splits === "none" ? "Never: this is your path" : x.universe.splits === "childhood" ? "In childhood" : `Now, at age ${answers.age}`}</td>
                <td>
                  {x.type.type}, {x.type.info.nickname}
                </td>
                <td>{pc(x.type.p)}</td>
                <td>{pc(x.shift)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:mt-2 lg:grid-cols-8" role="group" aria-label="Pick a universe">
          {ordered.map((x, i) => (
            <button
              key={x.universe.id}
              type="button"
              aria-pressed={pinned === x.universe.id}
              onClick={() => setPinned(x.universe.id)}
              onFocus={() => setHover(x.universe.id)}
              onBlur={() => setHover(null)}
              onPointerEnter={() => setHover(x.universe.id)}
              onPointerLeave={() => setHover(null)}
              className="opt flex min-h-11 items-center gap-2 px-2.5 py-2 text-left text-xs"
            >
              <span aria-hidden="true" className="font-mono text-[10px] tabular-nums opacity-70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 truncate first-letter:uppercase">{x.universe.id === "you" ? "Yours" : x.universe.name.replace(/^The | universe$/g, "")}</span>
              <span className="sr-only">: {x.type.type}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-px overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-[1.5fr_1fr_1fr]" aria-live="polite">
          <div className="bg-[var(--color-panel)] p-4 sm:p-5">
            <p className="eyebrow">{o.universe.name}</p>
            <p className="mt-1.5 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug text-[#f4f3fb]">{o.universe.you}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-muted)]">{biggestDifference(o, answers.horizon)}</p>
          </div>
          <div className="bg-[var(--color-panel)] p-4 sm:p-5">
            <p className="eyebrow">Likeliest type at {answers.horizon}</p>
            <p className="stat-num mt-2 !text-3xl">
              {o.type.type}
              <span className="stat-unit">{pc(o.type.p)}</span>
            </p>
            <p className="mt-1.5 text-[13px] text-[var(--color-muted)]">{o.type.info.nickname}</p>
          </div>
          <div className="bg-[var(--color-panel)] p-4 sm:p-5">
            <p className="eyebrow">Odds of a big shift</p>
            <p className="stat-num mt-2 !text-3xl">
              {Math.round(o.shift * 100)}
              <span className="stat-unit">%</span>
            </p>
            <p className="mt-1.5 text-[13px] text-[var(--color-muted)]">average chance each trait moves a lot between {answers.age} and {answers.horizon}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
