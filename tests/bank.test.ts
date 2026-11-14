import { describe, it, expect } from "vitest";
import neo from "@/lib/bank/ipipNeo120.json";
import typeBank from "@/lib/bank/typeItems.json";
import irtFit from "@/lib/bank/ipip50Irt.json";
import { IPIP_ITEMS, DEMO_ANSWERS, sanitizeAnswers } from "@/lib/questions";
import { UPBRINGING } from "@/lib/params";
import { mbtiLetters } from "@/lib/mbti";
import { OEJTS_ITEMS } from "@/lib/oejts";
import { IPIP_REL, type Vec } from "@/lib/model";
import {
  GRID, grmProbs, itemInfo, normalPrior, posteriorOver, massAbove, interval,
  scoreIpip50, nextIpipItem, simulateAdaptive, IPIP50_ITEM_MODEL,
  TYPE_ITEMS, letterPosteriors, typeResult, evidenceFromBank, evidenceFromBipolar, evidenceFromOejts, nextTypeItem, carryForward,
  responseQuality, pairGap, coherence, CONSISTENCY_PAIRS,
  scoreUpbringing, scoreParent, UPBRINGING_BANK, UPBRINGING_SCALES, PARENT_BANK,
  NEO_ITEMS, NEO_FACETS, scoreNeo120, prefillFromIpip50, neoRemaining, facetHighlights,
  completion, percentile, brierSkill, intervalCoverage, letterRetest, traitAgreement,
  METRIC_CARDS, TRAIT_METRICS, TYPE_RECOVERY, BANK_SUMMARY,
} from "@/lib/bank";

// A consistent person: answers follow their trait levels, with a little item-to-item variation.
const person = (lean: Record<string, number>) =>
  IPIP_ITEMS.map((it, i) => Math.max(1, Math.min(5, 3 + (it.reverse ? -lean[it.trait] : lean[it.trait]) + ((i * 7) % 3) - 1)));
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe("item bank", () => {
  it("IPIP-NEO-120: 120 statements, four per facet, 30 facets, unique ids", () => {
    expect(NEO_ITEMS).toHaveLength(120);
    expect(Object.keys(NEO_FACETS)).toHaveLength(30);
    for (const f of Object.keys(NEO_FACETS)) expect(NEO_ITEMS.filter((i) => i.facet === f)).toHaveLength(4);
    expect(new Set(NEO_ITEMS.map((i) => i.id)).size).toBe(120);
    expect(NEO_ITEMS.every((i) => /^I .+\.$/.test(i.text))).toBe(true);
  });

  it("statements shared with the 50-statement test have the same wording and keying", () => {
    const shared = NEO_ITEMS.filter((i) => i.sameAs);
    expect(shared).toHaveLength(14);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "");
    for (const s of shared) {
      const other = IPIP_ITEMS.find((i) => i.id === s.sameAs)!;
      expect(norm(other.text)).toBe(norm(s.text));
      expect(other.reverse).toBe(s.reverse);
    }
  });

  it("published norms are present for every facet and domain, on the 1–5 scale", () => {
    for (const set of [neo.norms.adult, ...neo.norms.groups]) {
      for (const n of [...Object.values(set.domains), ...Object.values(set.facets)]) {
        expect(n.mean).toBeGreaterThan(1.5);
        expect(n.mean).toBeLessThan(4.9);
        expect(n.sd).toBeGreaterThan(0.3);
      }
      expect(Object.keys(set.facets)).toHaveLength(30);
    }
  });

  it("type statements: 12 per letter pair, six pointing each way, no duplicates", () => {
    expect(TYPE_ITEMS).toHaveLength(48);
    for (const dim of ["EI", "SN", "TF", "JP"]) {
      const d = TYPE_ITEMS.filter((i) => i.dim === dim);
      expect(d).toHaveLength(12);
      expect(d.filter((i) => i.pole === dim[0])).toHaveLength(6);
      expect(d.filter((i) => i.pole === dim[1])).toHaveLength(6);
      expect(new Set(d.map((i) => i.context)).size).toBeGreaterThanOrEqual(4);
    }
    expect(new Set(TYPE_ITEMS.map((i) => i.text)).size).toBe(48);
    expect(typeBank.calibrated).toBe(false);
  });

  it("upbringing scales map onto the model's factors, and every scale has a reverse-keyed or countable item", () => {
    for (const sc of Object.values(UPBRINGING_SCALES)) if (sc.composite) expect(Object.keys(UPBRINGING)).toContain(sc.composite);
    for (const it of UPBRINGING_BANK) expect(Object.keys(UPBRINGING_SCALES)).toContain(it.scale);
    expect(PARENT_BANK).toHaveLength(15);
    for (const t of ["O", "C", "E", "A", "N"]) expect(PARENT_BANK.filter((i) => i.trait === t && i.reverse)).toHaveLength(1);
    expect(BANK_SUMMARY.total).toBeGreaterThan(280);
  });
});

