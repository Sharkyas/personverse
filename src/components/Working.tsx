/** Placeholder while a simulation runs in the background: holds its space so the page doesn't jump when it lands. */
export function Working({
  label,
  className = "min-h-[24rem]",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`grid place-items-center rounded-[var(--radius-card)] border border-[var(--color-line)] text-sm text-[var(--color-muted)] ${className}`}
      role="status"
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent-300 motion-reduce:animate-none"
        />
        {label}…
      </span>
    </div>
  );
}
