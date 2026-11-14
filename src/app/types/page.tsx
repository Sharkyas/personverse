import Link from "next/link";
import { MBTI_TYPES, MBTI_PEOPLE, MBTI_PREVALENCE_UK, MBTI_RETEST } from "@/lib/mbti";

export const metadata = { title: "The 16 types · Personalityverse", description: "All 16 MBTI types: what they're like, how common they are in the UK, how to grow, and the public figures popularly typed as each." };

const GROUPS: { name: string; blurb: string; types: string[] }[] = [
  { name: "Analysts", blurb: "Intuitive and Thinking: ideas, systems, strategy.", types: ["INTJ", "INTP", "ENTJ", "ENTP"] },
  { name: "Diplomats", blurb: "Intuitive and Feeling: values, people, meaning.", types: ["INFJ", "INFP", "ENFJ", "ENFP"] },
  { name: "Sentinels", blurb: "Sensing and Judging: reliability, duty, order.", types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"] },
  { name: "Explorers", blurb: "Sensing and Perceiving: action, craft, the moment.", types: ["ISTP", "ISFP", "ESTP", "ESFP"] },
];

export default function Types() {
  return (
    <div className="mx-auto max-w-5xl pt-12">
      <p className="kicker"><span aria-hidden="true" className="h-px w-6 bg-accent-300/60" />Myers-Briggs, honestly</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] sm:text-6xl">The 16 types</h1>
      <p className="mt-5 max-w-3xl leading-relaxed text-[var(--color-muted)]">
        Every type, how common it is in the UK, its usual strengths, how it can grow, and who gets typed as it. Personalityverse works out your closest type from your Big Five
        scores, with odds for each letter. Treat types as a fun shorthand: on retest, only {MBTI_RETEST.same_4_letters}% of people keep all four letters.
      </p>
      <Link href="/quiz" className="btn btn-primary mt-7 inline-flex">
        Find my type and how it could change →
      </Link>
      {GROUPS.map((g) => (
        <section key={g.name} className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">{g.name}</h2>
          <p className="text-sm text-[var(--color-muted)]">{g.blurb}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {g.types.map((t) => {
              const info = MBTI_TYPES[t];
              return (
                <Link key={t} href={`/types/${t}`} className="card block h-full p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent-300/50">
                  <div className="flex items-baseline justify-between">
                    <span className="font-[family-name:var(--font-display)] text-2xl font-semibold gradient-text">{t}</span>
                    <span className="text-xs text-[var(--color-muted)]">{MBTI_PREVALENCE_UK[t]}% of UK</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{info.nickname}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{info.line}</p>
                  <p className="mt-3 text-[11px] text-[var(--color-muted)]">
                    {(MBTI_PEOPLE[t] ?? [])
                      .slice(0, 3)
                      .map((p) => p.name)
                      .join(" · ")}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <p className="mt-12 text-xs text-[var(--color-muted)]">
        UK figures come from a general population sample of 1,634 people. Public figures are crowd typings unless marked as self-reported. See{" "}
        <Link href="/science" className="underline">
          the science
        </Link>{" "}
        for how we map the Big Five to MBTI and why we treat it as a bonus layer.
      </p>
    </div>
  );
}
