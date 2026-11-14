// Where check-ins live. With TIGER_DATABASE_URL set they go to Tiger Data (TimescaleDB): one hypertable partitioned by
// time, a retention policy so old check-ins delete themselves, and time_bucket() for the weekly pulse. Plain Postgres
// works too (no hypertable). With nothing set, a small JSON file. Same "skip for a minute after a failure" rule as Atlas.
import fs from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import type { Vec } from "./model";
import type { Checkin } from "./track";

export type TrackMode = "tiger" | "postgres" | "local" | "db-down";
export type PulseRow = { week: string; n: number; z: Vec };

const g = globalThis as unknown as { _pg?: Promise<{ pool: Pool; timescale: boolean }>; _pgDownUntil?: number; _checkins?: Map<string, Checkin[]> };
const url = () => process.env.TIGER_DATABASE_URL || process.env.TIMESCALE_URL || "";
export const MAX_CHECKINS = 100;

async function setup(): Promise<{ pool: Pool; timescale: boolean }> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url(), max: 4, connectionTimeoutMillis: 4000, idleTimeoutMillis: 30_000 });
  pool.on("error", (e) => markDown(e));
  await pool.query(`CREATE TABLE IF NOT EXISTS trait_checkins (
    time timestamptz NOT NULL DEFAULT now(),
    tracker_id text NOT NULL,
    o real NOT NULL, c real NOT NULL, e real NOT NULL, a real NOT NULL, n real NOT NULL
  )`);
  let timescale = false;
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS timescaledb");
  } catch {}
  try {
    timescale = (await pool.query("SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'")).rowCount === 1;
  } catch {}
  if (timescale) {
    const steps = [
      // TimescaleDB 2.13+ syntax first, then the older one.
      ["SELECT create_hypertable('trait_checkins', by_range('time', INTERVAL '30 days'), if_not_exists => TRUE)",
       "SELECT create_hypertable('trait_checkins', 'time', chunk_time_interval => INTERVAL '30 days', if_not_exists => TRUE)"],
      // Check-ins delete themselves after three years.
      ["SELECT add_retention_policy('trait_checkins', INTERVAL '3 years', if_not_exists => TRUE)"],
    ];
    for (const options of steps) {
      for (const [i, sql] of options.entries()) {
        try {
          await pool.query(sql);
          break;
        } catch (e) {
          if (i === options.length - 1) console.error("Timescale setup step skipped:", e instanceof Error ? e.message : e);
        }
      }
    }
  }
  await pool.query("CREATE INDEX IF NOT EXISTS trait_checkins_tracker_time ON trait_checkins (tracker_id, time DESC)");
  return { pool, timescale };
}

async function db() {
  if (!url()) return null;
  if (g._pgDownUntil && Date.now() < g._pgDownUntil) return null;
  if (!g._pg) g._pg = setup();
  try {
    return await g._pg;
  } catch (e) {
    markDown(e);
    return null;
  }
}

function markDown(e: unknown) {
  console.error("Check-in database unavailable, using local store for 60 s:", e instanceof Error ? e.message : e);
  g._pg?.then((x) => x.pool.end()).catch(() => {});
  g._pg = undefined;
  g._pgDownUntil = Date.now() + 60_000;
}

export async function trackStatus(): Promise<TrackMode> {
  if (!url()) return "local";
  const d = await db();
  return d ? (d.timescale ? "tiger" : "postgres") : "db-down";
}

// ---------- local fallback ----------
const FILE = path.join(process.env.DATA_DIR || ".data", "checkins.json");
function mem(): Map<string, Checkin[]> {
  if (g._checkins) return g._checkins;
  g._checkins = new Map();
  if (process.env.NODE_ENV !== "test") {
    try {
      for (const [k, v] of JSON.parse(fs.readFileSync(FILE, "utf8")) as [string, Checkin[]][]) g._checkins.set(k, v);
    } catch {}
  }
  return g._checkins;
}
function persist() {
  if (process.env.NODE_ENV === "test") return;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify([...mem()].slice(-5000)));
  } catch (e) {
    console.error("Could not write local check-in store", e instanceof Error ? e.message : e);
  }
}

