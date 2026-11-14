import { describe, it, expect } from "vitest";
import { IPIP_ITEMS, onFive, ipipOnFive, sanitizeAnswers, DEFAULT_ANSWERS, type Answers } from "@/lib/questions";
import { ipipZ } from "@/lib/model";
import { answerQuality } from "@/lib/quality";

const five = (v: number) => ({ ...DEFAULT_ANSWERS, inventory: "detailed", ipip: IPIP_ITEMS.map(() => v) }) as Answers;
const seven = (v: number) => ({ ...five(v), ipip: IPIP_ITEMS.map(() => v), ipipScale: 7 }) as Answers;

describe("7-point answers", () => {
  it("map the ends and the middle onto the 1-5 norms", () => {
    expect([1, 4, 7].map((v) => onFive(v, 7))).toEqual([1, 3, 5]);
    expect(onFive(0, 7)).toBe(0);
    expect(onFive(4)).toBe(4);
  });

  it("score the same as the matching 5-point answers", () => {
    const mixed5 = IPIP_ITEMS.map((_, i) => [1, 3, 5, 2, 4][i % 5]);
    const mixed7 = mixed5.map((v) => 1 + (v - 1) * 1.5);
    const z5 = ipipZ({ ...five(3), ipip: mixed5 });
    const z7 = ipipZ({ ...seven(4), ipip: mixed7 });
    for (const t of Object.keys(z5) as (keyof typeof z5)[]) expect(z7[t]).toBeCloseTo(z5[t]!, 10);
  });

  it("keep the scale through sanitising, and older profiles stay on 5", () => {
    const s = sanitizeAnswers({ ...seven(7) });
    expect(s.ipipScale).toBe(7);
    expect(s.ipip![0]).toBe(7);
    const old = sanitizeAnswers({ ...five(5), ipip: IPIP_ITEMS.map(() => 7) });
    expect(old.ipipScale).toBeUndefined();
    expect(old.ipip![0]).toBe(5);
  });

  it("still flag straight-lining on the 7-point scale", () => {
    expect(answerQuality(ipipOnFive(seven(6))).ok).toBe(false);
  });
});
