"use client";
// Depth cues for the results page: a brief "portal" as results open, and faint planes that drift with scroll and pointer.
// Transform and opacity only; both do nothing under prefers-reduced-motion.
import { useEffect, useRef, useState } from "react";

/** An aperture that opens once over the page (~0.7 s) and then removes itself. */
export function Portal() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="portal" aria-hidden="true">
      <span className="portal-veil" />
      <span className="portal-ring" />
      <span className="portal-ring" style={{ animationDelay: "110ms" }} />
      <span className="portal-ring" style={{ animationDelay: "220ms" }} />
    </div>
  );
}

/** Three translucent planes behind the top of the page. Parent must be `relative isolate`. */
export function Planes() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--px", px.toFixed(3));
      el.style.setProperty("--py", py.toFixed(3));
      el.style.setProperty("--sy", String(Math.min(window.scrollY, 1200)));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      queue();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", queue);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className="planes" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
