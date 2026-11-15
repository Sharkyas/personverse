import { describe, it, expect } from "vitest";
import { OEJTS_ITEMS, type Oejts } from "@/lib/oejts";
import { mbtiLetters, mbtiJourney } from "@/lib/mbti";
import { buildReport } from "@/lib/model";
import { sanitizeAnswers } from "@/lib/questions";
import { universeOutcome, UNIVERSES } from "@/lib/universes";

// Someone whose Big Five lean slightly extraverted, but whose direct answers are firmly introverted.
const introvert: Oejts = Object.fromEntries(OEJTS_ITEMS.filter((it) => it.dim === "EI").map((it) => [it.id, it.sign > 0 ? 5 : 1]));
const answers = sanitizeAnswers({ age: 19, horizon: 35, oejts: introvert });
const base = buildReport(answers);
const report = { ...base, now: { ...base.now, E: 0.35 }, oejts: introvert };

describe("direct type answers carry into forecasts", () => {
  it("the Big Five alone would say E, the direct answers say I", () => {
    expect(mbtiLetters(report.now, undefined)[0].letter).toBe("E");
    expect(mbtiLetters(report.now, undefined, introvert)[0].letter).toBe("I");
  });

  it("the journey's 'you now' matches the letter odds on the type card", () => {
    const pI = mbtiLetters(report.now, report.detailed ? report.rel : undefined, introvert)[0];
    const j = mbtiJourney(report as typeof base, 4000);
    const shareI = j.now.filter((t) => t.type[0] === "I").reduce((s, t) => s + t.p, 0);
    expect(Math.abs(shareI - (pI.letter === "I" ? pI.p : 1 - pI.p))).toBeLessThan(0.03);
    const laterI = j.later.filter((t) => t.type[0] === "I").reduce((s, t) => s + t.p, 0);
    expect(laterI).toBeGreaterThan(0.6);
  });

  it("every universe keeps the introvert letter", () => {
    for (const u of UNIVERSES) expect(universeOutcome(answers, report as typeof base, u).type.type[0]).toBe("I");
  });
});