describe("graded response model", () => {
  const item = { a: 1.5, b: [-1.5, -0.5, 0.5, 1.5] };
  it("probabilities sum to 1 and move with the trait", () => {
    for (const th of [-3, 0, 2]) expect(grmProbs(item, th).reduce((s, p) => s + p, 0)).toBeCloseTo(1, 6);
    expect(grmProbs(item, 2)[4]).toBeGreaterThan(grmProbs(item, 0)[4]);
    expect(itemInfo(item, 0)).toBeGreaterThan(itemInfo(item, 3.5));
  });
  it("answers pull the estimate and shrink its error", () => {
    const prior = normalPrior();
    const none = posteriorOver(prior, []);
    expect(none.mean).toBeCloseTo(0, 3);
    expect(none.sd).toBeCloseTo(1, 2);
    const hi = posteriorOver(prior, Array(6).fill({ item, x: 5 }));
    expect(hi.mean).toBeGreaterThan(1);
    expect(hi.sd).toBeLessThan(0.7);
    const [lo, up] = interval(hi.w, 0.8);
    expect(lo).toBeLessThan(hi.mean);
    expect(up).toBeGreaterThan(hi.mean);
  });
  it("mass above a cut matches the normal curve", () => {
    expect(massAbove(normalPrior(0, 1), 0)).toBeCloseTo(0.5, 3);
    expect(massAbove(normalPrior(0, 1), 1)).toBeCloseTo(0.1587, 2);
    expect(GRID).toHaveLength(81);
  });
  it("fitted parameters cover all 50 statements, with the same keying as the questionnaire", () => {
    for (const it of IPIP_ITEMS) {
      const m = IPIP50_ITEM_MODEL[it.id];
      expect(m.reverse).toBe(it.reverse);
      expect(m.a).toBeGreaterThan(0.5);
      expect([...m.b].sort((x, y) => x - y)).toEqual(m.b);
    }
    expect(irtFit.n_train).toBeGreaterThan(9000);
    expect(CONSISTENCY_PAIRS).toHaveLength(15);
  });
});

describe("Big Five scoring and the adaptive order", () => {
  it("scores follow the answers and report a per-person error", () => {
    const s = scoreIpip50(person({ E: 2, N: -1, A: 1, C: 0, O: 1 }));
    expect(s.E.theta).toBeGreaterThan(1);
    expect(s.N.theta).toBeLessThan(0);
    expect(s.E.se).toBeLessThan(0.5);
    expect(s.E.reliability).toBeGreaterThan(0.75);
    expect(Math.abs(s.E.z)).toBeGreaterThanOrEqual(Math.abs(s.E.theta));
    const empty = scoreIpip50([]);
    expect(empty.O.theta).toBeCloseTo(0, 3);
    expect(empty.O.n).toBe(0);
  });
  it("the adaptive test asks at least four per trait, stops early and agrees with the full test", () => {
    const full = person({ E: 1, N: 1, A: -1, C: 1, O: 0 });
    const run = simulateAdaptive(full);
    expect(run.asked.length).toBeLessThan(50);
    expect(run.asked.length).toBeGreaterThanOrEqual(20);
    expect(new Set(run.asked).size).toBe(run.asked.length);
    const f = scoreIpip50(full);
    for (const t of ["O", "C", "E", "A", "N"] as const) {
      expect(run.scores[t].n).toBeGreaterThanOrEqual(4);
      expect(Math.abs(run.scores[t].theta - f[t].theta)).toBeLessThan(0.6);
    }
    expect(nextIpipItem(full)).toBeNull();
  });
  it("starts by spreading across traits and does not repeat the trait just asked", () => {
    const first = nextIpipItem([])!;
    const ans: number[] = [];
    ans[first.index] = 3;
    const second = nextIpipItem(ans, { lastTrait: first.trait })!;
    expect(second.trait).not.toBe(first.trait);
    expect(first.remainingAtMost).toBe(50);
  });
});

