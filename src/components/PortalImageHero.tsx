// Image-first hero: the artwork fills its parent section (which must be `relative`) and scrolls with the page.
// It is a plain static image: no scroll or hover effects. If the file is missing, this renders nothing.
"use client";
import Image from "next/image";
import { useState } from "react";

export function PortalImageHero({
  src = "/hero/portals.webp",
  focus = "51% 48%",
}: {
  src?: string;
  /** object-position: where the crop stays centred on narrow screens (the gap between the fingertips) */
  focus?: string;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <div className="portal-image" aria-hidden="true">
      <Image src={src} alt="" fill priority sizes="100vw" quality={90} className="object-cover" style={{ objectPosition: focus }} onError={() => setOk(false)} />
    </div>
  );
}
