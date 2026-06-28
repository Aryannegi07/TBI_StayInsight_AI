// ─── Dashboard Controller ─────────────────────────────────────────────────────

const { getDashboardStats } = require('../data/store');

/**
 * GET /api/dashboard
 * Returns aggregated stats: total reviews, average rating,
 * sentiment breakdown, recent reviews, and per-property summary.
 */
function getDashboard(req, res) {
  try {
    const stats = getDashboardStats();
    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully.',
      data: stats,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data.',
    });
  }
}

module.exports = { getDashboard };
