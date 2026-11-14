/** DurHack 2026 branding: text badges only, no third-party logos. */

export const ENTERED_IN: { org: string; track: string }[] = [
  { org: "Marshall Wace", track: "New Worlds" },
  { org: "DurHack", track: "Combinations" },
  { org: "MLH", track: "Best Use of Gemini API" },
  { org: "MLH", track: "Best Use of ElevenLabs" },
  { org: "MLH", track: "Best Use of MongoDB Atlas" },
  { org: "MLH", track: "Best Use of Vultr" },
  { org: "MLH", track: "Best Use of Tiger Data" },
  { org: "DEV", track: "Write-up" },
];

export function DurHackBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`chip ${className}`}>
      <span className="chip-dot" aria-hidden="true" />
      <span>
        Built at <b className="font-semibold text-white">DurHack 2026</b>
      </span>
    </span>
  );
}

export function EnteredIn({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "card p-6 sm:p-8"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="kicker">
          <span aria-hidden="true" className="h-px w-6 bg-violet-300/60" />
          DurHack 2026 · Entered in
        </h2>
        {!compact && <p className="text-xs text-[var(--color-muted)]">A hackathon entry, built in one weekend at Durham University.</p>}
      </div>
      <ul className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-5"}`}>
        {ENTERED_IN.map((e) => (
          <li key={e.org + e.track} className="chip !whitespace-normal">
            <span className="font-semibold text-white">{e.org}</span>
            <span aria-hidden="true" className="h-3 w-px bg-white/20" />
            <span>{e.track}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
