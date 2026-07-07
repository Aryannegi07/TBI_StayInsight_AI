// ─── StayInsight AI – Express Server ─────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors = require('cors');

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

app.use(
  cors({
    origin: '*',           // In production, restrict to your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── Health Check ──────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StayInsight AI API is running.',
    version: '1.0.0',
    endpoints: {
      auth: 'POST /api/login',
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
