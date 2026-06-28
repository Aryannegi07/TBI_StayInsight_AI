// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
 * 404 handler – attach after all routes.
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * General error handler – must be the last middleware registered.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.stack || err.message);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = { notFound, errorHandler };
