import { it, expect } from "vitest";

// Runs only against a real MongoDB: MONGO_TEST_URI=mongodb://127.0.0.1:27017 npm test
const URI = process.env.MONGO_TEST_URI;
it.skipIf(!URI)("real MongoDB: save, get, stats, twins, demo flag", async () => {
  process.env.MONGODB_URI = URI;
  process.env.MONGODB_DB = "pv_test_" + Date.now();
  const db = await import("@/lib/db");
  expect(await db.dbStatus()).toBe("atlas");
  const doc = (baby: number, now: number, demo = false) => ({ createdAt: new Date(), answers: {}, summary: { temperamentType: "Easy", nowPct: { O: now, C: now, E: now, A: now, N: now }, babyPct: { O: baby, C: baby, E: baby, A: baby, N: baby }, pChange: { O: .5, C: .5, E: .5, A: .5, N: .5 }, age: 20, ...(demo ? { demo } : {}) } });
  const me = await db.saveProfile(doc(10, 99));
  for (let i = 0; i < 3; i++) await db.saveProfile(doc(11, 30));
  await db.saveProfile(doc(10, 0, true));
  await db.saveProfile(doc(90, 80));
  expect((await db.getProfile(me))?.summary.nowPct.O).toBe(99);
  const t = await db.babyTwins({ O: 10, C: 10, E: 10, A: 10, N: 10 }, me, 3);
  expect(t.mode).toBe("atlas");
  expect(t.n).toBe(3);
  expect(t.avgNow.O).toBe(30);
  const s = await db.stats();
  expect(s.mode).toBe("atlas");
  expect(s.n).toBe(5); // the sample profile is not counted
  const { MongoClient } = await import("mongodb");
  const c = await new MongoClient(URI!).connect();
  await c.db(process.env.MONGODB_DB).dropDatabase();
  await c.close();
}, 20000);
