"use client";
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animates numbers toward their targets whenever the targets change. */
export function useTween<T extends Record<string, number>>(target: T, ms = 700, from?: T): T {
  const [v, setV] = useState<T>(from ?? target);
  const cur = useRef<T>(from ?? target);
  const key = JSON.stringify(target);
  useEffect(() => {
    if (reduced()) {
      cur.current = target;
      setV(target);
      return;
    }
    const start = { ...cur.current };
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const next = {} as Record<string, number>;
      for (const p of Object.keys(target)) next[p] = (start[p] ?? 0) + ((target[p] ?? 0) - (start[p] ?? 0)) * e;
      cur.current = next as T;
      setV(next as T);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ms]);
  return v;
}

/** A number that counts up to `value` when it scrolls into view. */
export function CountUp({ value, suffix = "", ms = 900 }: { value: number; suffix?: string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const v = useTween({ x: seen ? value : 0 }, ms, { x: 0 });
  return (
    <span ref={ref} className="tabular-nums">
      {Math.round(v.x)}
      {suffix}
    </span>
  );
}

/** Fades children up the first time they scroll into view. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || reduced()) return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(18px)",
        transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
