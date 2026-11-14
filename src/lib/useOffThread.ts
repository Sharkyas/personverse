"use client";
// Run a slow job in a web worker and re-render when it is done. Results are cached by their inputs, so two components
// asking for the same thing (the branching chart and the universe cards both need every universe) share one run.
// Without worker support (old browsers, tests) the job runs on the main thread after the first paint instead.
import { useEffect, useState } from "react";
import { runJob, type Job, type JobResult } from "./offthreadJobs";

const cache = new Map<string, Promise<unknown>>();
let worker: Worker | null | undefined;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (v: unknown) => void; reject: (e: unknown) => void }
>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker =
      typeof Worker === "undefined"
        ? null
        : new Worker(new URL("./offthread.worker.ts", import.meta.url));
    worker?.addEventListener(
      "message",
      (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        if (e.data.error) p.reject(new Error(e.data.error));
        else p.resolve(e.data.result);
      },
    );
    worker?.addEventListener("error", () => {
      // A broken worker: finish everything on the main thread from now on.
      worker = null;
      for (const [, p] of pending) p.reject(new Error("worker failed"));
      pending.clear();
    });
  } catch {
    worker = null;
  }
  return worker;
}

const onMain = (job: Job) =>
  new Promise<unknown>((resolve) => setTimeout(() => resolve(runJob(job)), 0));

export function runOffThread<J extends Job>(job: J): Promise<JobResult<J>> {
  const key = JSON.stringify(job);
  let p = cache.get(key);
  if (!p) {
    const w = getWorker();
    p = w
      ? new Promise<unknown>((resolve, reject) => {
          const id = ++nextId;
          pending.set(id, { resolve, reject });
          w.postMessage({ id, job });
        }).catch(() => onMain(job))
      : onMain(job);
    cache.set(key, p);
    if (cache.size > 40) cache.delete(cache.keys().next().value!);
  }
  return p as Promise<JobResult<J>>;
}

/** The job's result, or null while it runs. Pass null to run nothing. */
export function useOffThread<J extends Job>(
  job: J | null,
): JobResult<J> | null {
  const key = job ? JSON.stringify(job) : "";
  const [state, setState] = useState<{
    key: string;
    value: JobResult<J>;
  } | null>(null);
  useEffect(() => {
    if (!job) return;
    let live = true;
    runOffThread(job).then((value) => live && setState({ key, value }));
    return () => {
      live = false;
    };
    // the key captures the job's inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state && state.key === key ? state.value : null;
}
