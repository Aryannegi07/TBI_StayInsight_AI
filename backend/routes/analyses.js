// ─── Analyses Routes ──────────────────────────────────────────────────────────
// Week 5: new entity CRUD, one-to-one with Review.

const express = require('express');
const {
  getAllAnalysesHandler,
  getAnalysisByIdHandler,
  createAnalysisHandler,
  updateAnalysisHandler,
  deleteAnalysisHandler,
} = require('../controllers/analysisController');

const router = express.Router();

// GET    /api/analyses
router.get('/analyses', getAllAnalysesHandler);

// GET    /api/analyses/:id
router.get('/analyses/:id', getAnalysisByIdHandler);

// POST   /api/analyses
router.post('/analyses', createAnalysisHandler);

// PUT    /api/analyses/:id
router.put('/analyses/:id', updateAnalysisHandler);

// DELETE /api/analyses/:id
router.delete('/analyses/:id', deleteAnalysisHandler);

module.exports = router;
