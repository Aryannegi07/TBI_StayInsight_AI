// ─── Input Validation (express-validator) ────────────────────────────────────
// Week 6: Backend Security. Centralises validation rules for every endpoint
// that accepts user input, and returns clean, consistent JSON error
// responses in the same shape the rest of the API already uses:
//   { success: false, message: 'Validation failed.', errors: [...] }

const { body, validationResult } = require('express-validator');

/**
 * Run after any validation chain. Collects express-validator errors and
 * responds with a clean JSON array of human-readable messages.
 */
function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: result.array().map((e) => e.msg),
    });
  }
  return next();
}

// ── Auth ───────────────────────────────────────────────────────────────────

const registerValidation = [
  body('name').trim().notEmpty().withMessage('name is required.'),
  body('email').trim().notEmpty().withMessage('email is required.').isEmail().withMessage('email must be a valid email address.').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('password is required.')
    .isLength({ min: 6 }).withMessage('password must be at least 6 characters long.'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('email is required.').isEmail().withMessage('email must be a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required.'),
  handleValidationErrors,
];

// ── Reviews ───────────────────────────────────────────────────────────────

const reviewValidation = [
  body('guestName').trim().notEmpty().withMessage('guestName is required and must be a non-empty string.'),
  body('property').trim().notEmpty().withMessage('property is required and must be a non-empty string.'),
  body('rating')
    .notEmpty().withMessage('rating is required and must be a number between 1 and 5.')
    .isFloat({ min: 1, max: 5 }).withMessage('rating is required and must be a number between 1 and 5.'),
  body('comment').trim().notEmpty().withMessage('comment is required and must be a non-empty string.'),
  body('sentiment')
    .optional()
    .isIn(['positive', 'neutral', 'negative']).withMessage("sentiment must be one of: 'positive', 'neutral', 'negative'."),
  body('tags').optional().isArray().withMessage('tags must be an array of strings.'),
  handleValidationErrors,
];

// ── Analyses ("analysis requests") ───────────────────────────────────────

const analysisValidation = [
  body('reviewId').notEmpty().withMessage('reviewId is required and must be a number.').isInt().withMessage('reviewId is required and must be a number.'),
  body('summary').trim().notEmpty().withMessage('summary is required and must be a non-empty string.'),
  body('recommendation').trim().notEmpty().withMessage('recommendation is required and must be a non-empty string.'),
  body('keywords').optional().isArray().withMessage('keywords must be an array of strings.'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  reviewValidation,
  analysisValidation,
};
