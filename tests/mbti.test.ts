import { describe, it, expect } from "vitest";
import { mbtiLetters, mbtiTypes, closestType, MBTI_TYPES, MBTI_PEOPLE, MBTI_PREVALENCE_UK } from "@/lib/mbti";
import { CELEBS } from "@/lib/celebs";

const z0 = { O: 0, C: 0, E: 0, A: 0, N: 0 };
const zs = (o: Partial<typeof z0>) => ({ ...z0, ...o });

describe("MBTI layer", () => {
  it("has guidance and at least 3 public figures for all 16 types", () => {
    expect(Object.keys(MBTI_TYPES)).toHaveLength(16);
    for (const t of Object.keys(MBTI_TYPES)) {
      expect(MBTI_PEOPLE[t]?.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(MBTI_TYPES[t].growth.length).toBeGreaterThanOrEqual(2);
    }
    const total = Object.values(MBTI_PREVALENCE_UK).reduce((s, v) => s + v, 0);
    expect(Math.abs(total - 100)).toBeLessThan(1);
  });

  it("type probabilities sum to 1 and an average adult lands on a common type", () => {
    const types = mbtiTypes(z0);
    expect(types.reduce((s, x) => s + x.p, 0)).toBeCloseTo(1, 9);
    expect(MBTI_PREVALENCE_UK[types[0].type]).toBeGreaterThan(10); // ESFJ / ISTJ / ISFJ territory
  });

  it("maps each letter to the Big Five trait it tracks", () => {
    const L = (z: typeof z0, dim: string) => mbtiLetters(z).find((l) => l.dim === dim)!.letter;
    expect(L(zs({ E: 2 }), "EI")).toBe("E");
    expect(L(zs({ E: -2 }), "EI")).toBe("I");
    expect(L(zs({ O: 2 }), "SN")).toBe("N");
    expect(L(zs({ A: 2 }), "TF")).toBe("F");
    expect(L(zs({ A: -2 }), "TF")).toBe("T");
    expect(L(zs({ C: 2 }), "JP")).toBe("J");
    expect(L(zs({ C: -2, O: 1 }), "JP")).toBe("P");
    expect(closestType({ O: 2, C: 1.5, E: -1.5, A: -1.5, N: 0 }).type).toBe("INTJ");
  });

  it("labels every app celebrity with a sourced typing or says there isn't one", () => {
    for (const c of CELEBS) expect(c.typing_label).toMatch(/^([EI][SN][TF][JP] \((popular typing(, disputed)?|self-reported)\)|No consistent MBTI typing)$/);
  });
});
