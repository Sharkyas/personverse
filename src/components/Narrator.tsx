"use client";
import { useRef, useState } from "react";

export function Narrator({ text, label = "Listen to your results", voice = "narrator" }: { text: string; label?: string; voice?: "narrator" | "future" }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [engine, setEngine] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  function stop() {
    audio.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setState("idle");
  }

  async function play() {
    if (state === "playing") return stop();
    setState("loading");
    try {
      const r = await fetch("/api/narrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice }) });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        audio.current = new Audio(url);
        audio.current.onended = () => setState("idle");
        await audio.current.play();
        setEngine("ElevenLabs");
        setState("playing");
        return;
      }
    } catch {}
    // Fallback: browser speech
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setEngine("no audio on this device");
      setState("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    if (voice === "future") u.pitch = 0.9;
    u.onend = () => setState("idle");
    window.speechSynthesis.speak(u);
    setEngine("browser voice");
    setState("playing");
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={play} className="btn btn-ghost" aria-live="polite">
        {state === "loading" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : state === "playing" ? (
          "■"
        ) : (
          "▶"
        )}
        {state === "playing" ? "Stop" : label}
      </button>
      {engine && <span className="text-xs text-[var(--color-muted)]">Voice: {engine}</span>}
    </div>
  );
}
