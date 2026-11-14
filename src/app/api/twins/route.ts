import { NextResponse } from "next/server";
import { babyTwins } from "@/lib/db";
import { TRAITS } from "@/lib/params";
import { rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// POST { baby: {O,C,E,A,N percentiles}, exclude?: profile id } → where the people who started life most like you are now
export async function POST(req: Request) {
  const limited = rateLimited(req, "twins", 200);
  if (limited) return limited;
  let body: { baby?: Record<string, unknown>; exclude?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const baby = Object.fromEntries(TRAITS.map((t) => [t, Math.min(100, Math.max(0, Number(body.baby?.[t]) || 50))]));
  const exclude = typeof body.exclude === "string" && /^[a-z0-9]{6,32}$/i.test(body.exclude) ? body.exclude : undefined;
  try {
    return NextResponse.json(await babyTwins(baby, exclude));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ n: 0 });
  }
}
