"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Sticky frosted-glass nav. Over the home hero it is pale glass with dark text; past the hero it tints dark so links stay readable. */
export function SiteHeader() {
  const path = usePathname();
  const [over, setOver] = useState(path === "/");
  useEffect(() => {
    const check = () => {
      const hero = document.querySelector("[data-hero]");
      setOver(!!hero && hero.getBoundingClientRect().bottom > 48);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [path]);
  return (
    <header className="site-header sticky top-0 z-30" data-over={over}>
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <Link href="/" aria-label="Personalityverse home" className="wordmark min-w-0 text-[13px] sm:text-[17px]">
          Personalityverse
        </Link>
        <div className="flex items-center gap-0.5 text-sm sm:gap-2">
          <Link href="/types" className="nav-link whitespace-nowrap rounded-full px-2 py-2 sm:px-3">
            Types
          </Link>
          <Link href="/science" className="nav-link whitespace-nowrap rounded-full px-2 py-2 sm:px-3">
            <span className="sm:hidden">Science</span>
            <span className="hidden sm:inline">The science</span>
          </Link>
          <Link href="/quiz" className="btn btn-primary nav-cta ml-1 whitespace-nowrap !px-3.5 !py-2 !text-[13px] sm:!px-4">
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Take the test</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
