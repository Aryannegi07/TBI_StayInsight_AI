// ─── Auth Controller ──────────────────────────────────────────────────────────
// Week 5: user lookup queries the database through Prisma.
// Week 6: real JWT issuance (jsonwebtoken) + bcrypt password hashing for new
// registrations. Existing (Week 5) seeded users still have plain-text
// passwords in the database, so login supports both: bcrypt hashes for
// users created via /register, and a plain-text fallback for legacy rows,
// so nothing that already worked breaks.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$/; // bcrypt hashes start with $2a$ / $2b$ / $2y$

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * POST /api/register
 * Body: { name, email, password }
 * Creates a new user with a bcrypt-hashed password and returns a JWT.
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'viewer',
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
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
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/login
 * Body: { email, password }
 * Returns a signed JWT + user info on success.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isBcryptHash = BCRYPT_HASH_PATTERN.test(user.password);
    const passwordMatches = isBcryptHash
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user);

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
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/me
 * Requires a valid JWT (see middleware/auth.js). Returns the authenticated
 * user's profile, used by the frontend right after a Google OAuth redirect
 * and to restore session state.
 */
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Current user retrieved successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/auth/google/callback
 * Called by Passport after Google authenticates the user (req.user is set
 * by the GoogleStrategy verify callback in config/passport.js). Issues our
 * own JWT and redirects back to the frontend with it in the query string,
 * since a full-page OAuth redirect can't write directly to localStorage.
 */
function googleCallback(req, res) {
  const token = signToken(req.user);
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  return res.redirect(`${frontendOrigin}/oauth-callback?token=${token}`);
}

module.exports = { register, login, me, googleCallback };
