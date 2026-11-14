import { NextResponse } from "next/server";
import { saveProfile } from "@/lib/db";
import { buildReport, toPct } from "@/lib/model";
import { sanitizeAnswers, DEMO_ANSWERS } from "@/lib/questions";

export async function POST(req: Request) {
  const body = await req.text();
  if (body.length > 10_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const answers = sanitizeAnswers(raw);
    const r = buildReport(answers);
    const pChange = Object.fromEntries(r.future.map((f) => [f.trait, f.pChange]));
    const safeAnswers = { ...answers, name: undefined };
    const id = await saveProfile({
      createdAt: new Date(),
      answers: safeAnswers,
      summary: {
        temperamentType: r.temperamentType.label,
        nowPct: toPct(r.now),
        babyPct: toPct(r.temperament),
        pChange,
        age: answers.age,
        ...(isSample(answers) ? { demo: true } : {}),
      },
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }
}

const strip = (a: object) => JSON.stringify({ ...a, name: undefined });
const isSample = (a: object) => strip(a) === strip(sanitizeAnswers(DEMO_ANSWERS));
