// Small in-memory sliding-window limiter. One server, one process, so memory is enough.
// It protects the paid APIs (ElevenLabs, Gemini) and the database from a script hammering the public URL.
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip") || "local").trim();
}

/** Returns a 429 response if this client has used up `max` calls to `name` in the window, otherwise null. */
export function rateLimited(req: Request, name: string, max: number, windowMs = 10 * 60_000): Response | null {
  if (process.env.RATE_LIMIT === "off") return null;
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    const retry = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return new Response(JSON.stringify({ error: "rate-limited", retryAfter: retry }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retry) },
    });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  return null;
}
