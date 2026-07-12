// ─── StayInsight AI – Express Server ─────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');

const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const analysesRoutes = require('./routes/analyses');

const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ─────────────────────────────────────────────────────────

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

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
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', reviewsRoutes);
app.use('/api', usersRoutes);
app.use('/api', analysesRoutes);

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
