"use client";

export const SEVEN = ["Disagree strongly", "Disagree", "Disagree a little", "Neutral", "Agree a little", "Agree", "Agree strongly"];

/** Row of numbered buttons for a Likert item. */
export function Scale({ n, value, onChange, labels }: { n: number; value: number; onChange: (v: number) => void; labels: string[] }) {
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
            className="opt h-12 text-sm font-semibold tabular-nums"
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[var(--color-muted)]">
        <span>{labels[0]}</span>
        <span className="font-medium text-[#f4f3fb]" aria-live="polite">{labels[value - 1]}</span>
        <span>{labels[n - 1]}</span>
      </div>
    </div>
  );
}

/** Labelled stops you tap: replaces a slider where every point has a meaning. Arrow keys move between stops. */
export function Stops({ value, onChange, labels, label }: { value: number; onChange: (v: number) => void; labels: string[]; label: string }) {
  return (
    <div
      className="mt-3 grid gap-1.5 max-sm:grid-cols-1"
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") (e.preventDefault(), onChange(Math.min(labels.length, value + 1)));
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") (e.preventDefault(), onChange(Math.max(1, value - 1)));
      }}
    >
      {labels.map((l, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i + 1}
          tabIndex={value === i + 1 ? 0 : -1}
          onClick={() => onChange(i + 1)}
          className="opt min-h-12 px-2 py-2.5 text-[13px] leading-tight max-sm:px-4 max-sm:text-left max-sm:text-[15px]"
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** A number with big − / + buttons and quick picks; still typeable. */
export function Stepper({ value, onChange, min, max, label, suffix, picks }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string; suffix?: string; picks?: { v: number; label: string }[] }) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v))));
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button type="button" className="opt h-12 w-12 text-xl" aria-label={`Decrease ${label}`} onClick={() => set(value - 1)} disabled={value <= min}>
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          className="field h-12 w-24 text-center text-lg font-semibold tabular-nums"
          min={min}
          max={max}
          value={value}
          onChange={(e) => e.target.value !== "" && set(+e.target.value)}
        />
        <button type="button" className="opt h-12 w-12 text-xl" aria-label={`Increase ${label}`} onClick={() => set(value + 1)} disabled={value >= max}>
          +
        </button>
        {suffix && <span className="text-sm text-[var(--color-muted)]">{suffix}</span>}
      </div>
      {picks && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {picks.map((p) => (
            <button key={p.v} type="button" aria-pressed={value === p.v} onClick={() => set(p.v)} className="opt rounded-full px-3 py-1.5 text-xs">
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
