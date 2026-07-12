// ─── Reviews Routes ───────────────────────────────────────────────────────────
// IMPORTANT: /search must be declared BEFORE /:id so Express does not
// attempt to parse "search" as a numeric ID.
// Week 6: input validation on create, JWT protection on create + delete.

const express = require('express');
const {
  getAllReviewsHandler,
  searchReviewsHandler,
  getReviewByIdHandler,
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
} = require('../controllers/reviewsController');
const { verifyToken } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validators');

const router = express.Router();

// GET  /api/reviews/search?q=<query>   ← must come before /:id
router.get('/reviews/search', searchReviewsHandler);

// GET  /api/reviews
router.get('/reviews', getAllReviewsHandler);

// GET  /api/reviews/:id
router.get('/reviews/:id', getReviewByIdHandler);

// POST /api/reviews (protected + validated)
router.post('/reviews', verifyToken, reviewValidation, createReviewHandler);

// PUT  /api/reviews/:id
router.put('/reviews/:id', updateReviewHandler);

// DELETE /api/reviews/:id (protected)
router.delete('/reviews/:id', verifyToken, deleteReviewHandler);

module.exports = router;
