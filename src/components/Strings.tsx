"use client";
import { useEffect, useRef } from "react";

/**
 * Background "strings": a few thin horizontal lines that bend and ripple when the pointer passes near them.
 * Each line is a damped wave on a row of points with fixed ends. One fixed canvas, no pointer events,
 * and the animation loop stops as soon as everything has come to rest.
 */
export function Strings() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const STEP = 28; // px between simulated points
    const TENSION = 0.22; // how fast a ripple travels along the string
    const SPRING = 0.012; // pull back to rest
    const DAMP = 0.965; // energy kept per frame
    const REACH = 90; // px: how close the pointer has to be
    const MAX = 46; // px: largest bend

    type S = { y0: number; y: Float32Array; v: Float32Array; alpha: number };
    let strings: S[] = [];
    let w = 0, h = 0, n = 0, raf = 0, running = false;
    let px = -1e4, py = -1e4, lx = -1e4, ly = -1e4, moved = false;

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 640 ? 4 : w < 1100 ? 6 : 7;
      n = Math.max(8, Math.ceil(w / STEP) + 1);
      strings = Array.from({ length: count }, (_, i) => ({
        y0: Math.round(((i + 0.85) / (count + 0.7)) * h) + 0.5,
        y: new Float32Array(n),
        v: new Float32Array(n),
        alpha: 0.075 + (i % 3) * 0.02,
      }));
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      const dx = w / (n - 1);
      for (const s of strings) {
        ctx.strokeStyle = `rgba(206, 196, 250, ${s.alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, s.y0);
        for (let i = 1; i < n - 1; i++) {
          const mx = (i + 0.5) * dx;
          ctx.quadraticCurveTo(i * dx, s.y0 + s.y[i], mx, s.y0 + (s.y[i] + s.y[i + 1]) / 2);
        }
        ctx.lineTo(w, s.y0);
        ctx.stroke();
      }
    };

    const tick = () => {
      const dx = w / (n - 1);
      let energy = 0;
      const vy = moved ? py - ly : 0;
      const vx = moved ? px - lx : 0;
      const speed = Math.min(40, Math.hypot(vx, vy));
      for (const s of strings) {
        if (moved && speed > 0.5) {
          const c = Math.round(px / dx);
          for (let i = Math.max(1, c - 4); i <= Math.min(n - 2, c + 4); i++) {
            const ddx = i * dx - px;
            const ddy = s.y0 + s.y[i] - py;
            const d = Math.hypot(ddx, ddy);
            if (d < REACH) {
              const f = (1 - d / REACH) ** 2;
              // Push along the pointer's vertical travel, or away from it when it moves sideways.
              const dir = Math.abs(vy) > 1 ? Math.sign(vy) : ddy >= 0 ? 1 : -1;
              s.v[i] += dir * f * speed * 0.09;
            }
          }
        }
        for (let i = 1; i < n - 1; i++) {
          s.v[i] = (s.v[i] + TENSION * (s.y[i - 1] + s.y[i + 1] - 2 * s.y[i]) - SPRING * s.y[i]) * DAMP;
        }
        for (let i = 1; i < n - 1; i++) {
          let y = s.y[i] + s.v[i];
          if (y > MAX) (y = MAX), (s.v[i] = 0);
          else if (y < -MAX) (y = -MAX), (s.v[i] = 0);
          s.y[i] = y;
          energy += Math.abs(y) + Math.abs(s.v[i]) * 4;
        }
      }
      lx = px;
      ly = py;
      moved = false;
      draw();
      if (energy > 0.6) raf = requestAnimationFrame(tick);
      else {
        for (const s of strings) (s.y.fill(0), s.v.fill(0));
        draw();
        running = false;
      }
    };

    const start = () => {
      if (running || document.hidden || still.matches) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      running = false;
    };

    const onMove = (x: number, y: number) => {
      if (still.matches) return;
      if (lx < -1e3) (lx = x), (ly = y);
      px = x;
      py = y;
      moved = true;
      start();
    };
    const onPointer = (e: PointerEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => e.touches[0] && onMove(e.touches[0].clientX, e.touches[0].clientY);
    const onLeave = () => ((lx = -1e4), (ly = -1e4));
    const onVis = () => (document.hidden ? stop() : undefined);
    const onMotion = () => {
      stop();
      layout();
    };
    let rz = 0;
    const onResize = () => {
      clearTimeout(rz);
      rz = window.setTimeout(() => {
        if (window.innerWidth === w && Math.abs(window.innerHeight - h) < 120) return; // mobile URL bar
        stop();
        layout();
      }, 150);
    };

    layout();
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("pointerup", onLeave, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", onResize);
    still.addEventListener("change", onMotion);
    return () => {
      stop();
      clearTimeout(rz);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("pointerup", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      still.removeEventListener("change", onMotion);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
