// The jobs the results page hands to a web worker (src/lib/offthread.worker.ts). Pure functions of plain data, so the
// worker and the main-thread fallback give the same answer.
import type { Answers } from "./questions";
import type { Report } from "./model";
import { allOutcomes, type UniverseOutcome } from "./universes";
import { mbtiJourney, pathToType, type Journey, type TypePath } from "./mbti";

export type Job =
  | { kind: "outcomes"; answers: Answers; report: Report }
  | { kind: "journey"; report: Report }
  | { kind: "path"; report: Report; age: number; target: string };

export type JobResult<J extends Job> = J extends { kind: "outcomes" }
  ? UniverseOutcome[]
  : J extends { kind: "journey" }
    ? Journey
    : TypePath;

export function runJob(job: Job): unknown {
  if (job.kind === "outcomes") return allOutcomes(job.answers, job.report);
  if (job.kind === "journey") return mbtiJourney(job.report);
  return pathToType(job.report, job.age, job.target);
}
