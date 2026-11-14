import { ImageResponse } from "next/og";
import { buildReport, toPct } from "./model";
import { TRAITS, TRAIT_META, type Trait } from "./params";
import { nearestCelebs } from "./celebs";
import { closestType } from "./mbti";
import type { Answers } from "./questions";

type Format = "og" | "story";
const SIZES: Record<Format, { width: number; height: number }> = { og: { width: 1200, height: 630 }, story: { width: 1080, height: 1920 } };

function radar(values: Record<Trait, number>[], colors: string[], dashed: boolean[], size: number) {
  const c = size / 2;
  const R = size * 0.38;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return `${c + Math.cos(a) * R * (v / 100)},${c + Math.sin(a) * R * (v / 100)}`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[25, 50, 75, 100].map((g) => (
        <polygon key={g} points={TRAITS.map((_, i) => pt(i, g)).join(" ")} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      ))}
      {values.map((v, k) => (
        <polygon
          key={k}
          points={TRAITS.map((t, i) => pt(i, v[t])).join(" ")}
          fill={colors[k]}
          fillOpacity={dashed[k] ? 0.08 : 0.25}
          stroke={colors[k]}
          strokeWidth={4}
          strokeDasharray={dashed[k] ? "10 8" : undefined}
        />
      ))}
    </svg>
  );
}

/** Shareable results card, rendered server-side as a PNG. */
export function renderCard(a: Answers, format: Format, url?: string) {
  const r = buildReport(a);
  const baby = toPct(r.temperament);
  const now = toPct(r.now);
  const most = [...r.future].sort((x, y) => y.pChange - x.pChange)[0];
  const avg = Math.round((r.future.reduce((s, f) => s + f.pChange, 0) / 5) * 100);
  const celeb = nearestCelebs(now, 1)[0];
  const mbti = closestType(r.now);
  const type = r.temperamentType.label.replace(/ \(.*\)/, "");
  const story = format === "story";
  const { width, height } = SIZES[format];

  const stat = (big: string, small: string, color = "#fff") => (
    <div style={{ display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: story ? "28px 32px" : "18px 22px", flex: 1 }}>
      <div style={{ fontSize: story ? 72 : 46, fontWeight: 700, color }}>{big}</div>
      <div style={{ fontSize: story ? 28 : 18, color: "#a19fc4", marginTop: 4 }}>{small}</div>
    </div>
  );

  const traitsRow = (
    <div style={{ display: "flex", gap: story ? 18 : 10, marginTop: story ? 24 : 12 }}>
      {TRAITS.map((t) => (
        <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div style={{ fontSize: story ? 34 : 22, fontWeight: 700, color: TRAIT_META[t].color }}>
            {`${baby[t]}→${now[t]}`}
          </div>
          <div style={{ fontSize: story ? 22 : 14, color: "#a19fc4" }}>{TRAIT_META[t].name}</div>
        </div>
      ))}
    </div>
  );

  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: story ? 40 : 28, fontWeight: 700 }}>
      <div style={{ width: story ? 56 : 40, height: story ? 56 : 40, borderRadius: 999, background: "linear-gradient(135deg,#8b5cf6,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={story ? 30 : 22} height={story ? 30 : 22} viewBox="0 0 40 40">
          <path d="M20 0l5 15 15 5-15 5-5 15-5-15L0 20l15-5z" fill="#fff" />
        </svg>
      </div>
      <span>Personality</span>
      <span style={{ color: "#f9a8d4", marginLeft: -14 }}>verse</span>
    </div>
  );

  const headline = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: story ? 34 : 22, color: "#c4b5fd" }}>{r.reverse ? "I most likely started life as" : "I started life as"}</div>
      <div style={{ fontSize: story ? 120 : 76, fontWeight: 800, lineHeight: 1.05, backgroundImage: "linear-gradient(90deg,#c4b5fd,#f9a8d4,#7dd3fc)", backgroundClip: "text", color: "transparent" }}>
        {type}
      </div>
    </div>
  );

  const legend = (
    <div style={{ display: "flex", gap: 24, fontSize: story ? 26 : 16, color: "#a19fc4", justifyContent: "center" }}>
      <span style={{ color: "#f472b6" }}>- - baby me</span>
      <span style={{ color: "#a78bfa" }}>— me now</span>
    </div>
  );

  const body = story ? (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 80, gap: 36 }}>
      {brand}
      <div style={{ display: "flex", marginTop: 60 }}>{headline}</div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>{radar([baby, now], ["#f472b6", "#a78bfa"], [true, false], 760)}</div>
      {legend}
      {traitsRow}
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        {stat(`${avg}%`, `avg chance each trait shifts by ${a.horizon}`)}
        {stat(`${Math.round(most.pChange * 100)}%`, `${TRAIT_META[most.trait].name}, my wildcard`, TRAIT_META[most.trait].color)}
      </div>
      <div style={{ display: "flex", fontSize: 34, color: "#fff", marginTop: 18 }}>{`Closest MBTI type: ${mbti.type}, ${mbti.info?.nickname ?? ""}`}</div>
      <div style={{ display: "flex", fontSize: 30, color: "#a19fc4", marginTop: 10 }}>{`Closest famous profile: ${celeb.name} (popular typing)`}</div>
      <div style={{ display: "flex", marginTop: "auto", fontSize: 30, color: "#c4b5fd" }}>{`Who were you before the world got to you? ${url ?? ""}`}</div>
    </div>
  ) : (
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 56, gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
        {brand}
        <div style={{ display: "flex", marginTop: 16 }}>{headline}</div>
        <div style={{ display: "flex", gap: 14 }}>
          {stat(`${avg}%`, `avg chance each trait shifts by ${a.horizon}`)}
          {stat(`${Math.round(most.pChange * 100)}%`, `${TRAIT_META[most.trait].name}, my wildcard`, TRAIT_META[most.trait].color)}
        </div>
        {traitsRow}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 20, color: "#fff" }}>{`Closest MBTI type: ${mbti.type}, ${mbti.info?.nickname ?? ""}`}</div>
        <div style={{ display: "flex", fontSize: 18, color: "#a19fc4" }}>{`Closest famous profile: ${celeb.name} · popular typing, for fun`}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {radar([baby, now], ["#f472b6", "#a78bfa"], [true, false], 440)}
        {legend}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          color: "#ecebff",
          backgroundColor: "#0b0a1a",
          backgroundImage: "radial-gradient(circle at 10% 0%, rgba(124,58,237,0.45), transparent 55%), radial-gradient(circle at 100% 20%, rgba(236,72,153,0.3), transparent 50%)",
        }}
      >
        {body}
      </div>
    ),
    { width, height, headers: { "Cache-Control": "public, max-age=300" } }
  );
}
