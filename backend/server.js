// ─── StayInsight AI – Express Server ─────────────────────────────────────────

require('dotenv').config();

// Fail fast rather than silently signing/verifying JWTs with `undefined` —
// that would make every issued token trivially forgeable.
if (!process.env.JWT_SECRET) {
  console.error(
    '\n❌  JWT_SECRET is not set. Copy backend/.env.example to backend/.env ' +
      'and set a long, random JWT_SECRET before starting the server.\n',
  );
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('./config/passport');

const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const analysesRoutes = require('./routes/analyses');
const aiRoutes = require('./routes/ai');

const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Render/Heroku/etc. sit behind a reverse proxy — trust it so
// express-rate-limit and req.ip see the real client IP, not the proxy's.
app.set('trust proxy', 1);

// ── Global Middleware ─────────────────────────────────────────────────────────

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
// This is a pure JSON API with no server-rendered HTML, so the default CSP
// (meant for HTML pages) is disabled — it would have no effect here and
// only risks confusing tooling. Everything else stays at helmet's defaults.
app.use(helmet({ contentSecurityPolicy: false }));

// Gzip/deflate every response — cheap win for the larger JSON payloads
// (dashboard stats, full review lists). Server-Sent Event streams
// (text/event-stream) are explicitly excluded: compression buffers output
// to build a worthwhile gzip frame, which would defeat the whole point of
// streaming the AI analysis to the client chunk-by-chunk.
app.use(
  compression({
    filter: (req, res) => {
      if (res.getHeader('Content-Type') === 'text/event-stream') return false;
      return compression.filter(req, res);
    },
  }),
);

// Week 6: CORS is restricted to the single frontend origin configured via
// the FRONTEND_ORIGIN environment variable (defaults to the local Vite
// dev server so nothing breaks out of the box).
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Body size capped well above any legitimate payload this API accepts
// (the largest field, a review comment, is capped at 5000 chars by
// validators.js) — blocks accidental/abusive oversized request bodies.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(requestLogger);

// Basic, generous rate limit applied to every /api/* route as defense in
// depth; the stricter, endpoint-specific limiters (auth, AI) still apply
// on top of this one.
app.use('/api', apiLimiter);

// Week 6: Google OAuth2 (stateless — no server-side session; see config/passport.js)
app.use(passport.initialize());

// ── Health Check ──────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StayInsight AI API is running.',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login',
        me: 'GET /api/me',
        updateMe: 'PUT /api/me',
        googleStart: 'GET /api/auth/google',
        googleCallback: 'GET /api/auth/google/callback',
      },
      dashboard: 'GET /api/dashboard',
      reviews: {
        list: 'GET /api/reviews',
        search: 'GET /api/reviews/search?q=<query>',
        getOne: 'GET /api/reviews/:id',
        create: 'POST /api/reviews',
        update: 'PUT /api/reviews/:id',
        delete: 'DELETE /api/reviews/:id',
      },
      users: {
        list: 'GET /api/users',
        getOne: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
      },
      analyses: {
        list: 'GET /api/analyses',
        getOne: 'GET /api/analyses/:id',
        create: 'POST /api/analyses',
        update: 'PUT /api/analyses/:id',
        delete: 'DELETE /api/analyses/:id',
      },
      ai: {
        analyze: 'POST /api/ai/analyze',
        analyzeStream: 'POST /api/ai/analyze/stream (Server-Sent Events)',
      },
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', reviewsRoutes);
app.use('/api', usersRoutes);
app.use('/api', analysesRoutes);
app.use('/api', aiRoutes);

// ── Error Handling (must be last) ─────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`\n✅  StayInsight AI backend running at http://localhost:${PORT}`);
  console.log(`📋  API root:  http://localhost:${PORT}/\n`);
});

// ── Graceful Shutdown (Week 5: closes the Prisma connection pool) ─────────────

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Prisma connection pool closed. Bye!');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
