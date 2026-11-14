import type { Metadata } from "next";
import { Inter, Inter_Tight, Instrument_Serif, Unbounded, JetBrains_Mono, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const tight = Inter_Tight({ variable: "--font-tight", subsets: ["latin"], display: "swap" });
const hero = Unbounded({ variable: "--font-hero", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jb-mono", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-serif-accent", subsets: ["latin"], weight: "400", style: "italic", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  openGraph: { images: ["/og.png"], siteName: "Personalityverse" },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  title: "Personalityverse: who were you before the world got to you?",
  description:
    "Estimate your early temperament, see how likely your personality is to change, and explore the other versions of you that upbringing and choices could create. Built on twin studies and 50 years of personality research.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${tight.variable} ${serif.variable} ${hero.variable} ${mono.variable} ${manrope.variable} font-sans antialiased`}>
        <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-white/[.07] bg-black/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="wordmark text-[15px]">Personalityverse</span>
            </div>
            <div className="hairline mt-8" />
            <p className="mt-6 max-w-3xl text-xs leading-relaxed text-[var(--color-muted)]">
              Personalityverse is an educational model, not a psychological assessment. Nobody can measure personality at birth: we estimate early
              temperament from what you remember or were told, then apply published effect sizes.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
