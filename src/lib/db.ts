import { MongoClient, ObjectId, type Collection } from "mongodb";
import fs from "node:fs";
import path from "node:path";

export type ProfileDoc = {
  _id?: ObjectId | string;
  createdAt: Date;
  answers: unknown;
  summary: {
    temperamentType: string;
    nowPct: Record<string, number>;
    babyPct: Record<string, number>;
    pChange: Record<string, number>;
    age: number;
  };
};

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _mem?: Map<string, ProfileDoc>; _mongoDownUntil?: number };

/** Atlas collection, or null if not configured / unreachable. After a failure we skip Atlas for a minute so the demo never hangs. */
async function collection(): Promise<Collection<ProfileDoc> | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (g._mongoDownUntil && Date.now() < g._mongoDownUntil) return null;
  if (!g._mongo) g._mongo = new MongoClient(uri, { serverSelectionTimeoutMS: 4000, connectTimeoutMS: 4000 }).connect();
  try {
    const c = await g._mongo;
    return c.db(process.env.MONGODB_DB || "personalityverse").collection<ProfileDoc>("profiles");
  } catch (e) {
    markDown(e);
    return null;
  }
}

function markDown(e: unknown) {
  console.error("MongoDB unavailable, using memory store for 60 s:", e instanceof Error ? e.message : e);
  g._mongo = undefined;
  g._mongoDownUntil = Date.now() + 60_000;
}

export async function dbStatus(): Promise<"atlas" | "memory" | "atlas-down"> {
  if (!process.env.MONGODB_URI) return "memory";
  return (await collection()) ? "atlas" : "atlas-down";
}

// Without Atlas, profiles live in memory and are mirrored to a small JSON file so share links survive restarts.
const FILE = path.join(process.env.DATA_DIR || ".data", "profiles.json");
function mem(): Map<string, ProfileDoc> {
  if (g._mem) return g._mem;
  g._mem = new Map();
  if (process.env.NODE_ENV !== "test") {
    try {
      const rows = JSON.parse(fs.readFileSync(FILE, "utf8")) as [string, ProfileDoc][];
      for (const [k, v] of rows) g._mem.set(k, { ...v, createdAt: new Date(v.createdAt) });
    } catch {}
  }
  return g._mem;
}
let flushTimer: NodeJS.Timeout | null = null;
function persist() {
  if (process.env.NODE_ENV === "test" || flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      const rows = [...mem()].slice(-5000);
      fs.writeFileSync(FILE, JSON.stringify(rows));
    } catch (e) {
      console.error("Could not write local profile store", e instanceof Error ? e.message : e);
    }
  }, 300);
}
export const dbMode = () => (process.env.MONGODB_URI ? "atlas" : "memory");

export async function saveProfile(doc: ProfileDoc): Promise<string> {
  const c = await collection();
  if (c) {
    try {
      const { _id, ...rest } = doc;
      void _id;
      const r = await c.insertOne(rest as ProfileDoc);
      return r.insertedId.toString();
    } catch (e) {
      markDown(e);
    }
  }
  const id = Math.random().toString(36).slice(2, 10);
  mem().set(id, { ...doc, _id: id });
  persist();
  return id;
}

export async function getProfile(id: string): Promise<ProfileDoc | null> {
  const local = mem().get(id);
  if (local) return local;
  const c = await collection();
  if (c && ObjectId.isValid(id)) {
    try {
      return await c.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      markDown(e);
    }
  }
  return null;
}

export async function stats() {
  const c = await collection();
  const traits = ["O", "C", "E", "A", "N"];
  if (c) try {
    const [agg] = await c
      .aggregate([
        {
          $group: {
            _id: null,
            n: { $sum: 1 },
            ...Object.fromEntries(traits.map((t) => [`p${t}`, { $avg: `$summary.pChange.${t}` }])),
          },
        },
      ])
      .toArray();
    const types = await c.aggregate([{ $group: { _id: "$summary.temperamentType", n: { $sum: 1 } } }]).toArray();
    return { n: agg?.n ?? 0, avgPChange: Object.fromEntries(traits.map((t) => [t, agg?.[`p${t}`] ?? null])), types, mode: "atlas" };
  } catch (e) {
    markDown(e);
  }
  const docs = [...mem().values()];
  const n = docs.length;
  const avg = Object.fromEntries(traits.map((t) => [t, n ? docs.reduce((s, d) => s + (d.summary.pChange[t] ?? 0), 0) / n : null]));
  const typeMap = new Map<string, number>();
  docs.forEach((d) => typeMap.set(d.summary.temperamentType, (typeMap.get(d.summary.temperamentType) ?? 0) + 1));
  return { n, avgPChange: avg, types: [...typeMap].map(([k, v]) => ({ _id: k, n: v })), mode: "memory" };
}
