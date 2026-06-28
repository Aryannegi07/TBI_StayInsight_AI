// ─── Auth Controller ──────────────────────────────────────────────────────────

const { findUserByEmail } = require('../data/store');

/**
 * POST /api/login
 * Body: { email, password }
 * Returns a mock token + user info on success.
 */
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  const user = findUserByEmail(email.trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // In a real app you would sign a JWT here.
  const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
}

module.exports = { login };
