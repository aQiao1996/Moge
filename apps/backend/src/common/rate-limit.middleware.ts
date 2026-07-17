import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request } from 'express';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(payload: unknown): void;
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly windowMs = parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
  private readonly maxRequests = parsePositiveInteger(process.env.RATE_LIMIT_MAX, 120);
  private nextCleanupAt = 0;

  use(
    req: Pick<Request, 'ip' | 'path' | 'method' | 'headers'>,
    res: RateLimitResponse,
    next: NextFunction
  ): void {
    const now = Date.now();
    this.cleanupExpiredBuckets(now);
    const key = this.getClientKey(req);
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      next();
      return;
    }

    if (bucket.count >= this.maxRequests) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        code: 429,
        message: '请求过于频繁，请稍后再试',
        timestamp: new Date(now).toISOString(),
        path: req.path,
        method: req.method,
      });
      return;
    }

    bucket.count += 1;
    next();
  }

  private getClientKey(req: Pick<Request, 'ip' | 'path' | 'method' | 'headers'>): string {
    const clientIp = req.ip || 'unknown';

    return `${clientIp}:${req.path}`;
  }

  private cleanupExpiredBuckets(now: number): void {
    if (now < this.nextCleanupAt) {
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }

    this.nextCleanupAt = now + this.windowMs;
  }
}
