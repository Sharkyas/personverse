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
            className={`opt h-11 text-sm font-semibold tabular-nums ${value === v ? "pop" : ""}`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[var(--color-muted)]">
        <span>{labels[0]}</span>
        <span key={value} className="fadeup font-medium text-violet-200">{labels[value - 1]}</span>
        <span>{labels[n - 1]}</span>
      </div>
    </div>
  );
}
