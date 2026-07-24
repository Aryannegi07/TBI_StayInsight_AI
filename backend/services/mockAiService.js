// ─── Mock AI Fallback Service ──────────────────────────────────────────────
// Produces a realistic stand-in for Gemini's analysis using simple
// keyword-based heuristics. This is ONLY used by aiController when Gemini
// itself is unavailable (currently: HTTP 429 / RESOURCE_EXHAUSTED after all
// retries have been exhausted — see services/geminiService.js).
//
// The output shape is identical to what geminiService.analyzeReview()
// returns, so callers (aiController, and anything downstream that consumes
// its response) don't need to know which engine actually produced it:
//   • sentiment
//   • overallScore
//   • confidence
//   • positivePoints
//   • negativePoints
//   • improvementSuggestions
//   • hostResponse
//
// None of this calls out to the network — it's pure, synchronous, and
// deterministic for a given input, which also makes it trivial to test.

// Keyword categories used for BOTH detection and generating human-readable
// points/suggestions. Keys are the "topic" a phrase relates to.
const POSITIVE_KEYWORDS = {
  cleanliness: ['clean', 'spotless', 'tidy', 'immaculate'],
  staff: ['friendly staff', 'helpful staff', 'attentive staff', 'courteous', 'welcoming', 'accommodating'],
  comfort: ['comfortable', 'cozy', 'cosy', 'spacious', 'roomy'],
  location: ['convenient location', 'central location', 'walkable', 'close to everything', 'great location', 'well located'],
  value: ['great value', 'worth the price', 'affordable', 'reasonably priced', 'good price'],
  amenities: ['great amenities', 'nice pool', 'good breakfast', 'fast wifi', 'lovely view', 'nice view'],
  overall: ['amazing', 'excellent', 'wonderful', 'perfect', 'great', 'love', 'loved', 'awesome', 'fantastic', 'recommend', 'exceeded expectations', 'best stay'],
};

const NEGATIVE_KEYWORDS = {
  cleanliness: ['dirty', 'smell', 'smelly', 'stain', 'unclean', 'mold', 'mould', 'dusty'],
  staff: ['rude', 'unhelpful', 'unfriendly', 'ignored', 'unprofessional', 'dismissive'],
  noise: ['noisy', 'loud', 'noise', "couldn't sleep", 'thin walls'],
  maintenance: ['broken', 'leak', 'leaking', 'malfunction', 'not working', "didn't work", 'stopped working', 'out of order'],
  value: ['overpriced', 'too expensive', 'waste of money', 'not worth', 'hidden fees'],
  overall: ['terrible', 'awful', 'horrible', 'worst', 'disappointing', 'disappointed', 'bad experience', 'never again', 'poor'],
};

const POSITIVE_PHRASES = {
  cleanliness: 'Guest praised how clean and well-kept the space was',
  staff: 'Guest highlighted friendly and helpful staff',
  comfort: 'Guest found the room comfortable and inviting',
  location: 'Guest appreciated the convenient location',
  value: 'Guest felt the stay was good value for money',
  amenities: 'Guest enjoyed the amenities on offer',
  overall: 'Guest expressed strong overall satisfaction with the stay',
};

const NEGATIVE_PHRASES = {
  cleanliness: 'Guest raised concerns about cleanliness',
  staff: 'Guest felt the staff interaction fell short',
  noise: 'Guest was bothered by noise levels',
  maintenance: 'Guest ran into a maintenance or functionality issue',
  value: 'Guest felt the stay was not worth the price paid',
  overall: 'Guest expressed general dissatisfaction with the stay',
};

const IMPROVEMENT_SUGGESTIONS = {
  cleanliness: 'Schedule an extra housekeeping pass before check-in and spot-check high-touch areas.',
  staff: 'Provide staff with a refresher on guest-service etiquette and empathetic communication.',
  noise: 'Look into soundproofing options or advise guests of quiet hours proactively.',
  maintenance: 'Set up a pre-arrival maintenance checklist to catch issues before guests notice them.',
  value: 'Review current pricing against amenities offered, or add small value-adds (e.g. late checkout).',
  overall: 'Follow up personally with the guest to understand what went wrong and offer a make-good gesture.',
};

