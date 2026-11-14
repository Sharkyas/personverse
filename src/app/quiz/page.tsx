"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TEMPERAMENT_ITEMS,
  CONFIDENCE_OPTIONS,
  UPBRINGING_ITEMS,
  TIPI_ITEMS,
  FUTURE_EVENTS,
  DEFAULT_ANSWERS,
  type Answers,
} from "@/lib/questions";
import { LIFE_EVENTS } from "@/lib/params";

const STEPS = ["About you", "Baby you", "Growing up", "You now", "Your future"];
const FIVE = ["Not at all", "A little", "Somewhat", "Quite", "Very much"];
const SEVEN = ["Disagree strongly", "Disagree", "Disagree a little", "Neutral", "Agree a little", "Agree", "Agree strongly"];

function Scale({ n, value, onChange, labels }: { n: number; value: number; onChange: (v: number) => void; labels: string[] }) {
  return (
    <div className="mt-3">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-label={labels[v - 1]}
            title={labels[v - 1]}
            className={`h-10 rounded-xl border text-sm font-semibold transition ${
              value === v ? "border-violet-400 bg-violet-500/30 text-white" : "border-white/10 bg-white/[.03] text-[var(--color-muted)] hover:bg-white/10"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--color-muted)]">
        <span>{labels[0]}</span>
        <span className="text-violet-200">{labels[value - 1]}</span>
        <span>{labels[n - 1]}</span>
      </div>
    </div>
  );
}

export default function Quiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(DEFAULT_ANSWERS);
  const [saving, setSaving] = useState(false);
  const up = (patch: Partial<Answers>) => setA((p) => ({ ...p, ...patch }));

  async function finish() {
    setSaving(true);
    try {
      sessionStorage.setItem("pv-answers", JSON.stringify(a));
    } catch {}
    try {
      const r = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      const j = await r.json();
      if (j.id) return router.push(`/r/${j.id}`);
    } catch {}
    router.push("/results");
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else finish();
  };

  return (
    <div className="mx-auto max-w-2xl pt-10">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-[var(--color-muted)]">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i < step && setStep(i)} className={i === step ? "text-white" : i < step ? "text-violet-300" : ""}>
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div key={step} className="fadeup">
        {step === 0 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Let&apos;s start with you</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Your first name is only used to personalise the narration. It&apos;s never stored.</p>
            <label className="mt-6 block text-sm">First name (optional)</label>
            <input
              value={a.name ?? ""}
              onChange={(e) => up({ name: e.target.value.slice(0, 30) })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-violet-400"
              placeholder="e.g. Sam"
            />
            <label className="mt-6 block text-sm">
              Age: <b>{a.age}</b>
            </label>
            <input type="range" min={16} max={70} value={a.age} onChange={(e) => up({ age: +e.target.value, horizon: Math.max(+e.target.value + 1, a.horizon) })} />
          </section>
        )}

        {step === 1 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Baby you (age 0–5)</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Answer from what your parents or carers told you. These are based on the temperament dimensions studied by Rothbart and by Thomas &amp; Chess.
            </p>
            <div className="mt-6 space-y-6">
              {TEMPERAMENT_ITEMS.map((it) => (
                <div key={it.id}>
                  <p className="text-[15px]">{it.text}</p>
                  <p className="text-[11px] uppercase tracking-wider text-violet-300/70">{it.dimension}</p>
                  <Scale n={5} labels={FIVE} value={a.temperament[it.id]} onChange={(v) => up({ temperament: { ...a.temperament, [it.id]: v } })} />
                </div>
              ))}
              <div>
                <p className="text-[15px]">How sure are you about these answers?</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {CONFIDENCE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => up({ confidence: o.value })}
                      className={`rounded-xl border px-3 py-2 text-sm ${a.confidence === o.value ? "border-violet-400 bg-violet-500/25" : "border-white/10 bg-white/[.03]"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Growing up</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Rough answers are fine. Skip anything you&apos;d rather not think about by leaving it in the middle.</p>
            <div className="mt-6 space-y-7">
              {UPBRINGING_ITEMS.map((it) => (
                <div key={it.id}>
                  <p className="text-[15px]">{it.text}</p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={a.upbringing[it.id]}
                    onChange={(e) => up({ upbringing: { ...a.upbringing, [it.id]: +e.target.value } })}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-[11px] text-[var(--color-muted)]">
                    <span>{it.low}</span>
                    <span>{it.high}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">You now</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              The Ten-Item Personality Inventory (Gosling et al., 2003). &ldquo;I see myself as&hellip;&rdquo;
            </p>
            <div className="mt-6 space-y-6">
              {TIPI_ITEMS.map((it, i) => (
                <div key={i}>
                  <p className="text-[15px]">{it.text}</p>
                  <Scale
                    n={7}
                    labels={SEVEN}
                    value={a.tipi[i]}
                    onChange={(v) => {
                      const t = [...a.tipi];
                      t[i] = v;
                      up({ tipi: t });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Your future</h2>
            <label className="mt-4 block text-sm">
              Forecast to age <b>{a.horizon}</b> ({a.horizon - a.age} years from now)
            </label>
            <input type="range" min={a.age + 1} max={80} value={a.horizon} onChange={(e) => up({ horizon: +e.target.value })} />
            <p className="mt-6 text-sm">Which of these do you expect before then? (You can change these on the results page.)</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {FUTURE_EVENTS.map((e) => {
                const on = a.events.includes(e);
                return (
                  <button
                    key={e}
                    onClick={() => up({ events: on ? a.events.filter((x) => x !== e) : [...a.events, e] })}
                    className={`rounded-xl border p-3 text-left transition ${on ? "border-violet-400 bg-violet-500/20" : "border-white/10 bg-white/[.03] hover:bg-white/5"}`}
                  >
                    <div className="text-sm font-semibold">{LIFE_EVENTS[e].label}</div>
                    <div className="text-xs text-[var(--color-muted)]">{LIFE_EVENTS[e].blurb}</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={next} disabled={saving}>
          {step === STEPS.length - 1 ? (saving ? "Mapping your multiverse…" : "Reveal my personalityverse ✦") : "Next →"}
        </button>
      </div>
    </div>
  );
}
