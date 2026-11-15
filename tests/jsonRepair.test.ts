import { describe, it, expect } from "vitest";
import { parseJSON, balanceBrackets } from "@/lib/ai";
import { liftStrayKeys } from "@/lib/liftStrayKeys";

describe("JSON repair for model output", () => {
  it("leaves valid JSON alone", () => {
    expect(parseJSON<{ a: number[] }>('{"a":[1,2]}')).toEqual({ a: [1, 2] });
  });

  it("fixes the weeks array that never closes", () => {
    const bad = '{"summary":"s","weeks":[{"week":1,"trait":"O"},{"ifThen":["If a, then b","If c, then d"],"watchOut":"w"}}';
    const plan = parseJSON<Record<string, unknown>>(bad)!;
    expect(plan).not.toBeNull();
    liftStrayKeys(plan);
    expect(plan.weeks).toEqual([{ week: 1, trait: "O" }]);
    expect(plan.ifThen).toEqual(["If a, then b", "If c, then d"]);
    expect(plan.watchOut).toBe("w");
  });

  it("does not touch brackets inside strings", () => {
    expect(JSON.parse(balanceBrackets('{"a":"x}]y","b":[1'))).toEqual({ a: "x}]y", b: [1] });
  });

  it("closes truncated output", () => {
    expect(JSON.parse(balanceBrackets('{"a":[{"b":1},'))).toEqual({ a: [{ b: 1 }] });
  });
});
