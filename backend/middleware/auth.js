// ─── JWT Auth Middleware ──────────────────────────────────────────────────────
// Verifies the Bearer token sent in the Authorization header and attaches
// the decoded payload to req.user. Used to protect routes that require
// an authenticated user (Week 6: Backend Security).

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Protects a route – requires a valid JWT in the Authorization header.
 * Header format: "Authorization: Bearer <token>"
 */
function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || req.headers['Authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Restricts a route to authenticated admins. Must run after verifyToken
 * (relies on req.user.role, which comes from the JWT payload — see
 * authController.signToken).
 *
 * Week 8 (security fix): /api/users/* previously only required *any* valid
 * JWT, meaning any logged-in user could view, create, edit, or delete any
 * other user's account (including changing their role or password) just by
 * guessing IDs. That's a real authorization gap, distinct from
 * authentication — verifyToken proves *who* you are, this proves you're
 * *allowed* to manage other accounts. Regular users manage their own
 * profile through PUT /api/me instead (see authController.updateMe).
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges are required for this action.',
    });
  }
  return next();
}

module.exports = { verifyToken, requireAdmin };
