import { NextResponse } from "next/server";
import { stats } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await stats());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ n: 0, avgPChange: {}, types: [], mode: "error" });
  }
}
