"use client";
// Image-first hero: the artwork fills its parent section (which must be `relative`); it scrolls with the page, with no
// scroll-driven effects. Hover: bands of the image near the pointer are plucked sideways like strings (canvas 2D strips on
// damped springs), leaving the hands alone. Reduced motion: a plain static image. If the file is missing, this renders nothing.
//
// Structured so a 3D (r3f) hero can replace it: it owns one layer and reads nothing but the pointer.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const BAND = 7; // px height of one "string"
const REACH = 120; // px around the pointer that gets plucked
const SEGMENTS = 26;

const QUIET: [number, number, number, number] = [0.5, 0.5, 0.2, 0.2];

export type HeroLayer = { src: string; alt?: string; /** px the layer drifts on hover, [x, y] */ drift: [number, number] };

export function PortalImageHero({
  src = "/hero/portals.webp",
  focus = "51% 48%",
  layers = [],
  quiet = QUIET,
}: {
  /** the part of the image the ripple leaves alone, as fractions of the image: [centre x, centre y, radius x, radius y] */
  quiet?: [number, number, number, number];
  src?: string;
  /** object-position: where the crop stays centred on narrow screens (the gap between the fingertips) */
  focus?: string;
  /** optional cut-outs (e.g. each hand on transparent) stacked over the base image */
  layers?: HeroLayer[];
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!ok || !el || !cv) return;
    const shown = el.querySelector("img");
    // next/image reports density-corrected sizes, so draw from a plain copy of the same (already cached) file.
    const img = new window.Image();
    const adopt = () => {
      if (shown?.currentSrc) img.src = shown.currentSrc;
    };
    if (shown?.complete) adopt();
    shown?.addEventListener("load", adopt);
    const ctx = cv.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [fx, fy] = focus.split(" ").map((v) => parseFloat(v) / 100);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let disp = new Float32Array(0);
    let vel = new Float32Array(0);
    let centre = new Float32Array(0);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const n = Math.ceil(h / BAND);
      disp = new Float32Array(n);
      vel = new Float32Array(n);
      centre = new Float32Array(n);
    };
    resize();

    if (reduced || !ctx || !shown) return () => shown?.removeEventListener("load", adopt);

    const ptr = { x: -1, y: -1, vx: 0, vy: 0 };
    let raf = 0;
    let last = 0;
    let live = false;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!img.complete || !img.naturalWidth) return;
      // the same cover-fit the <img> uses
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const ox = (w - img.naturalWidth * scale) * fx;
      const oy = (h - img.naturalHeight * scale) * fy;
      live = false;
      for (let i = 0; i < disp.length; i++) {
        vel[i] += (-170 * disp[i] - 4.6 * vel[i]) * dt;
        disp[i] += vel[i] * dt;
        if (Math.abs(disp[i]) < 0.12 && Math.abs(vel[i]) < 2) continue;
        live = true;
        const y = i * BAND;
        const span = REACH * 2.4;
        const x0 = centre[i] - span / 2;
        const sw = span / SEGMENTS;
        for (let k = 0; k < SEGMENTS; k++) {
          const u = (k + 0.5) / SEGMENTS;
          const fall = Math.sin(Math.PI * u) ** 2; // 0 at the ends, so the seams vanish
          const sx = x0 + k * sw;
          const shift = disp[i] * fall;
          ctx.drawImage(img, (sx - shift - ox) / scale, (y - oy) / scale, (sw + 1) / scale, BAND / scale, sx, y, sw + 1, BAND);
        }
      }
      if (live) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > r.height) {
        ptr.x = -1;
        return;
      }
      if (ptr.x >= 0) {
        ptr.vx = x - ptr.x;
        ptr.vy = y - ptr.y;
      }
      ptr.x = x;
      ptr.y = y;
      el.style.setProperty("--hx", (x / w - 0.5).toFixed(3));
      el.style.setProperty("--hy", (y / h - 0.5).toFixed(3));
      const speed = Math.min(36, Math.hypot(ptr.vx, ptr.vy));
      if (speed < 1 || !img.naturalWidth) return;
      // leave the hands alone: no pluck inside an ellipse around the fingertips (in image coordinates)
      const sc = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const u = (x - (w - img.naturalWidth * sc) * fx) / (img.naturalWidth * sc);
      const v = (y - (h - img.naturalHeight * sc) * fy) / (img.naturalHeight * sc);
      const inside = ((u - quiet[0]) / quiet[2]) ** 2 + ((v - quiet[1]) / quiet[3]) ** 2;
      if (inside < 1) return;
      const edge = Math.min(1, (inside - 1) * 2.5);
      const dir = ptr.vx >= 0 ? 1 : -1;
      const c = Math.floor(y / BAND);
      const n = Math.ceil(REACH / BAND);
      for (let i = Math.max(0, c - n); i <= Math.min(disp.length - 1, c + n); i++) {
        const f = 1 - Math.abs(i - c) / (n + 1);
        vel[i] += dir * (40 + speed * 16) * edge * f * f * (i % 2 ? 1 : 0.55);
        centre[i] = x;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      shown.removeEventListener("load", adopt);
      window.removeEventListener("pointermove", onMove);
    };
  }, [ok, focus, quiet]);

  if (!ok) return null;
  return (
    <div ref={wrap} className="portal-image" aria-hidden="true">
      <Image src={src} alt="" fill priority sizes="100vw" quality={90} className="object-cover" style={{ objectPosition: focus }} onError={() => setOk(false)} />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {layers.map((l) => (
        <Image
          key={l.src}
          src={l.src}
          alt=""
          fill
          sizes="100vw"
          className="portal-image-layer object-cover"
          style={{ objectPosition: focus, "--dx": l.drift[0], "--dy": l.drift[1] } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
