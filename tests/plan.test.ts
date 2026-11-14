import { describe, it, expect } from "vitest";
import { buildReport } from "@/lib/model";
import { DEMO_ANSWERS } from "@/lib/questions";
import { SOURCES, TRAITS } from "@/lib/params";
import { STEP_SCIENCE, TIMELINE, directions, outlook } from "@/lib/planScience";
import { shortCite } from "@/lib/cite";

const r = buildReport(DEMO_ANSWERS);

describe("plan science", () => {
  it("cites only sources we list on the science page", () => {
    for (const t of TRAITS)
      for (const dir of ["up", "down"] as const) for (const id of STEP_SCIENCE[t][dir].src) expect(SOURCES[id], `${t} ${dir} ${id}`).toBeTruthy();
    for (const s of TIMELINE) expect(SOURCES[s.src]).toBeTruthy();
  });

  it("moves each focus trait towards the target, more with coaching", () => {
    const target = { O: 90, C: 90, E: 52, A: 30, N: 15 };
    const rows = outlook(r.now, target, 20);
    expect(rows.map((x) => x.trait).sort()).toEqual(["A", "C", "N", "O"]); // E is within 10 points
    for (const o of rows) {
      const s = o.dir === "up" ? 1 : -1;
      expect(s * (o.challenges16w - o.now)).toBeGreaterThan(0);
      expect(s * (o.coached16w - o.challenges16w)).toBeGreaterThanOrEqual(0);
    }
    expect(rows[0].trait).toBe("N"); // biggest gap first
  });

  it("knows when you are already there", () => {
    const now = Object.fromEntries(TRAITS.map((t) => [t, 50])) as Record<(typeof TRAITS)[number], number>;
    expect(Object.values(directions(now, now)).every((d) => d === null)).toBe(true);
  });

  it("shortens citations", () => {
    expect(shortCite(SOURCES.HF2015)).toBe("Hudson & Fraley (2015)");
    expect(shortCite(SOURCES.GS2006)).toBe("Gollwitzer & Sheeran (2006)");
    expect(shortCite(SOURCES.LEA2007)).toBe("Lieberman et al. (2007)");
  });
});
