"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Tracker } from "@/components/Tracker";
import type { Answers } from "@/lib/questions";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<{ answers: Answers; createdAt: string } | null | undefined>(undefined);
  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setP(j ? { answers: j.answers, createdAt: j.createdAt } : null))
      .catch(() => setP(null));
  }, [id]);
  return (
    <div className="mx-auto max-w-5xl pt-12">
      <p className="text-[11px] uppercase tracking-wider text-violet-300/80">Trait tracker</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">Check yourself against your forecast</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        Your first result is the starting point. Every few weeks, answer the same ten questions again and see whether you are drifting the way the model expected, faster, or the other way.
      </p>
      <div className="mt-8">
        {p === undefined && <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />}
        {p === null && (
          <p>
            We couldn&apos;t find that result.{" "}
            <Link href="/quiz" className="underline">Take the test</Link> to start a tracker.
          </p>
        )}
        {p && <Tracker id={id} answers={p.answers} baseTime={p.createdAt} />}
      </div>
    </div>
  );
}
