import { NextResponse } from "next/server";
import { getProfile } from "@/lib/db";
import { currentZ } from "@/lib/model";
import { sanitizeAnswers } from "@/lib/questions";
import { rateLimited } from "@/lib/rateLimit";
import { addCheckin, listCheckins, pulse, trackStatus } from "@/lib/trackStore";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const validId = (id: string) => /^[a-z0-9]{6,32}$/i.test(id);

/** A tracker's check-ins, plus everyone's weekly pulse. The tracker id is the id of the first result (the baseline). */
export async function GET(req: Request, { params }: Ctx) {
  const limited = rateLimited(req, "track-read", 300);
  if (limited) return limited;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [checkins, weekly, store] = await Promise.all([listCheckins(id), pulse(), trackStatus()]);
  return NextResponse.json({ checkins, pulse: weekly, store });
}

/** Add a check-in: the ten TIPI answers only. Scored on the server with the same norms as the full test. */
export async function POST(req: Request, { params }: Ctx) {
  const limited = rateLimited(req, "track-write", 30);
  if (limited) return limited;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const raw = await req.text();
  if (raw.length > 2000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: { tipi?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const tipi = body.tipi;
  if (!Array.isArray(tipi) || tipi.length !== 10 || !tipi.every((v) => Number.isInteger(v) && v >= 1 && v <= 7))
    return NextResponse.json({ error: "Send ten answers from 1 to 7" }, { status: 400 });
  const doc = await getProfile(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const z = currentZ({ ...sanitizeAnswers(doc.answers), tipi: tipi as number[] });
  const r = await addCheckin(id, z);
  if (r === "full") return NextResponse.json({ error: "This tracker is full" }, { status: 409 });
  const [checkins, weekly, store] = await Promise.all([listCheckins(id), pulse(), trackStatus()]);
  return NextResponse.json({ ok: true, checkins, pulse: weekly, store });
}
