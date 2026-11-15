import { describe, it, expect } from "vitest";
import { IPIP_ITEMS, STEADY_ITEMS, DEFAULT_ANSWERS, sanitizeAnswers, type Answers } from "@/lib/questions";
import { ipipZ, steadyZ, blendN } from "@/lib/model";

const base = (n50: number, extra: number[] = []): Answers =>
  ({ ...DEFAULT_ANSWERS, inventory: "detailed", ipipScale: 7, ipip: [...IPIP_ITEMS.map((it) => (it.trait === "N" ? (it.reverse ? 8 - n50 : n50) : 4)), ...extra] }) as Answers;
const steady = (v: number) => STEADY_ITEMS.map((it) => (it.reverse ? 8 - v : v));

describe("extra Neuroticism statements", () => {
  it("change nothing when skipped", () => {
    const a = base(5);
    expect(ipipZ({ ...a, ipip: [...a.ipip!, ...STEADY_ITEMS.map(() => 0)] }).N).toBeCloseTo(ipipZ(a).N!, 10);
  });
  it("raise N for someone anxious under pressure but not moody", () => {
    expect(ipipZ(base(3, steady(6))).N!).toBeGreaterThan(ipipZ(base(3)).N! + 0.3);
  });
  it("lower N for someone calm under pressure", () => {
    expect(ipipZ(base(4, steady(2))).N!).toBeLessThan(ipipZ(base(4)).N!);
  });
  it("needs at least 5 answers", () => {
    expect(steadyZ([4, 4, 4, 4, 0, 0, 0, 0].map((v) => 1 + ((v - 1) * 2) / 3))).toBeNull();
  });
  it("keeps the blend on a unit scale", () => {
    expect(blendN(1, 1)).toBeGreaterThan(0.99);
    expect(blendN(1, 1)).toBeLessThan(1.1);
  });
  it("survive sanitize, and old 50-answer tests stay 50 long", () => {
    expect(sanitizeAnswers(base(4, steady(5))).ipip).toHaveLength(58);
    expect(sanitizeAnswers(base(4)).ipip).toHaveLength(50);
  });
});
