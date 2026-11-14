"use client";
import { useEffect, useRef, useState } from "react";

const BARS = 7;

/**
 * Reads the results aloud. While the voice speaks, a small set of level bars moves with it: driven by the real audio
 * through a Web Audio AnalyserNode for recorded speech, and by a gentle speech-like pulse for the browser's own voice
 * (which gives no audio to analyse). Still when silent, and still under reduced motion.
 */
export function Narrator({ text, label = "Listen to your results", voice = "narrator" }: { text: string; label?: string; voice?: "narrator" | "future" }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [unavailable, setUnavailable] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const raf = useRef(0);

  function stop() {
    audio.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setState("idle");
  }

  useEffect(() => () => {
    audio.current?.pause();
    cancelAnimationFrame(raf.current);
    void ctx.current?.close();
  }, []);

  // animate the bars while playing; rest them otherwise
  useEffect(() => {
    const els = bars.current;
    const rest = () => els.forEach((el) => el && (el.style.transform = "scaleY(0.18)"));
    if (state !== "playing" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      rest();
      return;
    }
    const data = analyser.current ? new Uint8Array(analyser.current.frequencyBinCount) : null;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (analyser.current && data) {
        analyser.current.getByteFrequencyData(data);
        // speech sits mostly in the lower bins: spread them over the bars
        const span = Math.max(1, Math.floor((data.length * 0.45) / BARS));
        els.forEach((el, i) => {
          let s = 0;
          for (let k = 0; k < span; k++) s += data[i * span + k];
          const v = Math.min(1, s / span / 190);
          if (el) el.style.transform = `scaleY(${(0.18 + 0.82 * v).toFixed(3)})`;
        });
      } else {
        const t = (now - t0) / 1000;
        els.forEach((el, i) => {
          const v = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7) * Math.sin(t * 2.3 + i);
          if (el) el.style.transform = `scaleY(${(0.2 + 0.7 * Math.abs(v)).toFixed(3)})`;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      rest();
    };
  }, [state]);

  function meter(el: HTMLAudioElement) {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx.current ??= new AC();
      const src = ctx.current.createMediaElementSource(el);
      const an = ctx.current.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0.7;
      src.connect(an);
      an.connect(ctx.current.destination);
      analyser.current = an;
      void ctx.current.resume();
    } catch {
      analyser.current = null;
    }
  }

  async function play() {
    if (state === "playing") return stop();
    setState("loading");
    setUnavailable(false);
    try {
      const r = await fetch("/api/narrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice }) });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        audio.current = new Audio(url);
        audio.current.onended = () => setState("idle");
        meter(audio.current);
        await audio.current.play();
        setState("playing");
        return;
      }
    } catch {}
    // Fallback: browser speech
    analyser.current = null;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setUnavailable(true);
      setState("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    if (voice === "future") u.pitch = 0.9;
    u.onend = () => setState("idle");
    window.speechSynthesis.speak(u);
    setState("playing");
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={play} className="btn btn-ghost" aria-live="polite">
        {state === "loading" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : state === "playing" ? (
          <span aria-hidden="true" className="text-[10px]">■</span>
        ) : (
          <span aria-hidden="true" className="text-[10px]">▶</span>
        )}
        {state === "playing" ? "Stop" : label}
      </button>
      <span aria-hidden="true" className={`voice-meter ${state === "playing" ? "is-on" : ""}`}>
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} ref={(el) => void (bars.current[i] = el)} />
        ))}
      </span>
      {unavailable && <span className="text-xs text-[var(--color-muted)]">No audio on this device</span>}
    </div>
  );
}
