import { createHash } from "node:crypto";

const bucket = new Map<string, { count: number; resetAt: number }>();

/** Stable per-session key — never use raw JWT prefix (most tokens share `eyJhbGciOi...`). */
export function rateLimitTokenKey(prefix: string, token: string): string {
  const id = createHash("sha256").update(token).digest("hex").slice(0, 32);
  return `${prefix}:${id}`;
}

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = bucket.get(key);
  if (!entry || now > entry.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (entry.count >= limit) {
    throw new Error("Too many requests. Please retry later.");
  }
  entry.count += 1;
  bucket.set(key, entry);
}
