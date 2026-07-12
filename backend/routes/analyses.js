// ─── Analyses Routes ──────────────────────────────────────────────────────────
// Week 5: new entity CRUD, one-to-one with Review.
// Week 6: all analysis endpoints require authentication; create/update are
// also validated with express-validator.

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

router.use(verifyToken);

// GET    /api/analyses
router.get('/analyses', getAllAnalysesHandler);

// GET    /api/analyses/:id
router.get('/analyses/:id', getAnalysisByIdHandler);

// POST   /api/analyses
router.post('/analyses', analysisValidation, createAnalysisHandler);

// PUT    /api/analyses/:id
router.put('/analyses/:id', updateAnalysisHandler);

// DELETE /api/analyses/:id
router.delete('/analyses/:id', deleteAnalysisHandler);

module.exports = router;
