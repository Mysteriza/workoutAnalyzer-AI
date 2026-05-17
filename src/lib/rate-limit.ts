const rateMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULTS: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
) {
  const { windowMs, maxRequests } = { ...DEFAULTS, ...config };
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || entry.resetAt <= now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function buildRateLimitKey(ip: string, route: string) {
  return `${ip}:${route}`;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}

// Periodic cleanup to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap) {
      if (entry.resetAt <= now) rateMap.delete(key);
    }
  }, 60_000);
}
