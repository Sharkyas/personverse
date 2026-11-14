import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

const body = {
  name: "Sam",
  age: 20,
  temperamentType: 'Spirited ("difficult")',
  nowPct: { O: 70, C: 40, E: 60, A: 60, N: 70 },
  babyPct: { O: 50, C: 50, E: 50, A: 50, N: 50 },
  targetPct: { O: 85, C: 85, E: 40, A: 40, N: 20 },
  targetName: "The Quant",
  pChange: { O: 0.5, C: 0.6, E: 0.5, A: 0.5, N: 0.6 },
};
const req = (b: unknown) => new Request("http://x/api", { method: "POST", body: JSON.stringify(b) });

const aiPlan = {
  headline: "Calmer, sharper, still you",
  summary: "Two gaps matter most.",
  weeks: Array.from({ length: 8 }, (_, i) => ({ week: i + 1, trait: i % 2 ? "C" : "N", challenge: "Do a thing", why: "Because" })),
  ifThen: ["If X, then I will Y."],
  watchOut: "Go slowly.",
  narration: "You started life as a spirited baby and you are heading somewhere calmer and more organised than you think.",
};

let server: http.Server;
let calls: string[] = [];
async function mock(handler: (model: string) => { status: number; text?: string }) {
  server = http.createServer((rq, rs) => {
    const model = /models\/([^:]+):/.exec(rq.url ?? "")?.[1] ?? "?";
    calls.push(model);
    let raw = "";
    rq.on("data", (c) => (raw += c));
    rq.on("end", () => {
      const r = handler(model);
      rs.writeHead(r.status, { "Content-Type": "application/json" });
      rs.end(
        r.status === 200
          ? JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: r.text }] }, finishReason: "STOP" }] })
          : JSON.stringify({ error: { code: r.status, message: "nope", status: "NOT_FOUND" } })
      );
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeEach(() => {
  vi.resetModules();
  calls = [];
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_BASE_URL;
  delete process.env.AI_MODEL;
});
afterEach(() => server?.close());

describe("/api/coach", () => {
  it("works with no key, from the challenge library", async () => {
    const { POST } = await import("@/app/api/coach/route");
    const plan = await (await POST(req(body))).json();
    expect(plan.source).toBe("library");
    expect(plan.weeks).toHaveLength(8);
    expect(plan.summary).toMatch(/conscientiousness|neuroticism/);
    expect(plan.narration.length).toBeGreaterThan(40);
  });

  it("uses Gemma 4 when a key is set, parsing fenced JSON", async () => {
    process.env.GEMINI_API_KEY = "test";
    process.env.GEMINI_BASE_URL = await mock(() => ({ status: 200, text: "```json\n" + JSON.stringify(aiPlan) + "\n```" }));
    const { POST } = await import("@/app/api/coach/route");
    const plan = await (await POST(req(body))).json();
    expect(plan.source).toBe("ai");
    expect(plan.model).toBe("gemma-4-31b-it");
    expect(plan.headline).toBe(aiPlan.headline);
    expect(calls[0]).toBe("gemma-4-31b-it");
  });

  it("falls through the model chain when one model is missing", async () => {
    process.env.GEMINI_API_KEY = "test";
    process.env.GEMINI_BASE_URL = await mock((m) => (m === "gemma-4-31b-it" ? { status: 404 } : { status: 200, text: JSON.stringify(aiPlan) }));
    const { POST } = await import("@/app/api/coach/route");
    const plan = await (await POST(req(body))).json();
    expect(plan.model).toBe("gemma-4-26b-a4b-it");
  });

  it("falls back to the library when the model returns junk", async () => {
    process.env.GEMINI_API_KEY = "test";
    process.env.GEMINI_BASE_URL = await mock(() => ({ status: 200, text: "I'm sorry, I can't help with that." }));
    const { POST } = await import("@/app/api/coach/route");
    const plan = await (await POST(req(body))).json();
    expect(plan.source).toBe("library");
    expect(calls.length).toBe(3);
  });
});

describe("/api/future-self", () => {
  it("writes a template note with no key", async () => {
    const { POST } = await import("@/app/api/future-self/route");
    const r = await (
      await POST(req({ ...body, horizon: 35, futurePct: { O: 72, C: 70, E: 60, A: 62, N: 35 }, events: ["University"] }))
    ).json();
    expect(r.source).toBe("template");
    expect(r.text).toContain("at 35");
    expect(r.text).not.toMatch(/\(|"/);
  });
});

describe("/api/narrate", () => {
  it("tells the client to use the browser voice when there's no key", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const { POST } = await import("@/app/api/narrate/route");
    const r = await POST(req({ text: "hello" }));
    expect(r.status).toBe(501);
  });
});

describe("/api/profile + stats (memory store)", () => {
  it("saves, reads back and aggregates", async () => {
    delete process.env.MONGODB_URI;
    const { DEMO_ANSWERS } = await import("@/lib/questions");
    const save = await import("@/app/api/profile/route");
    const { id } = await (await save.POST(req({ ...DEMO_ANSWERS, name: "Secret" }))).json();
    expect(id).toBeTruthy();
    const get = await import("@/app/api/profile/[id]/route");
    const got = await (await get.GET(new Request("http://x"), { params: Promise.resolve({ id }) })).json();
    expect(got.answers.age).toBe(DEMO_ANSWERS.age);
    expect(got.answers.name).toBeUndefined(); // names are never stored
    const stats = await import("@/app/api/stats/route");
    const s = await (await stats.GET()).json();
    expect(s.n).toBeGreaterThanOrEqual(1);
  });
});

describe("MongoDB outage", () => {
  it("falls back to memory quickly when Atlas is unreachable", async () => {
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500";
    const { saveProfile, getProfile, dbStatus } = await import("@/lib/db");
    const t0 = Date.now();
    const id = await saveProfile({ createdAt: new Date(), answers: {}, summary: { temperamentType: "Easy", nowPct: {}, babyPct: {}, pChange: {}, age: 20 } });
    expect(Date.now() - t0).toBeLessThan(6000);
    expect(await getProfile(id)).not.toBeNull();
    expect(await dbStatus()).toBe("atlas-down"); // skipped for 60 s after a failure
    delete process.env.MONGODB_URI;
  }, 15000);
});
