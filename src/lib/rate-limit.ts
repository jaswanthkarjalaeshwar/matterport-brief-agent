/**
 * Per-instance sliding window. Good enough to stop a public demo link from
 * draining the API key; swap for Upstash or Vercel KV if this goes multi-region.
 */
const WINDOW_MS = 60_000;
const MAX = Number(process.env.BRIEFS_PER_MINUTE ?? 3);
const hits = new Map<string, number[]>();

export function rateLimit(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX) return false;
  hits.set(key, [...recent, now]);
  return true;
}
