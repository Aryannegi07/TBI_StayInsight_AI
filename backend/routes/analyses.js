// ─── Analyses Routes ──────────────────────────────────────────────────────────
// Week 5: new entity CRUD, one-to-one with Review.
// Week 6: all analysis endpoints require authentication; create/update are
// also validated with express-validator.
// Week 8: verifyToken applied per-route instead of via a path-less
// router.use() — see routes/users.js for why.

const express = require('express');
const {
  getAllAnalysesHandler,
  getAnalysisByIdHandler,
  createAnalysisHandler,
  updateAnalysisHandler,
  deleteAnalysisHandler,
} = require('../controllers/analysisController');
const { verifyToken } = require('../middleware/auth');
const { analysisValidation } = require('../middleware/validators');

const router = express.Router();

// GET    /api/analyses
router.get('/analyses', verifyToken, getAllAnalysesHandler);

// GET    /api/analyses/:id
router.get('/analyses/:id', verifyToken, getAnalysisByIdHandler);

// POST   /api/analyses
router.post('/analyses', verifyToken, analysisValidation, createAnalysisHandler);

// PUT    /api/analyses/:id
router.put('/analyses/:id', verifyToken, updateAnalysisHandler);

// DELETE /api/analyses/:id
router.delete('/analyses/:id', verifyToken, deleteAnalysisHandler);

module.exports = router;
