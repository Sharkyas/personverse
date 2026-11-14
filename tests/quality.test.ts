import { describe, it, expect } from "vitest";
import { answerQuality } from "@/lib/quality";
import { IPIP_ITEMS } from "@/lib/questions";

describe("careless-responding checks", () => {
  it("flags straight-lining", () => {
    expect(answerQuality(Array(50).fill(3)).ok).toBe(false);
  });
  it("flags yes-saying to both a statement and its opposite", () => {
    const r = answerQuality(IPIP_ITEMS.map((_, i) => (i % 2 ? 5 : 4)));
    expect(r.ok).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/opposites/);
  });
  it("passes a consistent, varied person", () => {
    const ans = IPIP_ITEMS.map((it, i) => {
      const lean = { E: 2, N: -1, A: 1, C: 1, O: 2 }[it.trait];
      return Math.max(1, Math.min(5, 3 + (it.reverse ? -lean : lean) + ((i * 7) % 3) - 1));
    });
    expect(answerQuality(ans).ok).toBe(true);
  });
  it("ignores short or partial answer sets", () => {
    expect(answerQuality(Array(10).fill(3)).ok).toBe(true);
  });
});
