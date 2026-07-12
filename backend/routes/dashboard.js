// ─── Dashboard Routes ─────────────────────────────────────────────────────────
// Week 6: dashboard APIs require authentication.

const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard (protected)
router.get('/dashboard', verifyToken, getDashboard);

module.exports = router;
