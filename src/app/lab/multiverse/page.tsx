import { Lab } from "./Lab";
export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  return <Lab v={(v ?? "A").toUpperCase()} />;
}