function countMatches(text, keywordMap) {
  const matched = [];
  for (const [topic, keywords] of Object.entries(keywordMap)) {
    const hit = keywords.some((kw) => text.includes(kw));
    if (hit) matched.push(topic);
  }
  return matched;
}

function deriveSentiment(rating, posCount, negCount) {
  if (rating !== undefined && rating !== null && !Number.isNaN(Number(rating))) {
    const r = Number(rating);
    if (r >= 4) return 'positive';
    if (r <= 2) return 'negative';
    // A 3-star rating is a toss-up — let keyword balance decide, default neutral.
    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  if (posCount === 0 && negCount === 0) return 'neutral';
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

function deriveScore(rating, posCount, negCount) {
  let score;
  if (rating !== undefined && rating !== null && !Number.isNaN(Number(rating))) {
    // Anchor on the star rating, then nudge slightly based on keyword tone.
    score = Number(rating) * 20;
    score += posCount * 4;
    score -= negCount * 6;
  } else {
    // No rating supplied — start from a neutral baseline and let keywords move it.
    score = 60 + posCount * 8 - negCount * 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildHostResponse({ guestName, property, sentiment, negativeTopics }) {
  const name = guestName && guestName.trim() ? guestName.trim() : 'there';
  const place = property && property.trim() ? property.trim() : 'our property';

  if (sentiment === 'positive') {
    return `Hi ${name}, thank you so much for the kind words about your stay at ${place}! We're thrilled you had a great experience, and we hope to welcome you back again soon.`;
  }

  if (sentiment === 'negative') {
    const focus = negativeTopics.length > 0
      ? IMPROVEMENT_SUGGESTIONS[negativeTopics[0]]
      : 'We take feedback like this seriously and are already looking into it.';
    return `Hi ${name}, thank you for taking the time to share this. We're sorry your stay at ${place} didn't meet expectations. ${focus} Please reach out directly so we can make this right.`;
  }

  return `Hi ${name}, thank you for sharing your feedback on your stay at ${place}. We're glad to hear from you and will use your comments to keep improving.`;
}

/**
 * Generates a fallback analysis using keyword heuristics only.
 * Mirrors the shape returned by geminiService.analyzeReview().
 *
 * @param {{ comment: string, guestName?: string, property?: string, rating?: number }} input
 */
function generateFallbackAnalysis({ comment, guestName, property, rating }) {
  const text = (comment || '').toLowerCase();

  const positiveTopics = countMatches(text, POSITIVE_KEYWORDS);
  const negativeTopics = countMatches(text, NEGATIVE_KEYWORDS);

  const sentiment = deriveSentiment(rating, positiveTopics.length, negativeTopics.length);
  const overallScore = deriveScore(rating, positiveTopics.length, negativeTopics.length);

  // Keyword-based heuristics are inherently less certain than a full
  // language-model read of the text, so confidence is capped below what a
  // genuine Gemini analysis would report, and rises with the number of
  // recognizable signal words found (more signal = more confident guess).
  const totalMatches = positiveTopics.length + negativeTopics.length;
  const confidence = Math.max(35, Math.min(75, 45 + totalMatches * 6));

  const positivePoints = positiveTopics.map((topic) => POSITIVE_PHRASES[topic]);
  const negativePoints = negativeTopics.map((topic) => NEGATIVE_PHRASES[topic]);

  if (positivePoints.length === 0 && sentiment !== 'negative') {
    positivePoints.push('Guest left generally neutral-to-positive feedback with no standout praise called out.');
  }

  const improvementSuggestions = negativeTopics.map((topic) => IMPROVEMENT_SUGGESTIONS[topic]);
  if (improvementSuggestions.length === 0) {
    improvementSuggestions.push('No specific issues detected — keep up current service standards.');
  }

  const hostResponse = buildHostResponse({ guestName, property, sentiment, negativeTopics });

  return {
    sentiment,
    overallScore,
    confidence,
    positivePoints,
    negativePoints,
    improvementSuggestions,
    hostResponse,
  };
}

module.exports = { generateFallbackAnalysis };
