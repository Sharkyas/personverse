import type { Metadata } from "next";
import { Inter, Inter_Tight, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { DurHackBadge, EnteredIn } from "@/components/DurHack";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const tight = Inter_Tight({ variable: "--font-tight", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-serif-accent", subsets: ["latin"], weight: "400", style: "italic", display: "swap" });

function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pv-mark" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="url(#pv-mark)" strokeWidth="1.6" />
      <ellipse cx="16" cy="16" rx="11.5" ry="4.6" fill="none" stroke="url(#pv-mark)" strokeWidth="1.3" opacity=".7" transform="rotate(-28 16 16)" />
      <circle cx="16" cy="16" r="3" fill="url(#pv-mark)" />
      <circle cx="25.6" cy="10.4" r="1.7" fill="#fff" />
    </svg>
  );
}

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
      <body className={`${inter.variable} ${tight.variable} ${serif.variable} font-sans antialiased`}>
        <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
          Skip to content
        </a>
        <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#08070f]/75 backdrop-blur-xl">
          <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight sm:text-[17px]">
                <Mark className="h-7 w-7 shrink-0" />
                <span>
                  Personality<span className="gradient-text">verse</span>
                </span>
              </Link>
              <DurHackBadge className="hidden lg:inline-flex" />
            </div>
            <div className="flex items-center gap-0.5 text-sm sm:gap-2">
              <Link href="/types" className="whitespace-nowrap rounded-full px-2 py-2 text-[var(--color-muted)] transition-colors hover:text-white sm:px-3">
                Types
              </Link>
              <Link href="/science" className="whitespace-nowrap rounded-full px-2 py-2 text-[var(--color-muted)] transition-colors hover:text-white sm:px-3">
                <span className="sm:hidden">Science</span>
                <span className="hidden sm:inline">The science</span>
              </Link>
              <Link href="/quiz" className="btn btn-primary ml-1 whitespace-nowrap !px-3.5 !py-2 !text-[13px] sm:!px-4">
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Take the test</span>
              </Link>
            </div>
          </nav>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-white/[.07] bg-black/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">
                <Mark className="h-6 w-6" />
                <span>
                  Personality<span className="gradient-text">verse</span>
                </span>
              </div>
              <DurHackBadge />
            </div>
            <div className="mt-8">
              <EnteredIn compact />
            </div>
            <div className="hairline mt-8" />
            <p className="mt-6 max-w-3xl text-xs leading-relaxed text-[var(--color-muted)]">
              Personalityverse is an educational model, not a psychological assessment. Nobody can measure personality at birth: we estimate early
              temperament from what you remember or were told, then apply published effect sizes. Built at DurHack 2026.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
