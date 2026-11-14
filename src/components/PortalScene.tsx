"use client";
// Two hollow square portals, drawn as fine parallel strings on a 2D canvas with a small hand-rolled 3D projection.
// Pointer: strings near the cursor are plucked (a damped spring per string). Scroll: the frames twist, roll and
// close into the opposite faces of a cube. No dependencies; static under prefers-reduced-motion.
import { useEffect, useRef } from "react";

type V = [number, number, number];
type Quad = { a0: V; a1: V; b0: V; b1: V; n: V };
type Pose = { pos: V; rot: V };

const R = 1; // outer half-size of a frame
const IN = 0.62; // inner half-size
const H = 0.26; // half-depth
const CAM = 6.2;
const FOCAL = 5;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function rotate(p: V, r: V): V {
  let [x, y, z] = p;
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(r[0]), Math.sin(r[0]), Math.cos(r[1]), Math.sin(r[1]), Math.cos(r[2]), Math.sin(r[2])];
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  [x, y] = [x * cz - y * sz, x * sz + y * cz];
  return [x, y, z];
}
const rotZ90 = (p: V, k: number): V => {
  let [x, y] = p;
  for (let i = 0; i < k; i++) [x, y] = [-y, x];
  return [x, y, p[2]];
};

/** The 16 faces of one frame in local space: per side an outer wall, an inner wall, and a front and back trapezoid. */
function frameQuads(): Quad[] {
  const out: Quad[] = [];
  for (let k = 0; k < 4; k++) {
    const q = (a0: V, a1: V, b0: V, b1: V, n: V) => out.push({ a0: rotZ90(a0, k), a1: rotZ90(a1, k), b0: rotZ90(b0, k), b1: rotZ90(b1, k), n: rotZ90(n, k) });
    q([-R, R, -H], [R, R, -H], [-R, R, H], [R, R, H], [0, 1, 0]);
    q([-IN, IN, -H], [IN, IN, -H], [-IN, IN, H], [IN, IN, H], [0, -1, 0]);
    q([-R, R, H], [R, R, H], [-IN, IN, H], [IN, IN, H], [0, 0, 1]);
    q([-R, R, -H], [R, R, -H], [-IN, IN, -H], [IN, IN, -H], [0, 0, -1]);
  }
  return out;
}
const QUADS = frameQuads();

