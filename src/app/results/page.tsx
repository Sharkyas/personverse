"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Results } from "@/components/Results";
import type { Answers } from "@/lib/questions";

export default function LocalResults() {
  const [a, setA] = useState<Answers | null | undefined>(undefined);
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("pv-answers");
      setA(s ? JSON.parse(s) : null);
    } catch {
      setA(null);
    }
  }, []);
  if (a === undefined) return <div className="pt-20 text-center text-[var(--color-muted)]">Loading…</div>;
  if (!a)
    return (
      <div className="pt-20 text-center">
        <p>No results yet.</p>
        <Link href="/quiz" className="btn btn-primary mt-4">Take the test</Link>
      </div>
    );
  return <Results answers={a} />;
}
