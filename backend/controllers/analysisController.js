// ─── Analysis Controller ──────────────────────────────────────────────────────
// Week 5: new entity, one-to-one with Review. Full CRUD backed by Prisma.

const prisma = require('../lib/prisma');

function validateAnalysisBody(body, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (body.reviewId === undefined || isNaN(Number(body.reviewId))) {
      errors.push('reviewId is required and must be a number.');
    }
  }

  if (!partial || body.summary !== undefined) {
    if (!body.summary || typeof body.summary !== 'string' || !body.summary.trim()) {
      errors.push('summary is required and must be a non-empty string.');
    }
  }

  if (!partial || body.recommendation !== undefined) {
    if (!body.recommendation || typeof body.recommendation !== 'string' || !body.recommendation.trim()) {
      errors.push('recommendation is required and must be a non-empty string.');
    }
  }

  if (body.keywords !== undefined && !Array.isArray(body.keywords)) {
    errors.push('keywords must be an array of strings.');
  }

  return errors;
}

/**
 * GET /api/analyses
 */
async function getAllAnalysesHandler(req, res, next) {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      include: { review: true },
    });
    return res.status(200).json({
      success: true,
      message: 'Analyses retrieved successfully.',
      count: analyses.length,
      data: analyses,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/analyses/:id
 */
async function getAnalysisByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Analysis ID must be a number.' });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: Number(id) },
      include: { review: true },
    });

    if (!analysis) {
      return res.status(404).json({ success: false, message: `Analysis with ID ${id} not found.` });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis retrieved successfully.',
      data: analysis,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/analyses
 * Body: { reviewId, summary, keywords, recommendation }
 */
async function createAnalysisHandler(req, res, next) {
  try {
    const errors = validateAnalysisBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    const { reviewId, summary, keywords, recommendation } = req.body;

    const review = await prisma.review.findUnique({ where: { id: Number(reviewId) } });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: `Cannot create analysis: review with ID ${reviewId} does not exist.`,
      });
    }

    const analysis = await prisma.analysis.create({
      data: {
        reviewId: Number(reviewId),
        summary,
        keywords: Array.isArray(keywords) ? keywords : [],
        recommendation,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Analysis created successfully.',
      data: analysis,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/analyses/:id
 */
async function updateAnalysisHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Analysis ID must be a number.' });
    }

    const existing = await prisma.analysis.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: `Analysis with ID ${id} not found.` });
    }

    const errors = validateAnalysisBody(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    const data = {};
    ['summary', 'recommendation', 'keywords'].forEach((key) => {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    });

    const updated = await prisma.analysis.update({
      where: { id: Number(id) },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Analysis updated successfully.',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/analyses/:id
 */
async function deleteAnalysisHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Analysis ID must be a number.' });
    }

    const existing = await prisma.analysis.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: `Analysis with ID ${id} not found.` });
    }

    await prisma.analysis.delete({ where: { id: Number(id) } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllAnalysesHandler,
  getAnalysisByIdHandler,
  createAnalysisHandler,
  updateAnalysisHandler,
  deleteAnalysisHandler,
};
