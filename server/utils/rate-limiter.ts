import type { Request, Response, NextFunction } from "express";

// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated rate limiting service
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
};

export function rateLimiter(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    
    const record = requestCounts.get(identifier);
    
    if (!record || now > record.resetTime) {
      // New window or expired window
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + opts.windowMs,
      });
      return next();
    }
    
    if (record.count >= opts.max) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }
    
    record.count++;
    next();
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
