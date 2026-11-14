import Link from "next/link";

/** Letters set at stepped sizes, from `from` to `to` (in units of --u), so a line shrinks or grows along its baseline. */
function Steps({ text, from, to }: { text: string; from: number; to: number }) {
  const n = text.length;
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} style={{ fontSize: `calc(var(--u) * ${(from * (to / from) ** (n > 1 ? i / (n - 1) : 0)).toFixed(2)})` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

/**
 * Home hero copy. The headline runs along the diagonal opposite the reaching arms and converges on the
 * fingertip gap (51%, 48% of the image): it shrinks towards the touch, then grows again on the far side.
 * The real h1 is plain text for assistive tech; the diagonal lettering is decorative.
 */
export function HeroCopy() {
  return (
    <>
      <h1 className="sr-only">Meet the other you.</h1>
      <div className="hero-diagonal hidden md:block" aria-hidden="true">
        <span className="hero-diagonal-in"><Steps text="Meet the other" from={8.2} to={1.7} /></span>
        <span className="hero-diagonal-out"><Steps text="you." from={2.6} to={13} /></span>
      </div>
      <div className="hero-diagonal md:hidden" aria-hidden="true">
        <span className="hero-diagonal-in flex-col !items-end">
          <span className="flex items-center"><Steps text="Meet the" from={10.4} to={7.6} /></span>
          <span className="flex items-center"><Steps text="other" from={7.4} to={4.6} /></span>
        </span>
        <span className="hero-diagonal-out"><Steps text="you." from={5.5} to={17} /></span>
      </div>
      <div className="mx-auto mt-auto w-full max-w-6xl px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="hero-bare rise flex flex-col items-start gap-3">
          <p className="max-w-[17rem] text-[15px] font-semibold leading-snug sm:max-w-none sm:text-base">Same baby. Different world. Four minutes.</p>
          <Link href="/quiz" className="btn group !rounded-full !bg-[#16122b] !px-5 !py-3 !text-[15px] !text-white">
            Find my other selves
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
