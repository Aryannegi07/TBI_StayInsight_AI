// ─── Auth Routes ──────────────────────────────────────────────────────────────
// Week 6: input validation (express-validator) + rate limiting
// (express-rate-limit: 5 requests / 15 min) applied to register + login.

const express = require('express');
const passport = require('passport');
const { register, login, me, updateMe, googleCallback } = require('../controllers/authController');
const { registerValidation, loginValidation, updateMeValidation } = require('../middleware/validators');
const { authLimiter } = require('../middleware/rateLimiter');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/register
router.post('/register', authLimiter, registerValidation, register);

// POST /api/login
router.post('/login', authLimiter, loginValidation, login);

// GET /api/me (protected)
router.get('/me', verifyToken, me);

// PUT /api/me (protected) — self-service profile update (name, password)
router.put('/me', verifyToken, updateMeValidation, updateMe);

// GET /api/auth/google — starts the Google OAuth flow.
// Returns 503 if GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET aren't configured,
// since Passport never registers the GoogleStrategy in that case.
router.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on this server.',
    });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// GET /api/auth/google/callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/login?oauth_error=1`,
  }),
  googleCallback,
);

module.exports = router;
