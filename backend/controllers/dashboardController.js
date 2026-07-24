// ─── Dashboard Controller ─────────────────────────────────────────────────────
// Week 5: aggregated stats are computed from real database rows via Prisma.
// Week 8 (perf): rewritten to push aggregation down to PostgreSQL
// (count/avg/groupBy) instead of pulling every review row into Node and
// reducing it in JS. All four queries run concurrently via Promise.all,
// and `recentReviews` uses `select` to fetch only the columns the
// dashboard UI actually renders — smaller query, smaller response body.

const prisma = require('../lib/prisma');

const RECENT_REVIEWS_SELECT = {
  id: true,
  guestName: true,
  property: true,
  rating: true,
  sentiment: true,
  createdAt: true,
};

/**
 * GET /api/dashboard
 * Returns aggregated stats: total reviews, average rating,
 * sentiment breakdown, recent reviews, and per-property summary.
 */
async function getDashboard(req, res, next) {
  try {
    const [totalReviews, ratingAgg, sentimentGroups, propertyGroups, recentReviews] =
      await Promise.all([
        prisma.review.count(),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.review.groupBy({ by: ['sentiment'], _count: { _all: true } }),
        prisma.review.groupBy({
          by: ['property'],
          _count: { _all: true },
          _avg: { rating: true },
        }),
        prisma.review.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: RECENT_REVIEWS_SELECT,
        }),
      ]);

    const averageRating = Number((ratingAgg._avg.rating || 0).toFixed(2));

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    sentimentGroups.forEach((g) => {
      sentimentBreakdown[g.sentiment] = g._count._all;
    });

    const propertySummary = propertyGroups
      .map((g) => ({
        property: g.property,
        reviewCount: g._count._all,
        averageRating: Number((g._avg.rating || 0).toFixed(2)),
      }))
      // Largest properties first — the UI renders this as a ranked bar list.
      .sort((a, b) => b.reviewCount - a.reviewCount);

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