describe("type letters with direct statements", () => {
  // Someone who reads as INTP on a dedicated type test, but whose Big Five alone do not make that clear.
  const z: Vec = { O: 0.6, C: -0.2, E: -0.5, A: -0.3, N: 0.1 };
  const intp = (strength: 4 | 5) =>
    Object.fromEntries(TYPE_ITEMS.map((it) => [it.id, "INTP".includes(it.pole) ? strength : 6 - strength])) as Record<string, number>;

  it("with no direct statements it is exactly the existing Big Five model", () => {
    const mine = letterPosteriors(z, IPIP_REL);
    const theirs = mbtiLetters(z, IPIP_REL);
    mine.forEach((l, i) => {
      expect(l.pSecond).toBeCloseTo(theirs[i].pSecond, 6);
      expect(l.letter).toBe(theirs[i].letter);
      expect(l.nItems).toBe(0);
    });
  });

  it("direct statements settle a type the Big Five leave open", () => {
    const before = typeResult(z, IPIP_REL);
    expect(before.type).not.toBe("INTP");
    expect(before.borderline.length).toBeGreaterThanOrEqual(2);
    const after = typeResult(z, IPIP_REL, evidenceFromBank(intp(4)));
    expect(after.type).toBe("INTP");
    expect(after.borderline).toHaveLength(0);
    expect(after.pType).toBeGreaterThan(0.7);
    expect(after.pSameTypeOnRetest).toBeGreaterThan(before.pSameTypeOnRetest);
    for (const l of after.letters) expect(l.nItems).toBe(12);
  });

  it("mixed answers are reported as borderline, with the open letter masked", () => {
    const mixed = { ...intp(5) };
    for (const it of TYPE_ITEMS.filter((i) => i.dim === "TF")) mixed[it.id] = 3;
    const r = typeResult({ ...z, A: 0.1 }, IPIP_REL, evidenceFromBank(mixed));
    expect(r.borderline).toContain("TF");
    expect(r.mask[2]).toBe("_");
    expect(r.candidates.map((c) => c.type)).toEqual(expect.arrayContaining(["INTP", "INFP"]));
    expect(r.candidates.every((c) => c.type[0] === "I" && c.type[3] === "P")).toBe(true);
  });

  it("bipolar items from another scale can be fed in too", () => {
    const ev = Array.from({ length: 8 }, () => evidenceFromBipolar("SN", 5, true));
    const l = letterPosteriors(z, IPIP_REL, ev).find((x) => x.dim === "SN")!;
    expect(l.letter).toBe("N");
    expect(l.band).toBe("clear");
  });

  it("OEJTS answers already collected by the app count as evidence, in the same direction as the app's own scoring", () => {
    const oejts = Object.fromEntries(OEJTS_ITEMS.map((it) => [it.id, it.sign === 1 ? 5 : 1])); // every item towards I, N, F, P
    const mine = letterPosteriors(z, IPIP_REL, evidenceFromOejts(oejts));
    const theirs = mbtiLetters(z, IPIP_REL, oejts);
    expect(mine.map((l) => l.letter).join("")).toBe("INFP");
    expect(theirs.map((l) => l.letter).join("")).toBe("INFP");
    expect(evidenceFromOejts(undefined)).toEqual([]);
  });

  it("follow-ups go to the least certain letter, alternate poles and stop when every letter is settled", () => {
    const answers: Record<string, number> = {};
    const asked: string[] = [];
    const full = intp(5);
    for (let guard = 0; guard < 60; guard++) {
      const nx = nextTypeItem(z, IPIP_REL, answers);
      if (!nx) break;
      answers[nx.item.id] = full[nx.item.id];
      asked.push(nx.item.id);
    }
    expect(asked.length).toBeGreaterThanOrEqual(16);
    expect(asked.length).toBeLessThan(48);
    const firstFour = asked.slice(0, 4).map((id) => id.slice(0, 2));
    expect(new Set(firstFour).size).toBe(4);
    expect(typeResult(z, IPIP_REL, evidenceFromBank(answers)).type).toBe("INTP");
  });

  it("the stated retest chance is a probability, and carrying a sitting forward steadies a borderline letter", () => {
    const first = letterPosteriors(z, IPIP_REL, evidenceFromBank(intp(4)));
    for (const l of first) {
      expect(l.pSameOnRetest).toBeGreaterThan(0.5);
      expect(l.pSameOnRetest).toBeLessThanOrEqual(1);
    }
    // second sitting: only a lukewarm Big Five signal and no direct statements
    const cold = letterPosteriors(z, IPIP_REL).find((l) => l.dim === "TF")!;
    const warm = letterPosteriors(z, IPIP_REL, [], carryForward(first, 0.1)).find((l) => l.dim === "TF")!;
    expect(warm.letter).toBe("T");
    expect(warm.p).toBeGreaterThan(cold.letter === "T" ? cold.p : 1 - cold.p);
  });
});

