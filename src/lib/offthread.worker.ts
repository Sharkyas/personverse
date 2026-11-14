// Runs the results page's slow simulations (Monte Carlo journeys, the parallel universes, paths to a type) off the
// main thread, so the page stays responsive on phones while they finish.
import { runJob, type Job } from "./offthreadJobs";

self.onmessage = (e: MessageEvent<{ id: number; job: Job }>) => {
  const { id, job } = e.data;
  try {
    (self as unknown as Worker).postMessage({ id, result: runJob(job) });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) });
  }
};
