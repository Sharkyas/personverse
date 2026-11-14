import type { Metadata } from "next";

// Per-result link preview: the shareable card, rendered from the stored profile.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const image = `/api/card/${id}`;
  return {
    title: "My personalityverse",
    description: "Who was I before the world got to me? My temperament, how it changed, and the odds it changes again.",
    openGraph: { images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
