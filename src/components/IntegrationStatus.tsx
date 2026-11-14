"use client";
import { useEffect, useState } from "react";

type Health = { ai: { live: boolean; provider?: "local" | "gemini-api"; models?: string[] }; voice: { live: boolean }; db: string };

export function IntegrationStatus() {
  const [h, setH] = useState<Health | null>(null);
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setH).catch(() => {});
  }, []);
  if (!h) return null;
  const chip = (label: string, live: boolean, detail: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[11px]">
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`} />
      <b className="font-medium text-white">{label}</b> {detail}
    </span>
  );
  const raw = h.ai.models?.[0] ?? "";
  const model = raw.replace(/-it$/, "").replace(/^gemma-?/i, "Gemma ").replace(/[-:]/g, " ").trim();
  return (
    <div className="flex flex-wrap gap-2">
      {chip("Coach", h.ai.live, !h.ai.live ? "offline challenge library" : h.ai.provider === "local" ? `${model}, running locally` : `${model} via Gemini API`)}
      {chip("Voice", h.voice.live, h.voice.live ? "ElevenLabs" : "browser speech")}
      {chip("Data", h.db === "atlas", h.db === "atlas" ? "MongoDB Atlas" : "local store")}
    </div>
  );
}
