import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg pt-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">This universe doesn&apos;t exist (yet).</h1>
      <div className="mt-6 flex justify-center gap-3">
        <Link className="btn btn-primary" href="/quiz">Map your own</Link>
        <Link className="btn btn-ghost" href="/">Home</Link>
      </div>
    </div>
  );
}
