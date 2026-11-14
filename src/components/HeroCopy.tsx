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
 * fingertip gap (51%, 48% of the image): "Meet the" shrinks towards the touch, then "other you." grows again past it,
 * bending down into the open sky under the violet portal so it never sits on the frame.
 * The real h1 is plain text for assistive tech; the diagonal lettering is decorative.
 */
export function HeroCopy() {
  return (
    <>
      <h1 className="sr-only">Meet the other you.</h1>
      <div className="hero-diagonal hidden md:block" aria-hidden="true">
        <span className="hero-diagonal-in"><Steps text="Meet the" from={9} to={3.2} /></span>
        <span className="hero-diagonal-out"><Steps text="other you." from={2.4} to={5.8} /></span>
      </div>
      <div className="hero-diagonal md:hidden" aria-hidden="true">
        <span className="hero-diagonal-in flex-col !items-end">
          <span className="flex items-center"><Steps text="Meet" from={12} to={10} /></span>
          <span className="flex items-center"><Steps text="the" from={8} to={6} /></span>
        </span>
        <span className="hero-diagonal-out flex-col !items-start">
          <span className="flex items-center"><Steps text="other" from={5.5} to={8} /></span>
          <span className="flex items-center"><Steps text="you." from={9} to={13} /></span>
        </span>
      </div>
      <Link href="/quiz" className="cosmos-cta" aria-label="Find my other selves: start the test">
        <span className="cosmos-core" aria-hidden="true">
          <span className="cosmos-swirl" />
          <span className="cosmos-stars" />
        </span>
        <span className="cosmos-label" aria-hidden="true">
          <span className="cosmos-enter">Enter</span>
          <span className="cosmos-sub">the multiverse</span>
        </span>
      </Link>
    </>
  );
}
