// ─── StayInsight AI – Express Server ─────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const reviewsRoutes = require('./routes/reviews');

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
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', reviewsRoutes);

// ── Error Handling (must be last) ─────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅  StayInsight AI backend running at http://localhost:${PORT}`);
  console.log(`📋  API root:  http://localhost:${PORT}/\n`);
});

module.exports = app;
