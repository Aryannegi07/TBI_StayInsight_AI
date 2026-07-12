// ─── Rate Limiting (express-rate-limit) ───────────────────────────────────────
// Week 6: Backend Security. Applied only to the auth endpoints that are
// most sensitive to brute-force / credential-stuffing attacks.

const rateLimit = require('express-rate-limit');

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

module.exports = { authLimiter };
