import type { RequestHandler } from "express";

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  message?: { error: { code: string; message: string } };
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const clients = new Map<string, ClientRecord>();

  // Cleanup old records periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(key);
      }
    }
  }, options.windowMs).unref();

  return (req, res, next) => {
    const clientIp =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown-ip";

    const now = Date.now();
    const record = clients.get(clientIp);

    if (!record || now > record.resetTime) {
      clients.set(clientIp, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      res.setHeader("X-RateLimit-Limit", options.limit);
      res.setHeader("X-RateLimit-Remaining", options.limit - 1);
      next();
      return;
    }

    if (record.count >= options.limit) {
      res.setHeader("X-RateLimit-Limit", options.limit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
      res.status(429).json(
        options.message ?? {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later.",
          },
        },
      );
      return;
    }

    record.count += 1;
    res.setHeader("X-RateLimit-Limit", options.limit);
    res.setHeader("X-RateLimit-Remaining", options.limit - record.count);
    next();
  };
}

