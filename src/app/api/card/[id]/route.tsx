import { getProfile } from "@/lib/db";
import { renderCard } from "@/lib/card";
import type { Answers } from "@/lib/questions";

// GET /api/card/:id            → 1200×630 link preview
// GET /api/card/:id?format=story → 1080×1920 story card (add &download=1 to save it)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getProfile(id);
  if (!doc) return new Response("Not found", { status: 404 });
  const u = new URL(req.url);
  const format = u.searchParams.get("format") === "story" ? "story" : "og";
  const site = (process.env.SITE_URL || "").replace(/^https?:\/\//, "");
  const res = renderCard(doc.answers as Answers, format, site || undefined);
  if (u.searchParams.get("download")) res.headers.set("Content-Disposition", `attachment; filename="personalityverse-${format}.png"`);
  return res;
}
