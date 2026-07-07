// ─── Reviews Controller ───────────────────────────────────────────────────────
// Week 5: rewired from the in-memory array in data/store.js onto Prisma +
// PostgreSQL. Response shapes and HTTP status codes are unchanged from Week 4.

const prisma = require('../lib/prisma');

// ── Validation helper ─────────────────────────────────────────────────────────

function validateReviewBody(body) {
  const errors = [];

  if (!body.guestName || typeof body.guestName !== 'string' || !body.guestName.trim()) {
    errors.push('guestName is required and must be a non-empty string.');
  }

  if (!body.property || typeof body.property !== 'string' || !body.property.trim()) {
    errors.push('property is required and must be a non-empty string.');
  }

  const rating = Number(body.rating);
  if (body.rating === undefined || body.rating === null || isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('rating is required and must be a number between 1 and 5.');
  }

  if (!body.comment || typeof body.comment !== 'string' || !body.comment.trim()) {
    errors.push('comment is required and must be a non-empty string.');
  }

  if (
    body.sentiment !== undefined &&
    !['positive', 'neutral', 'negative'].includes(body.sentiment)
  ) {
    errors.push("sentiment must be one of: 'positive', 'neutral', 'negative'.");
  }

  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    errors.push('tags must be an array of strings.');
  }

  return errors;
}

// ── Controller functions ──────────────────────────────────────────────────────

/**
 * GET /api/reviews
 */
async function getAllReviewsHandler(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: { analysis: true },
    });
    return res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully.',
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/reviews/search?q=<query>
 * Must be registered BEFORE /:id so Express matches it first.
 */
async function searchReviewsHandler(req, res, next) {
  try {
    const { q } = req.query;

    if (q === undefined || q === null) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required for search.',
      });
    }

    const query = q.trim();

    const results = await prisma.review.findMany({
      where: {
        OR: [
          { guestName: { contains: query, mode: 'insensitive' } },
          { property: { contains: query, mode: 'insensitive' } },
          { comment: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: `Search completed. ${results.length} result(s) found.`,
      count: results.length,
      query: q,
      data: results,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/reviews/:id
 */
async function getReviewByIdHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Review ID must be a number.' });
    }

    const review = await prisma.review.findUnique({
      where: { id: Number(id) },
      include: { analysis: true },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: `Review with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review retrieved successfully.',
      data: review,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/reviews
 */
async function createReviewHandler(req, res, next) {
  try {
    const errors = validateReviewBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const { guestName, property, rating, comment, sentiment, theme, tags, userId } = req.body;

    const review = await prisma.review.create({
      data: {
        guestName,
        property,
        rating: Number(rating),
        comment,
        sentiment: sentiment || 'neutral',
        theme,
        tags: Array.isArray(tags) ? tags : [],
        userId: userId ? Number(userId) : undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      data: review,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/reviews/:id
 */
async function updateReviewHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Review ID must be a number.' });
    }

    const existing = await prisma.review.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Review with ID ${id} not found.`,
      });
    }

    // For PUT we allow partial updates so only validate what's present
    const body = req.body;
    const partialErrors = [];

    if (body.rating !== undefined) {
      const rating = Number(body.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        partialErrors.push('rating must be a number between 1 and 5.');
      }
    }

    if (body.sentiment !== undefined && !['positive', 'neutral', 'negative'].includes(body.sentiment)) {
      partialErrors.push("sentiment must be one of: 'positive', 'neutral', 'negative'.");
    }

    if (body.tags !== undefined && !Array.isArray(body.tags)) {
      partialErrors.push('tags must be an array of strings.');
    }

    if (partialErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: partialErrors,
      });
    }

    const data = {};
    ['guestName', 'property', 'comment', 'sentiment', 'theme', 'tags'].forEach((key) => {
      if (body[key] !== undefined) data[key] = body[key];
    });
    if (body.rating !== undefined) data.rating = Number(body.rating);
    if (body.userId !== undefined) data.userId = body.userId ? Number(body.userId) : null;

    const updated = await prisma.review.update({
      where: { id: Number(id) },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/reviews/:id
 */
async function deleteReviewHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Review ID must be a number.' });
    }

    const existing = await prisma.review.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Review with ID ${id} not found.`,
      });
    }

    await prisma.review.delete({ where: { id: Number(id) } });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllReviewsHandler,
  searchReviewsHandler,
  getReviewByIdHandler,
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
};
