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

module.exports = { verifyToken };
