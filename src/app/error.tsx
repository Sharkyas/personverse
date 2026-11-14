"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg pt-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">A wormhole opened.</h1>
      <p className="mt-3 text-[var(--color-muted)]">Something went wrong on this page. Your answers are safe in this browser tab.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <Link className="btn btn-ghost" href="/results">My results</Link>
      </div>
    </div>
  );
}
