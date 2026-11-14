"use client";
// "How we worked this out" panels, one per results chapter. Personalised where the numbers are cheap to show.
import { maturation, stabilityOver, type Report } from "@/lib/model";
import { HERITABILITY, LIFE_EVENTS, MEANINGFUL_CHANGE_SD, TRAITS, TRAIT_META } from "@/lib/params";
import { MBTI_DIM_MODEL, MBTI_RETEST, mbtiLetters } from "@/lib/mbti";
import type { Answers } from "@/lib/questions";
import type { ReactNode } from "react";

export type Chapter = "nature" | "future" | "multiverse" | "target" | "people" | "mbti";

function Panel({ children, title = "How we worked this out" }: { children: ReactNode; title?: string }) {
  return (
    <details className="deepdive mb-6">
      <summary>{title}</summary>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--color-muted)]">{children}</div>
    </details>
  );
}
const sd = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(2)} SD`;

export function DeepDive({ chapter, r, a }: { chapter: Chapter; r: Report; a: Answers }) {
  const years = Math.max(0.5, a.horizon - a.age);
  if (chapter === "nature")
    return (
      <Panel>
        <p>
          <b className="text-white">Genes, family and everything else.</b> Twin and adoption studies split adult traits into roughly 40% genes, close to 0% shared
          family environment and the rest unique experience plus measurement error. Our heritability figures:{" "}
          {TRAITS.map((t) => `${TRAIT_META[t].name} ${Math.round(HERITABILITY[t].h2 * 100)}%`).join(", ")}.
        </p>
        <p>
          <b className="text-white">Baby you.</b>{" "}
          {r.reverse
            ? "We never asked about your infancy. Baby temperament is treated as a hidden number per trait, and every answer is a noisy reading of it: you now (correlation about .25 after removing the predicted pull of your upbringing), each parent (half your genes, discounted by how sure you were) and any stories. Gaussian conditioning combines them into a most-likely value and an 80% range. In simulation, those ranges contain the truth 80% of the time."
            : "Your answers about infancy are scored on Rothbart's temperament factors and weighted by how confident you were. They are then cross-checked against you now and your parents with the same Gaussian conditioning we use when working backwards."}
        </p>
        <p>
          <b className="text-white">Upbringing.</b> Warmth, harshness, adversity, family resources and moves each nudge the predicted adult profile by small, sourced amounts. Because they overlap,
          their combined effect is capped at 0.6 SD per trait.
        </p>
      </Panel>
    );
  if (chapter === "future") {
    const rr = stabilityOver(a.age, years);
    const mat = maturation(a.age, a.horizon);
    return (
      <Panel>
        <p>
          <b className="text-white">Stability.</b> Over the {Math.round(years)} years from {a.age} to {a.horizon}, we put your rank-order stability at r = {rr.toFixed(2)}{" "}
          (Bleidorn et al., 2022, corrected for test reliability). That sets the spread of possible futures: SD of change = √(1 − r²) = {Math.sqrt(1 - rr * rr).toFixed(2)}.
        </p>
        <p>
          <b className="text-white">Expected change</b> = (r − 1) × where you are now (drift towards average) + normal maturation + your life events. Maturation for your ages:{" "}
          {TRAITS.map((t) => `${TRAIT_META[t].name} ${sd(mat[t])}`).join(", ")} (Roberts et al., 2006).
        </p>
        <p>
          <b className="text-white">A big shift</b> is moving at least {MEANINGFUL_CHANGE_SD} SD either way. That is roughly a decade of conscientiousness growth in your twenties, and big enough for
          friends to notice. A stricter reliable-change test would give about a third of these rates, so treat them as an upper bound.
        </p>
      </Panel>
    );
  }
  if (chapter === "multiverse")
    return (
      <Panel>
        <p>
          Each universe keeps baby you fixed and swaps either your upbringing answers or your life events. Then it reruns the same model. The hard-knocks universe sets every adversity dial to
          the maximum, which matches the significant-trauma group in a recent meta-analysis (g = .46 on neuroticism). The overlap cap keeps the combined pull at 0.6 SD.
        </p>
        <p>
          Life events are phased in over three years. Therapy or coaching uses the per-trait effects from 207 intervention studies (Roberts et al., 2017): neuroticism{" "}
          {sd(LIFE_EVENTS.therapy.d.N)}. Most other event sizes are our reading of the literature and are marked &ldquo;est.&rdquo; on the science page.
        </p>
      </Panel>
    );
  if (chapter === "target")
    return (
      <Panel>
        <p>
          <b className="text-white">Reaching a target</b> means ending within a quarter of an SD of it. Each strategy adds a push in the direction you need on top of normal drift and maturation:
          weekly challenges d ≈ {LIFE_EVENTS.practice.d.C.toFixed(2)} over 16 weeks (from the PEACH app trial; our estimate per trait), and coaching adds 60% of the therapy effect, because coaching is
          lighter than clinical therapy (our assumption).
        </p>
        <p>
          <b className="text-white">The plan</b> follows the behaviour-first finding: people who complete weekly behavioural challenges change, and people who accept challenges and fail them drift the
          other way (Hudson et al., 2019). So it starts small and uses if–then plans (Gollwitzer & Sheeran, 2006).
        </p>
      </Panel>
    );
  if (chapter === "people")
    return (
      <Panel>
        <p>
          Almost no public figure has taken a Big Five test, so each person&apos;s five scores are our estimate from their public persona and popular fan-site typings. The match is the
          distance between your five percentiles and theirs, rescaled to 0–100. Each MBTI label says how much to trust it, and only one person on the list has published their own type.
        </p>
      </Panel>
    );
  const L = mbtiLetters(r.now);
  return (
    <Panel>
      <p>
        We never measure MBTI. Each letter&apos;s probability comes from your Big Five: P = Φ((weighted traits − cut) ÷ residual SD), using McCrae & Costa&apos;s (1989) correlations shrunk for the
        TIPI&apos;s reliability, and cut-offs that reproduce the UK population split. Your letters:{" "}
        {L.map((l) => `${l.letter} ${Math.round(l.p * 100)}%`).join(", ")}. The residual SDs ({Object.values(MBTI_DIM_MODEL).map((m) => m.sd.toFixed(2)).join(", ")}) are the part of each scale the
        Big Five don&apos;t explain, which is why no type is ever close to certain.
      </p>
      <p>
        Born, now and later come from a 5,000-draw simulation over baby you, your forecast and that unexplained part. On the real test, only about {MBTI_RETEST.same_4_letters}% of UK adults got the
        same four letters again within {MBTI_RETEST.interval}.
      </p>
    </Panel>
  );
}