const toVec = (r: { o: number; c: number; e: number; a: number; n: number }): Vec => ({ O: +r.o, C: +r.c, E: +r.e, A: +r.a, N: +r.n });

export async function listCheckins(trackerId: string): Promise<Checkin[]> {
  const d = await db();
  if (d) {
    try {
      const r = await d.pool.query("SELECT time, o, c, e, a, n FROM trait_checkins WHERE tracker_id = $1 ORDER BY time ASC LIMIT $2", [trackerId, MAX_CHECKINS]);
      return r.rows.map((x) => ({ time: new Date(x.time).toISOString(), z: toVec(x) }));
    } catch (e) {
      markDown(e);
    }
  }
  return mem().get(trackerId) ?? [];
}

export async function addCheckin(trackerId: string, z: Vec, time = new Date()): Promise<"ok" | "full"> {
  const d = await db();
  if (d) {
    try {
      const n = await d.pool.query("SELECT count(*)::int AS n FROM trait_checkins WHERE tracker_id = $1", [trackerId]);
      if (n.rows[0].n >= MAX_CHECKINS) return "full";
      await d.pool.query("INSERT INTO trait_checkins (time, tracker_id, o, c, e, a, n) VALUES ($1, $2, $3, $4, $5, $6, $7)", [time, trackerId, z.O, z.C, z.E, z.A, z.N]);
      return "ok";
    } catch (e) {
      markDown(e);
    }
  }
  const list = mem().get(trackerId) ?? [];
  if (list.length >= MAX_CHECKINS) return "full";
  list.push({ time: time.toISOString(), z });
  mem().set(trackerId, list);
  persist();
  return "ok";
}

/** Everyone's check-ins by week for the last 12 weeks. time_bucket() on Tiger Data, date_trunc() elsewhere. */
export async function pulse(): Promise<PulseRow[]> {
  const d = await db();
  if (d) {
    const bucket = d.timescale ? "time_bucket(INTERVAL '7 days', time)" : "date_trunc('week', time)";
    try {
      const r = await d.pool.query(
        `SELECT ${bucket} AS week, count(*)::int AS checkins, avg(o) AS o, avg(c) AS c, avg(e) AS e, avg(a) AS a, avg(n) AS n
         FROM trait_checkins WHERE time > now() - INTERVAL '12 weeks' GROUP BY week ORDER BY week`,
      );
      return r.rows.map((x) => ({ week: new Date(x.week).toISOString(), n: x.checkins, z: toVec(x) }));
    } catch (e) {
      markDown(e);
    }
  }
  const weeks = new Map<string, { n: number; s: Vec }>();
  const cutoff = Date.now() - 12 * 7 * 864e5;
  for (const list of mem().values())
    for (const c of list) {
      const t = new Date(c.time).getTime();
      if (t < cutoff) continue;
      const d0 = new Date(t);
      d0.setUTCHours(0, 0, 0, 0);
      d0.setUTCDate(d0.getUTCDate() - ((d0.getUTCDay() + 6) % 7)); // Monday, like date_trunc('week')
      const k = d0.toISOString();
      const w = weeks.get(k) ?? { n: 0, s: { O: 0, C: 0, E: 0, A: 0, N: 0 } };
      w.n++;
      for (const t of Object.keys(w.s) as (keyof Vec)[]) w.s[t] += c.z[t];
      weeks.set(k, w);
    }
  return [...weeks]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([week, w]) => ({ week, n: w.n, z: Object.fromEntries(Object.entries(w.s).map(([t, v]) => [t, v / w.n])) as Vec }));
}

/** Test hook: forget the cached pool and local rows. */
export function _resetTrackStore() {
  g._pg = undefined;
  g._pgDownUntil = undefined;
  g._checkins = undefined;
}
