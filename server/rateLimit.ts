import { Request, Response, NextFunction } from 'express';

const hits = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (val.resetAt < now) hits.delete(key);
  }
}, 300_000);

export function rateLimit(windowMs: number, max: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.ip || 'unknown') + ':' + req.path;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
}
