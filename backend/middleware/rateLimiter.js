/**
 * IRIS In-Memory Rate Limiter Middleware
 * Provides sliding-window abuse protection across auth, emergency telemetry, and AI routes.
 */

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const max = options.max || 100;
  const message = options.message || 'Too many requests from this IP, please try again later.';
  const code = options.code || 'RATE_LIMIT_EXCEEDED';

  const hits = new Map();

  // Periodic cleanup every 5 minutes to avoid memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startTime > windowMs * 2) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // In test environment, allow disabling if needed
    if (process.env.DISABLE_RATE_LIMITING === 'true') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const key = `${ip}_${req.baseUrl || ''}`;
    const now = Date.now();

    let record = hits.get(key);
    if (!record || (now - record.startTime > windowMs)) {
      record = { count: 1, startTime: now };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.startTime + windowMs) / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          code,
          message,
          retryAfterSeconds: Math.ceil((record.startTime + windowMs - now) / 1000)
        }
      });
    }

    next();
  };
}

// Preset Limiters
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20, // 20 attempts per minute
  code: 'AUTH_RATE_LIMIT_EXCEEDED',
  message: 'Too many authentication attempts. Please wait one minute before trying again.'
});

const telemetryLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120, // 120 telemetry packets per minute (allows up to 2 Hz per client)
  code: 'TELEMETRY_BURST_EXCEEDED',
  message: 'Telemetry packet burst threshold exceeded.'
});

const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30, // 30 AI requests per minute
  code: 'AI_RATE_LIMIT_EXCEEDED',
  message: 'AI assistant request frequency exceeded. Please pause briefly.'
});

const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  code: 'API_RATE_LIMIT_EXCEEDED',
  message: 'Request limit exceeded.'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  telemetryLimiter,
  aiLimiter,
  generalLimiter
};
