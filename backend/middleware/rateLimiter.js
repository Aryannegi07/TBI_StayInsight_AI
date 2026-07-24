// ─── Rate Limiting (express-rate-limit) ───────────────────────────────────────
// Week 6: Backend Security. Applied only to the auth endpoints that are
// most sensitive to brute-force / credential-stuffing attacks.
// Week 8: + a generous global limiter on every /api/* route as defense in
// depth against basic abuse/scraping, on top of the stricter ones below.

const rateLimit = require('express-rate-limit');

// 300 requests every 15 minutes per IP, across the whole API. High enough
// that it never bothers a normal user of the app, low enough to blunt
// naive scripted abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /* , next, options */) => {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

// 5 requests every 15 minutes per IP, on register + login.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /* , next, options */) => {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 15 minutes.',
    });
  },
});

// 15 requests every 15 minutes per IP, on the AI analysis endpoint — each
// call is a billed request to the Gemini API, so it gets its own (looser
// than auth, but still bounded) limit to prevent runaway costs/abuse.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /* , next, options */) => {
    return res.status(429).json({
      success: false,
      message: 'Too many AI analysis requests. Please try again after 15 minutes.',
    });
  },
});

module.exports = { authLimiter, aiLimiter, apiLimiter };