describe("answer-quality checks", () => {
  it("passes a consistent person", () => {
    const q = responseQuality(person({ E: 2, N: -1, A: 1, C: 1, O: 2 }));
    expect(q.ok).toBe(true);
    expect(q.stats.pairGap).toBeLessThan(1.2);
  });
  it("catches random answering that the older checks miss", () => {
    const rnd = seeded(11);
    let caught = 0;
    for (let k = 0; k < 200; k++) if (!responseQuality(IPIP_ITEMS.map(() => 1 + Math.floor(rnd() * 5))).ok) caught++;
    expect(caught).toBeGreaterThan(160);
  });
  it("catches random answering that avoids the extremes more often than not", () => {
    const rnd = seeded(5);
    let caught = 0;
    for (let k = 0; k < 200; k++) if (!responseQuality(IPIP_ITEMS.map(() => 2 + Math.floor(rnd() * 3))).ok) caught++;
    expect(caught).toBeGreaterThan(100);
  });
  it("still catches straight-lining and flags answers given too fast", () => {
    expect(responseQuality(Array(50).fill(4)).ok).toBe(false);
    const good = person({ E: 1, N: 0, A: 1, C: -1, O: 1 });
    const fast = responseQuality(good, Array(50).fill(0.8));
    expect(fast.flags.map((f) => f.check)).toContain("too-fast");
    expect(responseQuality(good, Array(50).fill(4)).ok).toBe(true);
  });
  it("never flags a short or partial test, and the indices behave", () => {
    expect(responseQuality([3, 3, 3, 3, 3]).ok).toBe(true);
    const good = person({ E: 2, N: -2, A: 1, C: 1, O: 0 });
    expect(coherence(good)).toBeGreaterThan(0.5);
    expect(pairGap(good).pairs).toBe(15);
  });
});

describe("upbringing and parent scales", () => {
  it("score into the model's 1–5 answers and survive sanitising", () => {
    const a: Record<string, number> = { W1: 5, W2: 5, W3: 4, W4: 5, W5: 1, H1: 2, H2: 1, H3: 1, H4: 1, H5: 5, X1: 0, X2: 1, X3: 0, X4: 1, X5: 0, X6: 0, X7: 0, X8: 0, S1: 4, S2: 3, S3: 2, S4: 3, M1: 1, M2: 1, M3: 1, M4: 5, B1: 3 };
    const s = scoreUpbringing(a);
    expect(s.upbringing.warmth).toBe(5);
    expect(s.upbringing.harshness).toBe(1);
    expect(s.adversityCount).toBe(2);
    expect(s.upbringing.adversity).toBe(3);
    expect(s.upbringing.moves).toBe(1);
    expect(s.upbringing.birthOrder).toBe(3);
    expect(s.scales.autonomy.score).toBeNull();
    const clean = sanitizeAnswers({ ...DEMO_ANSWERS, upbringing: { ...DEMO_ANSWERS.upbringing, ...s.upbringing } });
    expect(clean.upbringing.warmth).toBe(5);
  });
  it("skipped sensitive questions leave the default in place", () => {
    const s = scoreUpbringing({ W1: 4, W2: 4, W3: 4, X1: null, X2: null });
    expect(s.upbringing.warmth).toBe(4);
    expect(s.upbringing.adversity).toBeUndefined();
    expect(s.adversityCount).toBeNull();
  });
  it("four or more hard events is the top band", () => {
    expect(scoreUpbringing({ X1: 1, X2: 1, X3: 1, X4: 1, X5: 1, X6: 1, X7: 0, X8: 0 }).upbringing.adversity).toBe(5);
  });
  it("parent statements become a ParentRating", () => {
    const p = scoreParent({ PE1: 5, PE2: 1, PE3: 4, PN1: 2, PN2: 4, PN3: 2, PC1: 3 }, 1);
    expect(p.rating.traits.E).toBe(5);
    expect(p.rating.traits.N).toBe(2);
    expect(p.rating.traits.C).toBe(3);
    expect(p.rating.traits.O).toBeNull();
    expect(p.rating.sure).toBe(1);
    expect(scoreParent({ PE1: 5 }, 1).rating.sure).toBe(3);
    const clean = sanitizeAnswers({ ...DEMO_ANSWERS, parents: [p.rating] });
    expect(clean.parents![0].traits.E).toBe(5);
  });
});

