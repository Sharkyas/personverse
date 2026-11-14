import { describe, it, expect } from "vitest";
import { parseJSON } from "@/lib/ai";
import { CELEBS, nearestCelebs } from "@/lib/celebs";

describe("parseJSON (Gemma has no JSON mode)", () => {
  it("parses fenced JSON", () => {
    expect(parseJSON<{ a: number }>("```json\n{\"a\": 1}\n```")).toEqual({ a: 1 });
  });
  it("ignores chatter around the JSON", () => {
    expect(parseJSON<{ a: number }>('Sure! Here you go: {"a": 2} Hope that helps.')).toEqual({ a: 2 });
  });
  it("returns null on garbage", () => {
    expect(parseJSON("no json here")).toBeNull();
    expect(parseJSON("{ broken")).toBeNull();
  });
});

describe("celebrity matching", () => {
  it("has 40+ people, all labelled as popular typings", () => {
    expect(CELEBS.length).toBeGreaterThanOrEqual(40);
    for (const c of CELEBS) expect(c.typing_label.toLowerCase()).toContain("popular");
  });
  it("finds an exact match first", () => {
    const c = CELEBS[5];
    const [best] = nearestCelebs({ O: c.O, C: c.C, E: c.E, A: c.A, N: c.N });
    expect(best.name).toBe(c.name);
    expect(best.match).toBe(100);
  });
});
