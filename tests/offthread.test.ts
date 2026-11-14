// The results page runs its slow simulations in a web worker. The worker runs exactly the same pure jobs as the main
// thread, so its answers must match calling the library directly, and survive the trip through structured cloning.
import { describe, it, expect } from "vitest";
import { runJob } from "@/lib/offthreadJobs";
import { buildReport } from "@/lib/model";
import { mbtiJourney, pathToType } from "@/lib/mbti";
import { allOutcomes } from "@/lib/universes";
import { DEMO_ANSWERS } from "@/lib/questions";
import { runOffThread } from "@/lib/useOffThread";

const report = buildReport(DEMO_ANSWERS);
const clone = <T,>(x: T): T => structuredClone(x);

describe("off-thread jobs", () => {
  it("give the same results as the library, after a structured-clone round trip", () => {
    expect(clone(runJob({ kind: "journey", report: clone(report) }))).toEqual(mbtiJourney(report));
    expect(clone(runJob({ kind: "outcomes", answers: clone(DEMO_ANSWERS), report: clone(report) }))).toEqual(allOutcomes(DEMO_ANSWERS, report));
    expect(clone(runJob({ kind: "path", report: clone(report), age: 20, target: "INTJ" }))).toEqual(pathToType(report, 20, "INTJ"));
  });
  it("fall back to the main thread when there is no Worker, and share one run for identical jobs", async () => {
    const job = { kind: "journey" as const, report };
    const a = runOffThread(job);
    const b = runOffThread({ kind: "journey", report: clone(report) });
    expect(await a).toEqual(mbtiJourney(report));
    expect(await b).toBe(await a);
  });
});
