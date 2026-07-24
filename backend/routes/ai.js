// ─── AI Routes ─────────────────────────────────────────────────────────────
// Gemini-powered review analysis. Protected (requires a valid JWT) and rate
// limited, since every request is a billed call to an external AI service.

const express = require('express');
const { analyzeReviewHandler, analyzeReviewStreamHandler } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');
const { aiAnalyzeValidation } = require('../middleware/validators');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/ai/analyze
router.post('/ai/analyze', verifyToken, aiLimiter, aiAnalyzeValidation, analyzeReviewHandler);

// POST /api/ai/analyze/stream — Server-Sent Events version of the above.
router.post('/ai/analyze/stream', verifyToken, aiLimiter, aiAnalyzeValidation, analyzeReviewStreamHandler);

module.exports = router;
