import { NextResponse } from "next/server";
import { generateJSON, aiAvailable } from "@/lib/ai";
import { TRAITS } from "@/lib/params";
import { rateLimited } from "@/lib/rateLimit";
import { cleanText } from "@/lib/questions";
import { buildCoachPrompt } from "@/lib/coachPrompt";
import { liftStrayKeys } from "@/lib/liftStrayKeys";
import { libraryPlan, type CoachPlan, type CoachRequest as Body } from "@/lib/coachLibrary";

export type { CoachPlan };

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  b.name = cleanText(b.name, 30);
  b.targetName = cleanText(b.targetName, 40);
  b.temperamentType = cleanText(b.temperamentType, 40) ?? "mixed";
  const fallback = libraryPlan(b);
  if (!(await aiAvailable())) return NextResponse.json(fallback);
  // Over the limit: still answer, from the library, so the page never breaks.
  if (rateLimited(req, "ai", 40)) return NextResponse.json(fallback);

  const prompt = buildCoachPrompt(b);

  const res = await generateJSON<Omit<CoachPlan, "source">>(prompt);
  const ai = res?.data;
  if (ai && Array.isArray(ai.weeks)) liftStrayKeys(ai as unknown as Record<string, unknown>);
  if (!ai || !Array.isArray(ai.weeks) || !ai.summary) return NextResponse.json(fallback);
  ai.weeks = ai.weeks.filter((w) => TRAITS.includes(w.trait)).slice(0, 8);
  if (!ai.weeks.length) ai.weeks = fallback.weeks;
  if (!Array.isArray(ai.ifThen) || !ai.ifThen.length) ai.ifThen = fallback.ifThen;
  if (typeof ai.narration !== "string" || ai.narration.length < 40) ai.narration = fallback.narration;
  return NextResponse.json({ ...fallback, ...ai, source: "ai", model: res.model });
}
