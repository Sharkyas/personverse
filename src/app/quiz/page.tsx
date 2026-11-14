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
import { Scale, SEVEN } from "@/components/Scale";

const STEPS = ["About you", "You now", "Growing up", "Your parents", "Baby you", "Your future"];
const FIVE = ["Not at all", "A little", "Somewhat", "Quite", "Very much"];


export default function Quiz() {
  const router = useRouter();
  const [step, setStepRaw] = useState(0);
  const [dir, setDir] = useState<"next" | "back">("next");
  const setStep = (n: number) => {
    setDir(n >= step ? "next" : "back");
    setStepRaw(n);
  };
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
      window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else finish();
  };

  return (
    <div className="mx-auto max-w-2xl pt-8 sm:pt-12">
      <div className="mb-7">
        <div className="flex items-baseline justify-between gap-3">
          <p className="kicker" aria-live="polite">
            Step {step + 1} of {STEPS.length}
          </p>
          <p className="font-mono text-xs tabular-nums text-[var(--color-muted)]">{Math.round(((step + 1) / STEPS.length) * 100)}%</p>
        </div>
        <ol className="mt-3 grid grid-cols-6 gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={`group block w-full pt-1 text-left ${i < step ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="block h-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full origin-left rounded-full bg-gradient-to-r from-violet-400 to-pink-400 transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
                  />
                </span>
                <span
                  className={`mt-2 block truncate text-[10px] transition-colors sm:text-xs ${i === step ? "font-medium text-white" : i < step ? "text-violet-200 group-hover:text-white" : "text-[var(--color-muted)]"}`}
                >
                  {s}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {compareWith && step === 0 && (
        <div className="card mb-4 border-sky-400/30 p-4 text-sm">
          <b className="text-sky-200">A friend invited you to compare.</b>{" "}
          <span className="text-[var(--color-muted)]">Finish the test and you&apos;ll see your two personalityverses side by side.</span>
        </div>
      )}
      <div key={step} className={dir === "back" ? "step-back" : "step-next"}>
        {step === 0 && (
          <section className="card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">Let&apos;s start with you</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Your first name is only used to personalise the narration. It&apos;s never stored.</p>
            <label htmlFor="first-name" className="mt-6 block text-sm font-medium">First name (optional)</label>
            <input
              value={a.name ?? ""}
              onChange={(e) => up({ name: e.target.value.slice(0, 30) })}
              id="first-name"
              className="field mt-2"
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
          <section className="card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">Baby you (age 0–5)</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
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
                  className="opt p-4 text-left"
                >
                  <div className="text-sm font-semibold text-white">{o.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">{o.sub}</div>
                </button>
              ))}
            </div>
            {a.babyKnown !== false && (
            <div className="mt-6 space-y-6">
              <p className="text-xs text-[var(--color-muted)]">Based on the temperament dimensions studied by Rothbart and by Thomas &amp; Chess.</p>
              {TEMPERAMENT_ITEMS.map((it) => (
                <div key={it.id}>
                  <p className="text-[15px] font-medium leading-snug">{it.text}</p>
                  <p className="text-[11px] uppercase tracking-wider text-violet-300/70">{it.dimension}</p>
                  <Scale n={5} labels={FIVE} value={a.temperament[it.id]} onChange={(v) => up({ temperament: { ...a.temperament, [it.id]: v } })} />
                </div>
              ))}
              <div>
                <p className="text-[15px] font-medium leading-snug">How sure are you about these answers?</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {CONFIDENCE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => up({ confidence: o.value })}
                      type="button"
                      aria-pressed={a.confidence === o.value}
                      className="opt px-3 py-2.5 text-sm"
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
          <section className="card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">Your parents</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
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
                  <div key={pi} className="rounded-2xl border border-white/[.09] bg-white/[.02] p-4 sm:p-5">
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
                                  className="opt h-10 !rounded-[10px] text-sm font-semibold tabular-nums"
                                >
                                  {n}
                                </button>
                              ))}
                              <button
                                type="button"
                                aria-pressed={v === null}
                                onClick={() => setP({ traits: { ...p.traits, [it.trait]: null } })}
                                className="opt opt-quiet h-10 !rounded-[10px] text-[11px] leading-tight"
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
                              className="opt !rounded-[10px] px-2 py-2 text-xs"
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
          <section className="card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">Growing up</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Rough answers are fine. Skip anything you&apos;d rather not think about by leaving it in the middle.</p>
            <div className="mt-7 space-y-8">
              {UPBRINGING_ITEMS.map((it) => (
                <div key={it.id}>
                  <p className="text-[15px] font-medium leading-snug">{it.text}</p>
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
          <section className="card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">You now</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              The Ten-Item Personality Inventory (Gosling et al., 2003). &ldquo;I see myself as&hellip;&rdquo;
            </p>
            <div className="mt-7 space-y-8">
              {TIPI_ITEMS.map((it, i) => (
                <div key={i}>
                  <p className="text-[15px] font-medium leading-snug">{it.text}</p>
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
          <section className="card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">Your future</h2>
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
                    type="button"
                    aria-pressed={on}
                    className="opt p-4 text-left"
                  >
                    <div className="text-sm font-semibold text-white">{LIFE_EVENTS[e].label}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">{LIFE_EVENTS[e].blurb}</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
          <span aria-hidden="true">←</span> Back
        </button>
        <button className="btn btn-primary group !px-6 !py-3" onClick={next} disabled={saving}>
          {step === STEPS.length - 1 ? (saving ? "Mapping your multiverse…" : "Reveal my personalityverse") : "Next"}
          {!saving && (
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
