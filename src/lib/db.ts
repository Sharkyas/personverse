import { MongoClient, ObjectId, type Collection } from "mongodb";

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

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _mem?: Map<string, ProfileDoc> };

async function collection(): Promise<Collection<ProfileDoc> | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!g._mongo) g._mongo = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
  try {
    const c = await g._mongo;
    return c.db(process.env.MONGODB_DB || "personalityverse").collection<ProfileDoc>("profiles");
  } catch (e) {
    console.error("Mongo connect failed, using memory store", e);
    g._mongo = undefined;
    return null;
  }
}

const mem = () => (g._mem ??= new Map());
export const dbMode = () => (process.env.MONGODB_URI ? "atlas" : "memory");

export async function saveProfile(doc: ProfileDoc): Promise<string> {
  const c = await collection();
  if (c) {
    const r = await c.insertOne({ ...doc, _id: undefined } as ProfileDoc);
    return r.insertedId.toString();
  }
  const id = Math.random().toString(36).slice(2, 10);
  mem().set(id, { ...doc, _id: id });
  return id;
}

export async function getProfile(id: string): Promise<ProfileDoc | null> {
  const c = await collection();
  if (c) {
    if (!ObjectId.isValid(id)) return null;
    return c.findOne({ _id: new ObjectId(id) });
  }
  return mem().get(id) ?? null;
}

export async function stats() {
  const c = await collection();
  const traits = ["O", "C", "E", "A", "N"];
  if (c) {
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
  }
  const docs = [...mem().values()];
  const n = docs.length;
  const avg = Object.fromEntries(traits.map((t) => [t, n ? docs.reduce((s, d) => s + (d.summary.pChange[t] ?? 0), 0) / n : null]));
  const typeMap = new Map<string, number>();
  docs.forEach((d) => typeMap.set(d.summary.temperamentType, (typeMap.get(d.summary.temperamentType) ?? 0) + 1));
  return { n, avgPChange: avg, types: [...typeMap].map(([k, v]) => ({ _id: k, n: v })), mode: "memory" };
}
