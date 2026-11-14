import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildReport, forecast } from "@/lib/model";
import { DEMO_ANSWERS } from "@/lib/questions";
import { TIPI_RETEST_R, TRAITS } from "@/lib/params";
import { assess, expectAt, reminderIcs, simulateYear, type Checkin } from "@/lib/track";

const a = DEMO_ANSWERS;
const r = buildReport(a);
const t0 = "2026-01-01T00:00:00.000Z";
const at = (years: number) => new Date(new Date(t0).getTime() + years * 365.25 * 864e5).toISOString();

describe("tracker maths", () => {
  it("starts at your baseline, with only test wobble", () => {
    const e = expectAt(r.now, a, 0);
    for (const t of TRAITS) {
      expect(e[t].expected).toBeCloseTo(r.now[t], 10);
      expect(e[t].sd).toBeCloseTo(0, 10);
      expect(e[t].sdObs).toBeCloseTo(Math.sqrt(2 * (1 - TIPI_RETEST_R)), 10);
    }
  });

  it("agrees with the main forecast at the horizon", () => {
    const years = a.horizon - a.age;
    const e = expectAt(r.now, a, years);
    for (const f of forecast(r.now, a.age, a.horizon, a.events)) {
      expect(e[f.trait].expected).toBeCloseTo(f.expected, 10);
      expect(e[f.trait].sd).toBeCloseTo(f.sd, 10);
    }
  });

  it("reads check-ins as within, higher or lower", () => {
    const e = expectAt(r.now, a, 0.5);
    const onTrack: Checkin = { time: at(0.5), z: Object.fromEntries(TRAITS.map((t) => [t, e[t].expected])) as Checkin["z"] };
    expect(assess(r.now, t0, a, [onTrack])!.every((s) => s.verdict === "within")).toBe(true);
    const high: Checkin = { time: at(0.5), z: { ...onTrack.z, N: e.N.expected + 3 * e.N.sdObs, C: e.C.expected - 3 * e.C.sdObs } };
    const s = assess(r.now, t0, a, [high])!;
    expect(s.find((x) => x.trait === "N")!.verdict).toBe("higher");
    expect(s.find((x) => x.trait === "C")!.verdict).toBe("lower");
    expect(s[0].slope).toBeNull(); // two points: no trend yet
    expect(assess(r.now, t0, a, [])).toBeNull();
  });

  it("fits a trend once there are three points", () => {
    const line = (y: number) => ({ O: r.now.O + 0.5 * y, C: r.now.C, E: r.now.E, A: r.now.A, N: r.now.N });
    const s = assess(r.now, t0, a, [{ time: at(0.5), z: line(0.5) }, { time: at(1), z: line(1) }])!;
    const o = s.find((x) => x.trait === "O")!;
    expect(o.slope).toBeCloseTo(0.5, 3);
    expect(o.slopeSe).toBeCloseTo(0, 3);
  });

  it("simulated example year is deterministic and ordered", () => {
    const x = simulateYear(r.now, t0, a);
    expect(x).toEqual(simulateYear(r.now, t0, a));
    expect(x).toHaveLength(5);
    for (let i = 1; i < x.length; i++) expect(x[i].time > x[i - 1].time).toBe(true);
  });

  it("writes a valid calendar reminder", () => {
    const ics = reminderIcs("https://example.com/track/abc123", new Date("2027-01-10T12:00:00Z"));
    expect(ics).toMatch(/^BEGIN:VCALENDAR/);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270110");
    expect(ics.split("\r\n").at(-1)).toBe("END:VCALENDAR");
  });
});

