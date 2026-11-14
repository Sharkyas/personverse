"use client";
import { useState } from "react";
import { toPct, type Report, type Vec } from "@/lib/model";
import { LIFE_EVENTS } from "@/lib/params";
import type { Answers } from "@/lib/questions";
import { Narrator } from "./Narrator";
import { futureSelfTemplate, type FutureSelfRequest } from "@/lib/futureSelfTemplate";

export function FutureSelf({ answers, report }: { answers: Answers; report: Report }) {
  const [note, setNote] = useState<{ text: string; source: string } | null>(null);
  const [loading, setLoading] = useState(false);
  async function get() {
    setLoading(true);
    const future = Object.fromEntries(report.future.map((f) => [f.trait, f.expected])) as Vec;
    const req: FutureSelfRequest = {
      name: answers.name,
      age: answers.age,
      horizon: answers.horizon,
      temperamentType: report.temperamentType.label,
      nowPct: toPct(report.now),
      futurePct: toPct(future),
      events: answers.events.map((e) => LIFE_EVENTS[e].label),
    };
    try {
      const r = await fetch("/api/future-self", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      if (!r.ok) throw new Error(String(r.status));
      setNote(await r.json());
    } catch {
      setNote({ text: futureSelfTemplate(req), source: "template" });
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="card relative overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-sky-300">Incoming transmission</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">A voice note from you, aged {answers.horizon}</h3>
          <p className="text-sm text-[var(--color-muted)]">Written from your most likely future, and spoken in a different voice.</p>
        </div>
        {!note && (
          <button onClick={get} disabled={loading} className="btn btn-primary">
            {loading ? "Tuning in…" : "Receive it"}
          </button>
        )}
      </div>
      {note && (
        <div className="mt-5 fadeup">
          <blockquote className="border-l-2 border-sky-400/60 pl-4 text-[15px] italic leading-relaxed">&ldquo;{note.text}&rdquo;</blockquote>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Narrator text={note.text} label="Play voice note" voice="future" />
            <button onClick={get} className="text-xs text-[var(--color-muted)] underline decoration-dotted">another one</button>
          </div>
          <p className="mt-3 text-[11px] text-[var(--color-muted)]">One plausible future from the model&apos;s expected profile. It&apos;s a story, not a prophecy.</p>
        </div>
      )}
    </div>
  );
}
