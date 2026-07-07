// ─── Dashboard Controller ─────────────────────────────────────────────────────
// Week 5: aggregated stats are now computed from real database rows via
// Prisma instead of the in-memory array in data/store.js.

const prisma = require('../lib/prisma');

/**
 * GET /api/dashboard
 * Returns aggregated stats: total reviews, average rating,
 * sentiment breakdown, recent reviews, and per-property summary.
 */
async function getDashboard(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2))
      : 0;

    const sentimentBreakdown = reviews.reduce(
      (acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 },
    );

    const propertyMap = {};
    reviews.forEach((r) => {
      if (!propertyMap[r.property]) {
        propertyMap[r.property] = { property: r.property, count: 0, totalRating: 0 };
      }
      propertyMap[r.property].count += 1;
      propertyMap[r.property].totalRating += r.rating;
    });
    const propertySummary = Object.values(propertyMap).map((p) => ({
      property: p.property,
      reviewCount: p.count,
      averageRating: Number((p.totalRating / p.count).toFixed(2)),
    }));

    const recentReviews = reviews.slice(0, 5);

    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully.',
      data: {
        totalReviews,
        averageRating,
        sentimentBreakdown,
        propertySummary,
        recentReviews,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getDashboard };
