import { describe, it, expect } from "vitest";
import { OEJTS_ITEMS, directLean, sanitizeOejts, type Oejts } from "@/lib/oejts";
import { mbtiLetters, lettersToCheck, closestType } from "@/lib/mbti";
import { sanitizeAnswers } from "@/lib/questions";
import { IPIP_REL, type Vec } from "@/lib/model";

// The published OEJTS 1.2 key, verbatim: more than 24 means E, N, T and P.
const q = (a: Oejts, i: number) => a[`Q${i}`];
const published = (a: Oejts) => ({
  IE: 30 - q(a, 3) - q(a, 7) - q(a, 11) + q(a, 15) - q(a, 19) + q(a, 23) + q(a, 27) - q(a, 31),
  SN: 12 + q(a, 4) + q(a, 8) + q(a, 12) + q(a, 16) + q(a, 20) - q(a, 24) - q(a, 28) + q(a, 32),
  FT: 30 - q(a, 2) + q(a, 6) + q(a, 10) - q(a, 14) - q(a, 18) + q(a, 22) - q(a, 26) - q(a, 30),
  JP: 18 + q(a, 1) + q(a, 5) - q(a, 9) + q(a, 13) - q(a, 17) + q(a, 21) - q(a, 25) + q(a, 29),
});

describe("direct type questions (OEJTS 1.2)", () => {
  it("has 32 items, 8 per letter pair", () => {
    expect(OEJTS_ITEMS).toHaveLength(32);
    for (const d of ["EI", "SN", "TF", "JP"] as const) expect(OEJTS_ITEMS.filter((i) => i.dim === d)).toHaveLength(8);
  });

  it("scores exactly like the published key on random answer sheets", () => {
    let seed = 3;
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    for (let k = 0; k < 500; k++) {
      const a: Oejts = Object.fromEntries(OEJTS_ITEMS.map((it) => [it.id, 1 + Math.floor(rnd() * 5)]));
      const p = published(a);
      // our second letters are I, N, F, P
      expect(directLean(a, "EI").lean + 0).toBe(24 - p.IE);
      expect(directLean(a, "SN").lean + 0).toBe(p.SN - 24);
      expect(directLean(a, "TF").lean + 0).toBe(24 - p.FT);
      expect(directLean(a, "JP").lean + 0).toBe(p.JP - 24);
    }
  });

  it("sanitizes untrusted input", () => {
    expect(sanitizeOejts({ Q1: 4, Q2: "5", Q3: 9, Q99: 3, Q4: 0 })).toEqual({ Q1: 4, Q2: 5 });
    expect(sanitizeOejts("x")).toBeUndefined();
    expect(sanitizeAnswers({ oejts: { Q12: 5 } }).oejts).toEqual({ Q12: 5 });
  });

  const mid: Vec = { O: 0.9, C: -0.2, E: -1.4, A: -0.3, N: 0.2 }; // open (82nd percentile), clearly introverted: still only 68% S, so S/N gets checked
  const nAnswers: Oejts = Object.fromEntries(OEJTS_ITEMS.filter((i) => i.dim === "SN").map((i) => [i.id, i.sign > 0 ? 4 : 2]));

  it("always asks E/I and S/N, and T/F or J/P only when unsure", () => {
    const dims = lettersToCheck(mid, IPIP_REL);
    expect(dims).toContain("SN");
    expect(dims).toContain("EI");
    const sure = { ...mid, A: -2.5, C: 2.5 };
    const strict = lettersToCheck(sure, IPIP_REL);
    expect(strict).not.toContain("TF");
    expect(strict).not.toContain("JP");
  });

  it("lets direct answers outweigh a confident Big Five read on S/N but not on T/F", () => {
    const ans = (dim: string) => Object.fromEntries(OEJTS_ITEMS.filter((it) => it.dim === dim).map((it) => [it.id, it.sign > 0 ? 4 : 2]));
    const lowO = { ...mid, O: -1 };
    expect(mbtiLetters(lowO, IPIP_REL, ans("SN")).find((l) => l.dim === "SN")!.letter).toBe("N");
    const highA = { ...mid, A: 2 };
    expect(mbtiLetters(highA, IPIP_REL, ans("TF")).find((l) => l.dim === "TF")!.letter).toBe("F");
  });

  it("a steady lean on the direct items moves an unsure letter and is reported as agreement or not", () => {
    const before = mbtiLetters(mid, IPIP_REL).find((l) => l.dim === "SN")!;
    const after = mbtiLetters(mid, IPIP_REL, nAnswers).find((l) => l.dim === "SN")!;
    expect(after.pSecond).toBeGreaterThan(before.pSecond);
    expect(after.letter).toBe("N");
    expect(after.direct).toMatchObject({ n: 8, letter: "N", agrees: before.pSecond >= 0.5 });
    expect(closestType(mid, IPIP_REL, nAnswers).type[1]).toBe("N");
  });

  it("flags letters under 65% as borderline", () => {
    const L = mbtiLetters({ O: 0, C: 0, E: 0, A: 0, N: 0 }, IPIP_REL);
    for (const l of L) expect(l.borderline).toBe(l.p < 0.65);
  });
});
