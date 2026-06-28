// ─── In-Memory Data Store ────────────────────────────────────────────────────
// All data lives here; no database required.

let nextReviewId = 6;

const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@stayinsight.ai',
    password: 'password123',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Demo User',
    email: 'demo@stayinsight.ai',
    password: 'demo1234',
    role: 'viewer',
  },
];

let reviews = [
  {
    id: 1,
    guestName: 'Alice Johnson',
    property: 'Ocean View Villa',
    rating: 5,
    sentiment: 'positive',
    comment:
      'Absolutely stunning property! The views were breathtaking and the host was incredibly attentive. Would definitely stay again.',
    tags: ['cleanliness', 'location', 'service'],
    createdAt: '2025-05-10T08:23:00.000Z',
  },
  {
    id: 2,
    guestName: 'Bob Martinez',
    property: 'Downtown Loft',
    rating: 3,
    sentiment: 'neutral',
    comment:
      'The location was great but the apartment was a bit smaller than expected. Check-in process was smooth.',
    tags: ['location', 'size'],
    createdAt: '2025-05-18T14:10:00.000Z',
  },
  {
    id: 3,
    guestName: 'Carol Singh',
    property: 'Mountain Retreat',
    rating: 4,
    sentiment: 'positive',
    comment:
      'Cozy cabin with amazing mountain views. Perfect for a weekend getaway. Minor issue with the WiFi but staff resolved it quickly.',
    tags: ['ambiance', 'nature', 'service'],
    createdAt: '2025-06-01T09:45:00.000Z',
  },
  {
    id: 4,
    guestName: 'David Lee',
    property: 'Ocean View Villa',
    rating: 2,
    sentiment: 'negative',
    comment:
      'Disappointed with the cleanliness of the kitchen. The listing photos were misleading. Would not recommend.',
    tags: ['cleanliness', 'accuracy'],
    createdAt: '2025-06-07T17:30:00.000Z',
  },
  {
    id: 5,
    guestName: 'Emily Chen',
    property: 'Beachfront Bungalow',
    rating: 5,
    sentiment: 'positive',
    comment:
      'Perfect beach holiday! Woke up to ocean sounds every morning. Spotless property, superhost — highly recommended!',
    tags: ['cleanliness', 'location', 'ambiance'],
    createdAt: '2025-06-15T11:00:00.000Z',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextReviewId() {
  return nextReviewId++;
}

function getAllReviews() {
  return reviews;
}

function getReviewById(id) {
  return reviews.find((r) => r.id === Number(id)) || null;
}

function createReview(data) {
  const review = {
    id: getNextReviewId(),
    guestName: data.guestName,
    property: data.property,
    rating: Number(data.rating),
    sentiment: data.sentiment || deriveSentiment(Number(data.rating)),
    comment: data.comment,
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  return review;
}

function updateReview(id, data) {
  const idx = reviews.findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  const updated = {
    ...reviews[idx],
    ...data,
    id: reviews[idx].id,           // never overwrite id
    createdAt: reviews[idx].createdAt, // never overwrite creation date
    rating: data.rating !== undefined ? Number(data.rating) : reviews[idx].rating,
    tags: data.tags !== undefined
      ? (Array.isArray(data.tags) ? data.tags : reviews[idx].tags)
      : reviews[idx].tags,
    sentiment:
      data.sentiment ||
      (data.rating !== undefined
        ? deriveSentiment(Number(data.rating))
        : reviews[idx].sentiment),
  };
  reviews[idx] = updated;
  return updated;
}

function deleteReview(id) {
  const idx = reviews.findIndex((r) => r.id === Number(id));
  if (idx === -1) return false;
  reviews.splice(idx, 1);
  return true;
}

function searchReviews(query) {
  if (!query) return reviews;
  const q = query.toLowerCase();
  return reviews.filter(
    (r) =>
      r.guestName.toLowerCase().includes(q) ||
      r.property.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      (r.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      r.sentiment.toLowerCase().includes(q),
  );
}

function getDashboardStats() {
  const total = reviews.length;
  const avgRating =
    total === 0
      ? 0
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10;

  const sentimentCounts = reviews.reduce(
    (acc, r) => {
      acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const propertyStats = reviews.reduce((acc, r) => {
    if (!acc[r.property]) {
      acc[r.property] = { count: 0, totalRating: 0 };
    }
    acc[r.property].count += 1;
    acc[r.property].totalRating += r.rating;
    return acc;
  }, {});

  const propertySummary = Object.entries(propertyStats).map(([name, s]) => ({
    property: name,
    reviewCount: s.count,
    avgRating: Math.round((s.totalRating / s.count) * 10) / 10,
  }));

  return {
    totalReviews: total,
    averageRating: avgRating,
    sentimentBreakdown: sentimentCounts,
    recentReviews,
    propertySummary,
  };
}

function findUserByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function deriveSentiment(rating) {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  searchReviews,
  getDashboardStats,
  findUserByEmail,
};
