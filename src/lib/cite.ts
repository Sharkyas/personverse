/** "Hudson, N. W., & Fraley, R. C. (2015). Title…" → "Hudson & Fraley (2015)". */
export function shortCite(full: string) {
  const authors = full.split(" (")[0];
  const names = authors.match(/[A-Z][A-Za-zÀ-ÿ'-]+(?=, [A-Z]\.)/g) ?? [authors];
  const year = full.match(/\((\d{4})\)/)?.[1] ?? "";
  const who = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names[0]} et al.`;
  return year ? `${who} (${year})` : who;
}