describe("facet test", () => {
  it("scores domains and facets against the norms", () => {
    const mid = Object.fromEntries(NEO_ITEMS.map((i) => [i.id, 3]));
    const s = scoreNeo120(mid);
    expect(s.domains.E.z).toBeCloseTo((3 - neo.norms.adult.domains.E.mean) / neo.norms.adult.domains.E.sd, 6);
    expect(Object.values(s.facets).every((f) => f.z != null)).toBe(true);
    expect(s.rel.E).toBeCloseTo(0.85, 6);
    const hiE = scoreNeo120(Object.fromEntries(NEO_ITEMS.map((i) => [i.id, i.trait === "E" ? (i.reverse ? 1 : 5) : 3])));
    expect(hiE.z.E).toBeGreaterThan(2);
    expect(scoreNeo120(mid, { sex: "F", age: 30 }).normGroup).toMatch(/women/);
  });
  it("needs enough answers, and reuses the 14 shared statements", () => {
    const few = scoreNeo120({ N1_1: 4, N1_2: 4 });
    expect(few.domains.N.z).toBeNull();
    expect(few.facets.N1.z).toBeNull();
    const pre = prefillFromIpip50(Array(50).fill(4));
    expect(Object.keys(pre)).toHaveLength(14);
    expect(neoRemaining(pre)).toHaveLength(106);
  });
  it("picks out the facets that stand apart from the person's own trait level", () => {
    const a = Object.fromEntries(NEO_ITEMS.map((i) => [i.id, i.facet === "O5" ? (i.reverse ? 1 : 5) : i.facet === "O2" ? (i.reverse ? 5 : 1) : 3]));
    const h = facetHighlights(scoreNeo120(a));
    expect(h.O.high).toBe("Intellect");
    expect(h.O.low).toBe("Artistic interests");
  });
});

describe("live metrics helpers", () => {
  it("completion, percentiles, Brier skill, coverage, retest and agreement", () => {
    expect(completion([{ answered: 50, total: 50, finished: true }, { answered: 10, total: 50, finished: false }, { answered: 0, total: 50, finished: false }]).rate).toBe(0.5);
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile(Array.from({ length: 101 }, (_, i) => i), 95)).toBe(95);
    const perfect = brierSkill([{ p: 1, happened: true }, { p: 0, happened: false }]);
    expect(perfect.skill).toBe(1);
    const useless = brierSkill([{ p: 0.5, happened: true }, { p: 0.5, happened: false }]);
    expect(useless.skill).toBeCloseTo(0, 6);
    expect(intervalCoverage([{ expected: 0, sd: 1, observed: 0.5 }, { expected: 0, sd: 1, observed: 3 }])["0.8"]).toBe(0.5);
    const rt = letterRetest([{ first: "INTP", second: "INTP" }, { first: "INTP", second: "INFP" }]);
    expect(rt.allFour).toBe(0.5);
    expect(rt.perLetter[2].agreement).toBe(0.5);
    const z = (e: number): Vec => ({ O: 0, C: 0, E: e, A: -e, N: e * 2 });
    expect(traitAgreement([1, 2, 3, 4].map((e) => ({ a: z(e), b: z(e + 0.1) }))).E).toBeCloseTo(1, 6);
  });
});

describe("metrics suite shipped with the app", () => {
  it("every measured card has a value, pending cards have none", () => {
    for (const c of METRIC_CARDS) {
      if (c.status === "pending") expect(c.value).toBeNull();
      else expect(c.value).toBeTruthy();
      expect(c.meaning.length).toBeGreaterThan(20);
    }
    expect(new Set(METRIC_CARDS.map((c) => c.id)).size).toBe(METRIC_CARDS.length);
  });
  it("numbers are in the range the write-up claims", () => {
    for (const t of TRAIT_METRICS) {
      expect(t.omega).toBeGreaterThan(0.78);
      expect(t.auc).toBeGreaterThan(0.78);
      expect(Math.abs(t.coverage80 - 0.8)).toBeLessThan(0.05);
      expect(t.adaptiveR).toBeGreaterThan(0.95);
    }
    const base = TYPE_RECOVERY[0];
    const best = TYPE_RECOVERY.find((c) => c.direct_per_letter === 12 && c.discrimination === 1.4)!;
    expect(best.type_accuracy).toBeGreaterThan(base.type_accuracy + 0.25);
    expect(Math.abs(best.predicted_retest_same_letter! - best.retest_same_letter!)).toBeLessThan(0.02);
  });
});
