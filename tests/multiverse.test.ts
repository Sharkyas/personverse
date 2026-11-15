import { describe, it, expect } from "vitest";
import { buildReport } from "@/lib/model";
import { sanitizeAnswers } from "@/lib/questions";
import { allOutcomes, pickType, MIN_SHARE_OF_TOP } from "@/lib/universes";

const answers = sanitizeAnswers({ age: 19, horizon: 35 });
const base = buildReport(answers);
const profiles = {
  organised: { O: 0.05, C: 1.34, E: 0.23, A: -0.03, N: -0.8 },
  intp: { O: 1.2, C: -0.8, E: -0.9, A: -0.6, N: 0.3 },
  esfj: { O: -0.5, C: 0.8, E: 1.0, A: 1.1, N: 0.2 },
  average: { O: 0, C: 0, E: 0, A: 0, N: 0 },
};

describe("the multiverse shows what each world does to you", () => {
  it("your own universe shows your likeliest type", () => {
    for (const z of Object.values(profiles)) {
      const o = allOutcomes(answers, { ...base, now: z });
      const you = o.find((x) => x.universe.id === "you")!;
      expect(you.type.type).toBe(you.likeliest.type);
    }
  });

  it("different worlds give several types, and different people get different ones", () => {
    const sets = Object.values(profiles).map((z) => allOutcomes(answers, { ...base, now: z }).map((x) => x.type.type));
    for (const s of sets) expect(new Set(s).size).toBeGreaterThanOrEqual(3);
    expect(new Set(sets.map((s) => s.join(","))).size).toBe(sets.length);
  });

  it("never shows a type far less likely than the likeliest one", () => {
    for (const z of Object.values(profiles))
      for (const o of allOutcomes(answers, { ...base, now: z })) expect(o.type.p).toBeGreaterThanOrEqual(MIN_SHARE_OF_TOP * o.likeliest.p - 1e-9);
  });

  it("keeps the likeliest type when no other type is clearly lifted", () => {
    const here = [{ type: "ESTJ", p: 0.2 }, { type: "ENTJ", p: 0.15 }];
    expect(pickType(here, [{ type: "ESTJ", p: 0.2 }, { type: "ENTJ", p: 0.14 }], false).pick.type).toBe("ESTJ");
    expect(pickType(here, [{ type: "ESTJ", p: 0.2 }, { type: "ENTJ", p: 0.08 }], false).pick.type).toBe("ENTJ");
  });
});
