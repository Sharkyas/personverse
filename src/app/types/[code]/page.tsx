import Link from "next/link";
import { notFound } from "next/navigation";
import { MBTI_TYPES, MBTI_PEOPLE, MBTI_PREVALENCE_UK, MBTI_SOURCES, MBTI_GROWTH_CAVEAT, MBTI_DIM_MODEL } from "@/lib/mbti";
import { SOURCES, TRAIT_META, type Trait } from "@/lib/params";

const WORD: Record<string, string> = { E: "Extraverted", I: "Introverted", S: "Sensing", N: "Intuitive", T: "Thinking", F: "Feeling", J: "Judging", P: "Perceiving" };
const BADGE = { "self-reported": "said so themselves", "strong consensus": "popular typing", disputed: "disputed typing" } as const;

function shortCite(full: string) {
  const authors = full.split(" (")[0];
  const names = authors.match(/[A-Z][A-Za-zÀ-ÿ'-]+(?=, [A-Z]\.)/g) ?? [authors];
  const year = full.match(/\((\d{4})\)/)?.[1] ?? "";
  const who = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names[0]} et al.`;
  return year ? `${who} (${year})` : who;
}

export function generateStaticParams() {
  return Object.keys(MBTI_TYPES).map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = MBTI_TYPES[code.toUpperCase()];
  return t ? { title: `${code.toUpperCase()}, ${t.nickname} · Personalityverse`, description: t.line } : {};
}

export default async function TypePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const info = MBTI_TYPES[code];
  if (!info) notFound();
  const people = MBTI_PEOPLE[code] ?? [];
  const rank = Object.entries(MBTI_PREVALENCE_UK)
    .sort((a, b) => b[1] - a[1])
    .findIndex(([k]) => k === code);
  const dims = Object.values(MBTI_DIM_MODEL);
  return (
    <div className="mx-auto max-w-4xl pt-12">
      <Link href="/types" className="text-sm text-[var(--color-muted)] hover:text-white">
        ← All 16 types
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold">
        <span className="gradient-text">{code}</span>
      </h1>
      <p className="mt-1 text-xl font-semibold">{info.nickname}</p>
      <p className="mt-3 max-w-2xl text-[var(--color-muted)]">{info.line}</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {MBTI_PREVALENCE_UK[code]}% of UK adults, the {rank === 0 ? "most" : `${rank + 1}${["st", "nd", "rd"][rank] ?? "th"} most`} common of 16.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {code.split("").map((l, i) => {
          const m = dims[i];
          const [trait, w] = (Object.entries(m.w) as [Trait, number][]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
          const high = (w > 0) === (l === m.second);
          return (
            <div key={i} className="card p-4">
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold">{l}</div>
              <div className="text-sm">{WORD[l]}</div>
              <div className="mt-2 text-xs text-[var(--color-muted)]">
                In Big Five terms: {high ? "higher" : "lower"} <span style={{ color: TRAIT_META[trait].color }}>{TRAIT_META[trait].name.toLowerCase()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Usual strengths</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {info.strengths.map((s) => (
              <span key={s} className="rounded-full border border-white/10 px-3 py-1 text-sm">
                {s}
              </span>
            ))}
          </div>
          <h2 className="mt-6 font-semibold">Famous {code}s</h2>
          <ul className="mt-2 space-y-1.5">
            {people.map((p) => (
              <li key={p.name} className="flex justify-between gap-2 text-sm">
                <span>
                  {p.name}
                  {p.field ? <span className="text-xs text-[var(--color-muted)]"> · {p.field}</span> : null}
                </span>
                <span className="text-xs text-[var(--color-muted)]">{BADGE[p.confidence]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--color-muted)]">Crowd typings from the Personality Database and sites that mirror it, unless marked otherwise. For fun.</p>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">How {code}s can grow</h2>
          <ul className="mt-3 space-y-4">
            {info.growth.map((g, i) => (
              <li key={i} className="text-sm">
                <span className="text-xs font-semibold" style={{ color: TRAIT_META[g.trait as Trait]?.color }}>
                  {TRAIT_META[g.trait as Trait]?.name} {g.direction === "up" ? "↑" : "↓"}
                </span>
                <p className="mt-1 text-[var(--color-muted)]">{g.text}</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">Source: {shortCite(SOURCES[g.src] ?? MBTI_SOURCES[g.src] ?? g.src)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-[var(--color-muted)]">{MBTI_GROWTH_CAVEAT}</p>
        </section>
      </div>

      <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="font-semibold">Are you an {code}, and could you become one?</p>
          <p className="text-sm text-[var(--color-muted)]">Take the test for your odds of each type: born, now and later.</p>
        </div>
        <Link href="/quiz" className="btn btn-primary">
          Take the test →
        </Link>
      </div>
    </div>
  );
}
