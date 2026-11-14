"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Results } from "@/components/Results";
import type { Answers } from "@/lib/questions";

export default function SharedResults({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [a, setA] = useState<Answers | null | undefined>(undefined);
  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return setA(null);
        let name: string | undefined;
        try {
          const local = JSON.parse(sessionStorage.getItem("pv-answers") || "null");
          name = local?.name;
        } catch {}
        setA({ ...j.answers, name });
      })
      .catch(() => setA(null));
  }, [id]);
  if (a === undefined)
    return (
      <div className="grid min-h-[100svh] content-start justify-items-center pt-32 text-[var(--color-muted)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
        <p className="mt-4">Opening the multiverse…</p>
      </div>
    );
  if (!a)
    return (
      <div className="pt-20 text-center">
        <p>We couldn&apos;t find that personalityverse.</p>
        <Link href="/quiz" className="btn btn-primary mt-4">Map your own</Link>
      </div>
    );
  return <Results answers={a} id={id} />;
}
