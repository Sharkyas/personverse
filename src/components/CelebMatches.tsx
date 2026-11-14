"use client";
import { nearestCelebs } from "@/lib/celebs";
import type { Vec } from "@/lib/model";
import { TRAITS, TRAIT_META } from "@/lib/params";

export function CelebRow({ title, profile }: { title: string; profile: Vec }) {
  const list = nearestCelebs(profile, 3);
  return (
    <div>
      <p className="mb-2 text-sm text-[var(--color-muted)]">{title}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {list.map((c) => (
          <div key={c.name} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs capitalize text-[var(--color-muted)]">
                  {c.field} · {c.typing_label}
                </div>
              </div>
              <div className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">{c.match}%</div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">{c.note}</p>
            <div className="mt-3 flex gap-1">
              {TRAITS.map((t) => (
                <div key={t} className="flex-1" title={`${TRAIT_META[t].name} ${c[t]}`}>
                  <div className="h-8 rounded bg-white/5 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full rounded" style={{ height: `${c[t]}%`, background: TRAIT_META[t].color, opacity: 0.7 }} />
                  </div>
                  <div className="mt-0.5 text-center text-[9px] text-[var(--color-muted)]">{t}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CelebMatches({ now, baby }: { now: Vec; baby: Vec }) {
  return (
    <div className="space-y-6">
      <CelebRow title="Closest to you now" profile={now} />
      <CelebRow title="Closest to baby you" profile={baby} />
    </div>
  );
}
