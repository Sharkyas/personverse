import { NextResponse } from "next/server";
import { saveProfile } from "@/lib/db";
import { buildReport, toPct } from "@/lib/model";
import type { Answers } from "@/lib/questions";

export async function POST(req: Request) {
  try {
    const answers = (await req.json()) as Answers;
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
      },
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }
}
