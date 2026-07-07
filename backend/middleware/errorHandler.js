// ─── Global Error Handler ─────────────────────────────────────────────────────
// Week 5: now also translates Prisma error codes into correct HTTP responses.

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
 * Maps a Prisma "known request error" (err.code like P2002, P2025, P2003)
 * to { status, message }. Returns null if err isn't a recognized Prisma error.
 */
function mapPrismaError(err) {
  if (!err || !err.code || typeof err.code !== 'string' || !err.code.startsWith('P')) {
    return null;
  }

  switch (err.code) {
    case 'P2002': {
      const target = err.meta && err.meta.target ? err.meta.target : 'field';
      return {
        status: 409,
        message: `A record with this ${target} already exists.`,
      };
    }
    case 'P2025':
      return {
        status: 404,
        message: 'The requested record does not exist.',
      };
    case 'P2003':
      return {
        status: 400,
        message: 'This operation violates a foreign key relationship (related record not found).',
      };
    case 'P2014':
      return {
        status: 400,
        message: 'The change you are trying to make would violate a required relation.',
      };
    default:
      return {
        status: 400,
        message: 'Database request could not be processed.',
      };
  }
}

/**
 * General error handler – must be the last middleware registered.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.stack || err.message);

  const prismaMapped = mapPrismaError(err);
  if (prismaMapped) {
    return res.status(prismaMapped.status).json({
      success: false,
      message: prismaMapped.message,
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = { notFound, errorHandler };
