// ─── Reviews Controller ───────────────────────────────────────────────────────

const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  searchReviews,
} = require('../data/store');

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
function getAllReviewsHandler(req, res) {
  try {
    const reviews = getAllReviews();
    return res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully.',
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
}

/**
 * GET /api/reviews/search?q=<query>
 * Must be registered BEFORE /:id so Express matches it first.
 */
function searchReviewsHandler(req, res) {
  try {
    const { q } = req.query;

    if (q === undefined || q === null) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required for search.',
      });
    }

    const results = searchReviews(q.trim());
    return res.status(200).json({
      success: true,
      message: `Search completed. ${results.length} result(s) found.`,
      count: results.length,
      query: q,
      data: results,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
}

/**
 * GET /api/reviews/:id
 */
function getReviewByIdHandler(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Review ID must be a number.' });
    }

    const review = getReviewById(id);
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
    return res.status(500).json({ success: false, message: 'Failed to retrieve review.' });
  }
}

/**
 * POST /api/reviews
 */
function createReviewHandler(req, res) {
  try {
    const errors = validateReviewBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const review = createReview(req.body);
    return res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      data: review,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create review.' });
  }
}

/**
 * PUT /api/reviews/:id
 */
function updateReviewHandler(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Review ID must be a number.' });
    }

    if (!getReviewById(id)) {
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

    const updated = updateReview(id, body);
    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
}

/**
 * DELETE /api/reviews/:id
 */
function deleteReviewHandler(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Review ID must be a number.' });
    }

    const deleted = deleteReview(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Review with ID ${id} not found.`,
      });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
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
