import { NextResponse } from "next/server";
import { getProfile } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getProfile(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ answers: doc.answers, createdAt: doc.createdAt });
}