describe("check-in store and API (local store)", () => {
  beforeEach(async () => {
    delete process.env.TIGER_DATABASE_URL;
    (await import("@/lib/trackStore"))._resetTrackStore();
  });

  it("adds, lists and buckets check-ins by week", async () => {
    const { addCheckin, listCheckins, pulse, trackStatus } = await import("@/lib/trackStore");
    expect(await trackStatus()).toBe("local");
    await addCheckin("abc123", r.now);
    await addCheckin("abc123", { ...r.now, N: r.now.N - 0.5 });
    const list = await listCheckins("abc123");
    expect(list).toHaveLength(2);
    expect(list[1].z.N).toBeCloseTo(r.now.N - 0.5);
    const p = await pulse();
    expect(p.reduce((s, w) => s + w.n, 0)).toBe(2);
  });

  it("falls back to the local store when the database is down", async () => {
    process.env.TIGER_DATABASE_URL = "postgres://u:p@127.0.0.1:1/none";
    const s = await import("@/lib/trackStore");
    s._resetTrackStore();
    expect(await s.trackStatus()).toBe("db-down");
    expect(await s.addCheckin("down1234", r.now)).toBe("ok");
    expect(await s.listCheckins("down1234")).toHaveLength(1);
    delete process.env.TIGER_DATABASE_URL;
  });

  it("validates input and needs a real result", async () => {
    const { POST, GET } = await import("@/app/api/track/[id]/route");
    const { saveProfile } = await import("@/lib/db");
    const post = (id: string, b: unknown) => POST(new Request("http://x", { method: "POST", body: JSON.stringify(b) }), { params: Promise.resolve({ id }) });
    expect((await post("nosuchid1", { tipi: Array(10).fill(4) })).status).toBe(404);
    const id = await saveProfile({ createdAt: new Date(), answers: DEMO_ANSWERS, summary: { temperamentType: "x", nowPct: {}, babyPct: {}, pChange: {}, age: 20 } });
    expect((await post(id, { tipi: Array(9).fill(4) })).status).toBe(400);
    expect((await post(id, { tipi: [...Array(9).fill(4), 8] })).status).toBe(400);
    expect((await post("../etc", { tipi: Array(10).fill(4) })).status).toBe(404);
    const ok = await post(id, { tipi: DEMO_ANSWERS.tipi });
    expect(ok.status).toBe(200);
    const j = await (await GET(new Request("http://x"), { params: Promise.resolve({ id }) })).json();
    expect(j.store).toBe("local");
    expect(j.checkins).toHaveLength(1);
    // Scored exactly like the full test, so retaking with the same answers lands on the baseline.
    for (const t of TRAITS) expect(j.checkins[0].z[t]).toBeCloseTo(r.now[t], 5);
  });
});

// Runs only with a real Postgres or Tiger Data URL: PG_TEST_URL=postgres://... npm test
const PG = process.env.PG_TEST_URL;
describe.skipIf(!PG)("check-in store on a real database", () => {
  afterAll(async () => {
    const { Pool } = await import("pg");
    const p = new Pool({ connectionString: PG });
    await p.query("DELETE FROM trait_checkins WHERE tracker_id LIKE 'pvtest%'");
    await p.end();
    delete process.env.TIGER_DATABASE_URL;
  });

  it("creates the table, stores and reads check-ins, and buckets them", async () => {
    process.env.TIGER_DATABASE_URL = PG;
    const s = await import("@/lib/trackStore");
    s._resetTrackStore();
    const mode = await s.trackStatus();
    expect(["tiger", "postgres"]).toContain(mode);
    const id = "pvtest" + Date.now().toString(36);
    await s.addCheckin(id, r.now, new Date(Date.now() - 14 * 864e5));
    await s.addCheckin(id, { ...r.now, O: 1.25 });
    const list = await s.listCheckins(id);
    expect(list).toHaveLength(2);
    expect(list[1].z.O).toBeCloseTo(1.25, 4);
    expect(new Date(list[0].time) < new Date(list[1].time)).toBe(true);
    const p = await s.pulse();
    expect(p.length).toBeGreaterThanOrEqual(1);
    expect(p.reduce((n, w) => n + w.n, 0)).toBeGreaterThanOrEqual(2);
    console.log("tracker store mode:", mode);
  });
});
