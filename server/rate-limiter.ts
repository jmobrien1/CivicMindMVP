import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanupInterval();
  }

  private cleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.requests.entries());
      for (const [key, entry] of entries) {
        if (entry.resetTime < now) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = this.getIdentifier(req);
      const now = Date.now();

      let entry = this.requests.get(identifier);

      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
        this.requests.set(identifier, entry);
      }

      entry.count++;

      const remaining = Math.max(0, this.config.maxRequests - entry.count);
      const resetTime = Math.ceil(entry.resetTime / 1000);

      res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', resetTime.toString());

      if (entry.count > this.config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        console.warn(`[RateLimit] Request blocked for ${identifier}: ${entry.count}/${this.config.maxRequests} requests`);
        
        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
          error: this.config.message || 'Too many requests, please try again later',
          retryAfter,
        });
        return;
      }

      console.log(`[RateLimit] Request allowed for ${identifier}: ${entry.count}/${this.config.maxRequests} requests`);
      next();
    };
  }

  private getIdentifier(req: Request): string {
    const user = req.user as any;
    return user?.id || req.ip || 'anonymous';
  }

  getStats() {
    const stats = {
      totalEntries: this.requests.size,
      entries: Array.from(this.requests.entries()).map(([key, value]) => ({
        identifier: key,
        count: value.count,
        resetIn: Math.max(0, value.resetTime - Date.now()),
      })),
    };
    return stats;
  }

  reset(identifier?: string) {
    if (identifier) {
      this.requests.delete(identifier);
      console.log(`[RateLimit] Reset limit for ${identifier}`);
    } else {
      this.requests.clear();
      console.log('[RateLimit] Reset all limits');
    }
  }
}

export const ocrRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many OCR upload requests. Please wait before uploading more image documents.',
});

export const generalRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000,
  maxRequests: 100,
  message: 'Too many requests. Please slow down.',
});

export function getRateLimiterStats() {
  return {
    ocr: ocrRateLimiter.getStats(),
    general: generalRateLimiter.getStats(),
  };
}
