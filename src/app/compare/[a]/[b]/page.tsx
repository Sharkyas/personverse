"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildReport, toPct, type Vec } from "@/lib/model";
import { TRAITS, TRAIT_META } from "@/lib/params";
import type { Answers } from "@/lib/questions";
import { Radar, Legend } from "@/components/Radar";
import { CountUp, Reveal } from "@/components/Motion";

const similarity = (x: Vec, y: Vec) => Math.round(100 - (Math.sqrt(TRAITS.reduce((s, t) => s + (x[t] - y[t]) ** 2, 0)) / 223) * 100);
type View = "baby" | "now" | "future";
const possessive = (n: string) => (n === "You" ? "Your" : `${n}’s`);

export default function Compare({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a: idA, b: idB } = use(params);
  const [ans, setAns] = useState<[Answers, Answers] | null | undefined>(undefined);
  const [names, setNames] = useState<[string, string]>(["Friend", "You"]);
  const [view, setView] = useState<View>("now");

  useEffect(() => {
    Promise.all([idA, idB].map((id) => fetch(`/api/profile/${id}`).then((r) => (r.ok ? r.json() : null))))
      .then(([x, y]) => setAns(x && y ? [x.answers, y.answers] : null))
      .catch(() => setAns(null));
    try {
      const mine: string[] = JSON.parse(localStorage.getItem("pv-mine") || "[]");
      const isA = mine.includes(idA), isB = mine.includes(idB);
      setNames(isA && !isB ? ["You", "Friend"] : !isA && isB ? ["Friend", "You"] : ["Person A", "Person B"]);
    } catch {}
  }, [idA, idB]);

  const data = useMemo(() => {
    if (!ans) return null;
    const [ra, rb] = ans.map(buildReport);
    const fut = (r: typeof ra) => toPct(Object.fromEntries(r.future.map((f) => [f.trait, f.expected])) as Vec);
    return {
      ra,
      rb,
      baby: [toPct(ra.temperament), toPct(rb.temperament)] as const,
      now: [toPct(ra.now), toPct(rb.now)] as const,
      future: [fut(ra), fut(rb)] as const,
    };
  }, [ans]);

  if (ans === undefined)
    return (
      <div className="grid place-items-center pt-32 text-[var(--color-muted)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
        <p className="mt-4">Aligning two universes…</p>
      </div>
    );
  if (!ans || !data)
    return (
      <div className="pt-20 text-center">
        <p>We couldn&apos;t find one of those personalityverses.</p>
        <Link href="/quiz" className="btn btn-primary mt-4">Map your own</Link>
      </div>
    );

  const simBaby = similarity(data.baby[0], data.baby[1]);
  const simNow = similarity(data.now[0], data.now[1]);
  const simFut = similarity(data.future[0], data.future[1]);
  const trend = simNow - simBaby;
  const avgChange = (r: typeof data.ra) => r.future.reduce((s, f) => s + f.pChange, 0) / 5;
  const [ca, cb] = [avgChange(data.ra), avgChange(data.rb)];
  const shown = data[view];
  const colors = ["#f472b6", "#38bdf8"];

  return (
    <div className="pt-10">
      <p className="text-sm text-violet-300">Two personalityverses</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold sm:text-5xl">
        {names[0]} <span className="gradient-text">×</span> {names[1]}
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        {data.ra.temperamentType.label.replace(/ \(.*\)/, "")} baby meets {data.rb.temperamentType.label.replace(/ \(.*\)/, "").toLowerCase()} baby.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { k: simBaby, l: "alike as babies" },
          { k: simNow, l: "alike today" },
          { k: simFut, l: `alike by ${Math.max(ans[0].horizon, ans[1].horizon)} (expected)` },
        ].map((x) => (
          <div key={x.l} className="card p-5">
            <div className="font-[family-name:var(--font-display)] text-4xl font-bold">
              <CountUp value={x.k} suffix="%" />
            </div>
            <p className="text-sm text-[var(--color-muted)]">{x.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm">
        {Math.abs(trend) < 3
          ? "You've stayed about as alike as you started."
          : trend > 0
            ? `You've grown ${trend} points more alike since you were babies. Life pulled you together.`
            : `You've drifted ${-trend} points apart since you were babies. Different worlds, different people.`}{" "}
        {simFut > simNow ? "The model expects you to converge further, as maturation pulls most people in the same direction." : ""}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Reveal className="card p-5">
          <div className="flex justify-center">
            <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
              {(["baby", "now", "future"] as View[]).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1 ${view === v ? "bg-violet-500/40" : ""}`}>
                  {v === "baby" ? "as babies" : v === "now" ? "today" : "expected future"}
                </button>
              ))}
            </div>
          </div>
          <Radar
            series={[
              { label: names[0], color: colors[0], values: shown[0] },
              { label: names[1], color: colors[1], values: shown[1] },
            ]}
          />
          <Legend
            series={[
              { label: names[0], color: colors[0], values: shown[0] },
              { label: names[1], color: colors[1], values: shown[1] },
            ]}
          />
        </Reveal>
        <Reveal className="card p-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Trait by trait</h3>
          <div className="mt-4 space-y-4">
            {TRAITS.map((t) => {
              const fa = data.ra.future.find((f) => f.trait === t)!;
              const fb = data.rb.future.find((f) => f.trait === t)!;
              return (
                <div key={t}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      likelier to change: <b className="text-white">{fa.pChange > fb.pChange ? names[0] : names[1]}</b> ({Math.round(Math.max(fa.pChange, fb.pChange) * 100)}%)
                    </span>
                  </div>
                  <div className="relative mt-2 h-2 rounded-full bg-white/5">
                    {[0, 1].map((k) => (
                      <div
                        key={k}
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0a1a] transition-all duration-500"
                        style={{ left: `${shown[k][t]}%`, background: colors[k] }}
                        title={`${names[k]}: ${shown[k][t]}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Overall, <b className="text-white">{ca > cb ? names[0] : names[1]}</b> {ca > cb ? (names[0] === "You" ? "are" : "is") : names[1] === "You" ? "are" : "is"} the
            likelier to change ({Math.round(Math.max(ca, cb) * 100)}% vs {Math.round(Math.min(ca, cb) * 100)}% average per trait).
          </p>
        </Reveal>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/r/${idA}`} className="btn btn-ghost">{possessive(names[0])} full results</Link>
        <Link href={`/r/${idB}`} className="btn btn-ghost">{possessive(names[1])} full results</Link>
        <Link href={`/quiz?compare=${idB}`} className="btn btn-primary">Invite someone else</Link>
      </div>
      <p className="mt-6 text-xs text-[var(--color-muted)]">
        Similarity is the distance between Big Five profiles on a 0–100 scale. A fun comparison, not a compatibility test.
      </p>
    </div>
  );
}
