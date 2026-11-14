import { describe, expect, it } from "vitest";
import { accuracySummary } from "./accuracySummary";

describe("accuracySummary", () => {
  const s = accuracySummary();
  it("covers all five traits with calibration points inside 0..1", () => {
    expect(s.traits).toHaveLength(5);
    for (const t of s.traits) {
      expect(t.calibration.length).toBeGreaterThan(4);
      for (const p of t.calibration) {
        expect(p.predicted).toBeGreaterThanOrEqual(0);
        expect(p.predicted).toBeLessThanOrEqual(1);
        expect(p.observed).toBeGreaterThanOrEqual(0);
        expect(p.observed).toBeLessThanOrEqual(1);
      }
    }
  });
  it("averages sit between the per-trait extremes", () => {
    const aucs = s.traits.map((t) => t.auc);
    expect(s.auc).toBeGreaterThanOrEqual(Math.min(...aucs));
    expect(s.auc).toBeLessThanOrEqual(Math.max(...aucs));
    expect(s.nTrain + s.nTest).toBe(s.nTotal);
  });
});
