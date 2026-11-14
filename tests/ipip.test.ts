import { describe, it, expect } from "vitest";
import { buildReport, currentZ, ipipZ, TIPI_REL, IPIP_REL } from "@/lib/model";
import { modelFor, MBTI_DIM_MODEL, mbtiLetters, closestType, typeConfidence } from "@/lib/mbti";
import { IPIP_ITEMS, DEMO_ANSWERS, sanitizeAnswers, type Answers } from "@/lib/questions";
import norms from "@/lib/ipipNorms.json";

const withIpip = (fn: (trait: string, reverse: boolean) => number): Answers => ({
  ...DEMO_ANSWERS,
  inventory: "detailed",
  ipip: IPIP_ITEMS.map((it) => fn(it.trait, it.reverse)),
});

describe("IPIP-50 detailed questionnaire", () => {
  it("has 50 items, 10 per trait, with the published reverse keys", () => {
    expect(IPIP_ITEMS).toHaveLength(50);
    for (const t of ["O", "C", "E", "A", "N"]) expect(IPIP_ITEMS.filter((i) => i.trait === t)).toHaveLength(10);
    expect(IPIP_ITEMS.filter((i) => i.reverse).length).toBe(5 + 2 + 4 + 4 + 3);
    expect(IPIP_ITEMS[0].text).toBe("I am the life of the party.");
  });

  it("norms come from the open dataset and are internally consistent", () => {
    expect(norms.n).toBeGreaterThan(10000);
    for (const t of Object.values(norms.traits)) {
      expect(t.alpha).toBeGreaterThan(0.78);
      expect(t.sd).toBeGreaterThan(0.5);
    }
  });

  it("an answer at the norm mean scores z ≈ 0, and reverse keying is applied", () => {
    // all 'Neither' (3) → keyed mean 3 for every trait
    const z = ipipZ(withIpip(() => 3));
    expect(z.E).toBeCloseTo((3 - norms.traits.E.mean) / norms.traits.E.sd, 5);
    // agree with every extraversion item as keyed → very high E
    const hi = ipipZ(withIpip((t, rev) => (t === "E" ? (rev ? 1 : 5) : 3)));
    expect(hi.E).toBeGreaterThan(2);
  });

  it("detailed answers replace the TIPI score; too few answers fall back to the TIPI", () => {
    const quick = currentZ(DEMO_ANSWERS);
    const det = currentZ(withIpip((t, rev) => (t === "C" ? (rev ? 1 : 5) : 3)));
    expect(det.C).toBeGreaterThan(quick.C);
    const sparse = withIpip(() => 0);
    sparse.ipip![0] = 5; // a single E item
    expect(currentZ(sparse).E).toBe(quick.E);
  });

  it("survives sanitising, and is dropped unless marked detailed", () => {
    const a = sanitizeAnswers({ ...withIpip(() => 4), ipip: [...Array(50).fill(4)] });
    expect(a.inventory).toBe("detailed");
    expect(a.ipip).toHaveLength(50);
    expect(sanitizeAnswers({ ...DEMO_ANSWERS, ipip: Array(50).fill(4) }).ipip).toBeUndefined();
    expect(sanitizeAnswers({ inventory: "detailed", ipip: [9, -3, "x"] }).ipip!.slice(0, 3)).toEqual([5, 0, 0]);
  });

  it("the report records which questionnaire was used and its reliability", () => {
    expect(buildReport(DEMO_ANSWERS).detailed).toBe(false);
    const r = buildReport(withIpip(() => 4));
    expect(r.detailed).toBe(true);
    expect(r.rel.E).toBeCloseTo(IPIP_REL.E, 5);
  });
});

describe("reliability-aware MBTI", () => {
  it("TIPI reliabilities reproduce the stored quick model", () => {
    const m = modelFor(TIPI_REL);
    for (const d of ["EI", "SN", "TF", "JP"] as const) {
      for (const [t, w] of Object.entries(MBTI_DIM_MODEL[d].w)) expect(m[d].w[t as "E"]).toBeCloseTo(w as number, 2);
      expect(m[d].sd).toBeCloseTo(MBTI_DIM_MODEL[d].sd, 2);
    }
  });

  it("the detailed questionnaire explains more of every MBTI scale", () => {
    const m = modelFor(IPIP_REL);
    for (const d of ["EI", "SN", "TF", "JP"] as const) expect(m[d].r2).toBeGreaterThan(MBTI_DIM_MODEL[d].r2);
  });

  it("for the same scores, the detailed version is more certain of each letter", () => {
    // clearly expressed scores on every scale's main trait
    const z = { O: 1.8, C: -1.6, E: -1.8, A: 1.6, N: 0.5 };
    const q = mbtiLetters(z);
    const d = mbtiLetters(z, IPIP_REL);
    q.forEach((l, i) => {
      expect(d[i].letter).toBe(l.letter);
      expect(d[i].p).toBeGreaterThan(l.p);
    });
  });

  it("confidence summary: three surest letters, the open one, and a level", () => {
    const c = closestType({ O: 1.8, C: -1.6, E: -1.8, A: 1.6, N: 0.5 }, IPIP_REL).confidence;
    expect(c.core).toMatch(/^[EI_][SN_][TF_][JP_]$/);
    expect(c.core.split("_")).toHaveLength(2);
    expect(c.pCore).toBeGreaterThan(0.5);
    expect(["High", "Good", "Moderate", "Low"]).toContain(c.level);
    const L = mbtiLetters({ O: 0, C: 0, E: 0, A: 0, N: 0 });
    expect(typeConfidence(L).level).toBe("Low");
  });
});
