"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TEMPERAMENT_ITEMS,
  CONFIDENCE_OPTIONS,
  UPBRINGING_ITEMS,
  TIPI_ITEMS,
  FUTURE_EVENTS,
  DEFAULT_ANSWERS,
  DEMO_ANSWERS,
  PARENT_ITEMS,
  SURE_OPTIONS,
  EMPTY_PARENTS,
  type Answers,
} from "@/lib/questions";
import { LIFE_EVENTS } from "@/lib/params";

const STEPS = ["About you", "You now", "Growing up", "Your parents", "Baby you", "Your future"];
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
            aria-label={`${v}: ${labels[v - 1]}`}
            aria-pressed={value === v}
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
  const [a, setA] = useState<Answers>({ ...DEFAULT_ANSWERS, babyKnown: false, parents: EMPTY_PARENTS });
  const [saving, setSaving] = useState(false);
  const [compareWith, setCompareWith] = useState<string | null>(null);
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("compare");
    if (c && /^[a-z0-9]{6,32}$/i.test(c)) setCompareWith(c);
  }, []);
  const up = (patch: Partial<Answers>) => setA((p) => ({ ...p, ...patch }));

  async function finish(override?: Answers) {
    const a2 = override ?? a;
    setSaving(true);
    try {
      sessionStorage.setItem("pv-answers", JSON.stringify(a2));
    } catch {}
    try {
      const r = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a2) });
      const j = await r.json();
      if (j.id) {
        try {
          const mine = JSON.parse(localStorage.getItem("pv-mine") || "[]");
          localStorage.setItem("pv-mine", JSON.stringify([...mine, j.id].slice(-20)));
        } catch {}
        return router.push(compareWith ? `/compare/${compareWith}/${j.id}` : `/r/${j.id}`);
      }
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

      {compareWith && step === 0 && (
        <div className="card mb-4 border-sky-400/30 p-4 text-sm">
          <b className="text-sky-200">A friend invited you to compare.</b>{" "}
          <span className="text-[var(--color-muted)]">Finish the test and you&apos;ll see your two personalityverses side by side.</span>
        </div>
      )}
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
            <input aria-label="Age" type="range" min={16} max={70} value={a.age} onChange={(e) => up({ age: +e.target.value, horizon: Math.max(+e.target.value + 1, a.horizon) })} />
            <button onClick={() => finish({ ...DEMO_ANSWERS, name: a.name || undefined })} disabled={saving} className="mt-6 text-xs text-[var(--color-muted)] underline decoration-dotted hover:text-white">
              Just looking? Skip ahead with a sample profile
            </button>
          </section>
        )}

        {step === 4 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Baby you (age 0–5)</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Nobody remembers being a baby. We can work baby you out backwards from everything you&apos;ve told us, or you can add what your parents or carers told you.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="How to estimate baby you">
              {[
                { known: false, title: "Work it out backwards", sub: "From you now, how you grew up and your parents. Recommended." },
                { known: true, title: "I know some stories", sub: "Answer 12 quick questions about baby you as well." },
              ].map((o) => (
                <button
                  key={String(o.known)}
                  role="radio"
                  aria-checked={(a.babyKnown !== false) === o.known}
                  onClick={() => up({ babyKnown: o.known })}
                  className={`rounded-xl border p-3 text-left transition ${(a.babyKnown !== false) === o.known ? "border-violet-400 bg-violet-500/20" : "border-white/10 bg-white/[.03] hover:bg-white/5"}`}
                >
                  <div className="text-sm font-semibold">{o.title}</div>
                  <div className="text-xs text-[var(--color-muted)]">{o.sub}</div>
                </button>
              ))}
            </div>
            {a.babyKnown !== false && (
            <div className="mt-6 space-y-6">
              <p className="text-xs text-[var(--color-muted)]">Based on the temperament dimensions studied by Rothbart and by Thomas &amp; Chess.</p>
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
            )}
          </section>
        )}

        {step === 3 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Your parents</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Personality is partly inherited, so your parents&apos; traits are a clue to baby you. Compared with other adults, how would you describe them? Tap &ldquo;Not sure&rdquo; for
              anything you can&apos;t answer. Carers, step-parents and anyone who raised you count too, though only birth parents share your genes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {(a.parents ?? EMPTY_PARENTS).map((p, pi) => {
                const setP = (patch: Partial<typeof p>) => {
                  const ps = [...(a.parents ?? EMPTY_PARENTS)];
                  ps[pi] = { ...p, ...patch };
                  up({ parents: ps });
                };
                return (
                  <div key={pi} className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
                    <h3 className="font-semibold">{pi === 0 ? "Parent or carer 1" : "Parent or carer 2"}</h3>
                    <div className="mt-3 space-y-4">
                      {PARENT_ITEMS.map((it) => {
                        const v = p.traits[it.trait] ?? null;
                        return (
                          <div key={it.trait}>
                            <p className="text-sm">{it.text}</p>
                            <div className="mt-1.5 grid grid-cols-6 gap-1" role="group" aria-label={`Parent ${pi + 1}: ${it.text}`}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  aria-label={`${n}: ${FIVE[n - 1]}`}
                                  aria-pressed={v === n}
                                  title={FIVE[n - 1]}
                                  onClick={() => setP({ traits: { ...p.traits, [it.trait]: n } })}
                                  className={`h-9 rounded-lg border text-sm font-semibold ${v === n ? "border-violet-400 bg-violet-500/30 text-white" : "border-white/10 bg-white/[.03] text-[var(--color-muted)] hover:bg-white/10"}`}
                                >
                                  {n}
                                </button>
                              ))}
                              <button
                                type="button"
                                aria-pressed={v === null}
                                onClick={() => setP({ traits: { ...p.traits, [it.trait]: null } })}
                                className={`h-9 rounded-lg border text-[11px] ${v === null ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-[var(--color-muted)] hover:bg-white/10"}`}
                              >
                                Not sure
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div>
                        <p className="text-sm">How sure are you about them?</p>
                        <div className="mt-1.5 grid grid-cols-3 gap-1">
                          {SURE_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              aria-pressed={p.sure === o.value}
                              onClick={() => setP({ sure: o.value })}
                              className={`rounded-lg border px-2 py-1.5 text-xs ${p.sure === o.value ? "border-violet-400 bg-violet-500/25" : "border-white/10 bg-white/[.03]"}`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] text-[var(--color-muted)]">1 = not at all, 5 = very much. One parent shares about half your genes, so each trait carries over at roughly r = .2.</p>
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
                    aria-label={it.text}
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

        {step === 1 && (
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

        {step === 5 && (
          <section className="card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Your future</h2>
            <label className="mt-4 block text-sm">
              Forecast to age <b>{a.horizon}</b> ({a.horizon - a.age} years from now)
            </label>
            <input aria-label="Forecast age" type="range" min={a.age + 1} max={80} value={a.horizon} onChange={(e) => up({ horizon: +e.target.value })} />
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