type RGB = [number, number, number];
const PALETTES: RGB[][] = [
  [
    [255, 72, 164],
    [255, 146, 72],
    [255, 226, 84],
  ],
  [
    [98, 70, 255],
    [178, 76, 255],
    [255, 104, 178],
  ],
];
function ramp(stops: RGB[], t: number): RGB {
  const x = clamp01(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  return [lerp(stops[i][0], stops[i + 1][0], f), lerp(stops[i][1], stops[i + 1][1], f), lerp(stops[i][2], stops[i + 1][2], f)];
}
const tone = (p: V) => (p[1] * 0.8 + p[0] * 0.55) / (2.7 * R) + 0.5;
const css = (c: RGB, k = 1, a = 1) => `rgba(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0},${a})`;
const lighten = (c: RGB, w: number): RGB => [lerp(c[0], 255, w), lerp(c[1], 255, w), lerp(c[2], 255, w)];

// Key poses: [top of page, mid-scroll twist, cube]. The cube pose puts the two frames on opposite faces.
const CUBE_ROT: V = [0.48, 0.74, 0];
const CUBE_OFF = R - H;
const POSES: Pose[][] = [
  [
    { pos: [-1.4, -0.6, 0.2], rot: [0.62, 0.95, -0.42] },
    { pos: [-0.75, 0.05, 0], rot: [1.75, 2.3, 0.7] },
    { pos: rotate([0, 0, -CUBE_OFF], CUBE_ROT), rot: [CUBE_ROT[0], CUBE_ROT[1] + Math.PI * 2, 0] },
  ],
  [
    { pos: [1.5, 0.6, -0.4], rot: [0.5, -0.9, 0.36] },
    { pos: [0.8, -0.1, 0], rot: [-1.2, -2.5, -0.8] },
    { pos: rotate([0, 0, CUBE_OFF], CUBE_ROT), rot: [CUBE_ROT[0], CUBE_ROT[1] - Math.PI * 2, 0] },
  ],
];
function poseAt(f: number, p: number): Pose {
  const [a, b, c] = POSES[f];
  if (p < 0.5) {
    const t = smooth(0, 1, p * 2);
    return { pos: lerpV(a.pos, b.pos, t), rot: lerpV(a.rot, b.rot, t) };
  }
  const t = smooth(0, 1, (p - 0.5) * 2);
  return { pos: lerpV(b.pos, c.pos, t), rot: lerpV(b.rot, c.rot, t) };
}

const ANCHOR: [number, number, number, number] = [0.71, 0.5, 0.72, 0.52];

export function PortalScene({
  range = 1.6,
  exit = 2.75,
  className = "",
  anchor = ANCHOR,
}: {
  /** how many viewport heights of scrolling take the frames from portals to cube */
  range?: number;
  /** scroll distance (in viewport heights) by which the whole scene has faded out; 0 keeps it */
  exit?: number;
  className?: string;
  /** scene centre as a fraction of the canvas: [x at top, y at top, x as a cube, y as a cube] (wide screens) */
  anchor?: [number, number, number, number];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let narrow = false;
    let N = 13;
    let disp = new Float32Array(0);
    let vel = new Float32Array(0);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      narrow = w < 720;
      const n = narrow ? 9 : 13;
      if (n !== N || !disp.length) {
        N = n;
        disp = new Float32Array(2 * QUADS.length * N);
        vel = new Float32Array(2 * QUADS.length * N);
      }
    };
    resize();

    const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, fresh: false };
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (ptr.x > -9000) {
        ptr.vx = x - ptr.x;
        ptr.vy = y - ptr.y;
      }
      ptr.x = x;
      ptr.y = y;
      ptr.fresh = true;
    };

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const draw = (now: number) => {
      raf = reduced ? 0 : requestAnimationFrame(draw);
      const scrolled = window.scrollY / window.innerHeight;
      const real = clamp01(scrolled / range);
      const out = exit ? smooth(exit - 0.7, exit, scrolled) : 0;
      if (skyRef.current) skyRef.current.style.opacity = String(1 - smooth(0.42, 0.9, real));
      if (wrapRef.current) wrapRef.current.style.opacity = String(1 - out);
      if (out >= 1) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const time = reduced ? 0 : (now - t0) / 1000;
      const p = reduced ? 0 : real;

      const unit = Math.min(w, h * 1.25) * (narrow ? 0.2 : 0.158);
      const cx = w * (narrow ? 0.5 : lerp(anchor[0], anchor[2], smooth(0.3, 1, p)));
      const cy = h * (narrow ? lerp(0.74, 0.6, p) : lerp(anchor[1], anchor[3], p));
      const project = (v: V): [number, number, number] => {
        const s = (FOCAL / (CAM - v[2])) * unit;
        return [cx + v[0] * s, cy - v[1] * s, v[2]];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const spin = smooth(0.8, 1, p) * time * 0.12;
      const faces: { z: number; f: number; qi: number; pts: [number, number, number][]; shade: number; q: Quad }[] = [];
      const world: ((v: V) => V)[] = [];
      for (let f = 0; f < 2; f++) {
        const pose = poseAt(f, p);
        const bob: V = [Math.sin(time * 0.5 + f * 2) * 0.035, Math.cos(time * 0.4 + f) * 0.045, Math.sin(time * 0.33 + f * 1.3) * 0.03];
        const k = 1 - smooth(0.7, 1, p);
        const rot: V = [pose.rot[0] + bob[0] * k, pose.rot[1] + bob[1] * k, pose.rot[2] + bob[2] * k];
        const float = Math.sin(time * 0.6 + f * 1.7) * 0.06 * k;
        const toWorld = (v: V): V => {
          let r = rotate(v, rot);
          r = [r[0] + pose.pos[0], r[1] + pose.pos[1] + float, r[2] + pose.pos[2]];
          return spin ? rotate(r, [0, spin, 0]) : r;
        };
        world.push(toWorld);
        const origin = toWorld([0, 0, 0]);
        QUADS.forEach((q, qi) => {
          const c = toWorld([(q.a0[0] + q.a1[0] + q.b0[0] + q.b1[0]) / 4, (q.a0[1] + q.a1[1] + q.b0[1] + q.b1[1]) / 4, (q.a0[2] + q.a1[2] + q.b0[2] + q.b1[2]) / 4]);
          const tip = toWorld(q.n);
          const n: V = [tip[0] - origin[0], tip[1] - origin[1], tip[2] - origin[2]];
          const view: V = [-c[0], -c[1], CAM - c[2]];
          if (n[0] * view[0] + n[1] * view[1] + n[2] * view[2] <= 0) return;
          const shade = 0.74 + 0.36 * Math.max(0, n[0] * -0.35 + n[1] * 0.6 + n[2] * 0.72);
          faces.push({ z: c[2], f, qi, shade, q, pts: [project(toWorld(q.a0)), project(toWorld(q.a1)), project(toWorld(q.b1)), project(toWorld(q.b0))] });
        });
      }
      faces.sort((x, y) => x.z - y.z);

      // cube edges: strings that join the two frames once they face each other
      const edge = smooth(0.72, 1, p);
      const drawEdges = (front: boolean) => {
        if (edge <= 0) return;
        ctx.lineWidth = 1;
        for (const sx of [-1, 1])
          for (const sy of [-1, 1])
            for (let j = 0; j < 5; j++) {
              const o = R - j * 0.055;
              const a = world[0]([sx * o, sy * R, H]);
              const b = world[1]([sx * o, sy * R, -H]);
              if ((a[2] + b[2]) / 2 > 0 !== front) continue;
              const pa = project(a);
              const pb = project(b);
              const g = ctx.createLinearGradient(pa[0], pa[1], pb[0], pb[1]);
              g.addColorStop(0, css(ramp(PALETTES[0], tone([sx * o, sy * R, 0])), 1, edge * 0.9));
              g.addColorStop(1, css(ramp(PALETTES[1], tone([sx * o, sy * R, 0])), 1, edge * 0.9));
              ctx.strokeStyle = g;
              ctx.beginPath();
              ctx.moveTo(pa[0], pa[1]);
              ctx.lineTo(pa[0] + (pb[0] - pa[0]) * edge, pa[1] + (pb[1] - pa[1]) * edge);
              ctx.stroke();
            }
      };
      drawEdges(false);

      const speed = Math.min(40, Math.hypot(ptr.vx, ptr.vy));
      const reach = narrow ? 60 : 90;
      for (const fc of faces) {
        const [A0, A1, B1, B0] = fc.pts;
        const c0 = ramp(PALETTES[fc.f], tone(lerpV(fc.q.a0, fc.q.b0, 0.5)));
        const c1 = ramp(PALETTES[fc.f], tone(lerpV(fc.q.a1, fc.q.b1, 0.5)));
        const g = ctx.createLinearGradient((A0[0] + B0[0]) / 2, (A0[1] + B0[1]) / 2, (A1[0] + B1[0]) / 2, (A1[1] + B1[1]) / 2);
        g.addColorStop(0, css(c0, fc.shade, 0.94));
        g.addColorStop(1, css(c1, fc.shade, 0.94));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(A0[0], A0[1]);
        ctx.lineTo(A1[0], A1[1]);
        ctx.lineTo(B1[0], B1[1]);
        ctx.lineTo(B0[0], B0[1]);
        ctx.closePath();
        ctx.fill();
        // the strings
        ctx.strokeStyle = css(lighten(ramp(PALETTES[fc.f], 0.5), 0.72), 1, 0.5);
        ctx.lineWidth = 0.9;
        const base = (fc.f * QUADS.length + fc.qi) * N;
        for (let i = 0; i < N; i++) {
          const u = (i + 0.5) / N;
          const x0 = lerp(A0[0], B0[0], u);
          const y0 = lerp(A0[1], B0[1], u);
          const x1 = lerp(A1[0], B1[0], u);
          const y1 = lerp(A1[1], B1[1], u);
          const mx = (x0 + x1) / 2;
          const my = (y0 + y1) / 2;
          const len = Math.hypot(x1 - x0, y1 - y0) || 1;
          const nx = -(y1 - y0) / len;
          const ny = (x1 - x0) / len;
          const id = base + i;
          if (!reduced) {
            if (ptr.fresh && speed > 0.5) {
              // distance from the pointer to this string
              const tt = clamp01(((ptr.x - x0) * (x1 - x0) + (ptr.y - y0) * (y1 - y0)) / (len * len));
              const d = Math.hypot(ptr.x - (x0 + (x1 - x0) * tt), ptr.y - (y0 + (y1 - y0) * tt));
              if (d < reach) {
                const push = ptr.vx * nx + ptr.vy * ny;
                vel[id] += (push >= 0 ? 1 : -1) * Math.min(26, 6 + speed) * (1 - d / reach) ** 2 * 9;
              }
            }
            vel[id] += (-190 * disp[id] - 5.2 * vel[id]) * dt;
            disp[id] += vel[id] * dt;
            if (disp[id] > 22) disp[id] = 22;
            else if (disp[id] < -22) disp[id] = -22;
          }
          const dsp = disp[id];
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          if (Math.abs(dsp) > 0.05) ctx.quadraticCurveTo(mx + nx * dsp * 2, my + ny * dsp * 2, x1, y1);
          else ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }
      ptr.fresh = false;
      ptr.vx *= 0.6;
      ptr.vy *= 0.6;
      drawEdges(true);

      // the gap: a thread of light arcing between the two openings, about to touch
      const gap = 1 - smooth(0.12, 0.42, p);
      if (gap > 0) {
        const a = project(world[0]([0.2, 0.1, H]));
        const b = project(world[1]([-0.2, -0.1, H]));
        const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - unit * 0.32];
        for (let j = -1; j <= 1; j++) {
          const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
          g.addColorStop(0, css(PALETTES[0][2], 1, 0));
          g.addColorStop(0.5, `rgba(255,255,255,${0.95 * gap})`);
          g.addColorStop(1, css(PALETTES[1][1], 1, 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = j === 0 ? 1.4 : 0.8;
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.quadraticCurveTo(mid[0], mid[1] + j * 7 + Math.sin(time * 2 + j) * 3, b[0], b[1]);
          ctx.stroke();
        }
        const px = (a[0] + 2 * mid[0] + b[0]) / 4;
        const py = (a[1] + 2 * mid[1] + b[1]) / 4;
        const rr = unit * (0.2 + 0.03 * Math.sin(time * 2.4));
        const glow = ctx.createRadialGradient(px, py, 0, px, py, rr);
        glow.addColorStop(0, `rgba(255,255,255,${gap})`);
        glow.addColorStop(0.18, `rgba(255,244,214,${0.75 * gap})`);
        glow.addColorStop(1, "rgba(255,220,240,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(performance.now());
    });
    ro.observe(cv);
    const onVis = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw);
    };
    const onScrollStatic = () => {
      if (!raf) raf = requestAnimationFrame((t) => ((raf = 0), draw(t)));
    };
    if (reduced) {
      draw(performance.now());
      window.addEventListener("scroll", onScrollStatic, { passive: true });
    } else {
      raf = requestAnimationFrame(draw);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScrollStatic);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [range, exit, anchor]);

  return (
    <div ref={wrapRef} className={`portal-scene ${className}`} aria-hidden="true">
      <div ref={skyRef} className="portal-sky" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
