// ─── Dashboard Routes ─────────────────────────────────────────────────────────

const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard
router.get('/dashboard', getDashboard);

module.exports = router;
