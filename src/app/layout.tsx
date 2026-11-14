import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });

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
      <body className={`${inter.variable} ${grotesk.variable} font-sans antialiased stars`}>
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0b0a1a]/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-base font-bold sm:gap-2 sm:text-lg">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-sm sm:h-8 sm:w-8">✦</span>
              <span>Personality<span className="gradient-text">verse</span></span>
            </Link>
            <div className="flex items-center gap-0.5 text-sm sm:gap-3">
              <Link href="/types" className="whitespace-nowrap rounded-full px-2 py-2 text-[var(--color-muted)] hover:text-white sm:px-3">Types</Link>
              <Link href="/science" className="whitespace-nowrap rounded-full px-2 py-2 text-[var(--color-muted)] hover:text-white sm:px-3"><span className="sm:hidden">Science</span><span className="hidden sm:inline">The science</span></Link>
              <Link href="/quiz" className="btn btn-primary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4"><span className="sm:hidden">Start</span><span className="hidden sm:inline">Take the test</span></Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-xs text-[var(--color-muted)]">
          <p className="mx-auto max-w-2xl px-4">
            Personalityverse is an educational model, not a psychological assessment. Nobody can measure personality at birth: we estimate early
            temperament from what you remember or were told, then apply published effect sizes. Built at DurHack 2026.
          </p>
        </footer>
      </body>
    </html>
  );
}
