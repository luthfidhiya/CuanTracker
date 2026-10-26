import { createHash, timingSafeEqual } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
/** Failed attempts allowed per client within the window. */
const PER_CLIENT = 5;
/**
 * Failed attempts allowed across all clients. X-Forwarded-For can be spoofed
 * when there's no proxy in front, so rotating it must not give unlimited tries.
 */
const GLOBAL = 30;
const GLOBAL_KEY = "*";

type Bucket = { failures: number; resetAt: number };

/** Counts failed logins in fixed windows. In memory, so it resets on restart and is per instance. */
export class LoginLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(private now: () => number = Date.now) {}

  private bucket(key: string) {
    const bucket = this.buckets.get(key);
    if (bucket && bucket.resetAt > this.now()) return bucket;
    this.buckets.delete(key);
    return undefined;
  }

  /** Milliseconds until `client` may try again, or 0 when allowed. */
  retryAfter(client: string): number {
    const now = this.now();
    for (const [key, limit] of [[client, PER_CLIENT], [GLOBAL_KEY, GLOBAL]] as const) {
      const bucket = this.bucket(key);
      if (bucket && bucket.failures >= limit) return bucket.resetAt - now;
    }
    return 0;
  }

  fail(client: string) {
    for (const key of [client, GLOBAL_KEY]) {
      const bucket = this.bucket(key) ?? { failures: 0, resetAt: this.now() + WINDOW_MS };
      bucket.failures++;
      this.buckets.set(key, bucket);
    }
    this.prune();
  }

  /** A successful login clears that client's failures (not the global count). */
  succeed(client: string) {
    this.buckets.delete(client);
  }

  private prune() {
    if (this.buckets.size < 1000) return;
    for (const key of [...this.buckets.keys()]) this.bucket(key);
  }
}

export const loginLimiter = new LoginLimiter();

/** First X-Forwarded-For hop (set by Next or the hosting proxy), else X-Real-IP. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

/** Compares hashes so the time taken doesn't reveal how much of the password matched. */
export function passwordMatches(given: string, expected: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
