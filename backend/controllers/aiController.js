// ─── AI Controller ─────────────────────────────────────────────────────────
// Analyzes a guest review with Gemini AI. Input validation happens in
// middleware/validators.js (aiAnalyzeValidation); this controller assumes
// req.body has already passed that check.
//
// Fallback behaviour: if Gemini is unavailable because its quota has been
// exhausted (HTTP 429 / RESOURCE_EXHAUSTED — see AIServiceError.status set
// in services/geminiService.js), we don't surface an error to the client.
// Instead we transparently swap in a keyword-based mock analysis so the
// request still succeeds: the review still gets analyzed and saved, and
// the dashboard keeps updating normally. Every other failure (missing API
// key, malformed AI response, network errors that aren't quota-related,
// etc.) still fails the request as before — the fallback is intentionally
// scoped to "Gemini is unavailable", not "anything went wrong".

const { analyzeReview, analyzeReviewStream, AIServiceError } = require('../services/geminiService');
const { generateFallbackAnalysis } = require('../services/mockAiService');
const prisma = require('../lib/prisma');

const QUOTA_EXHAUSTED_STATUS = 429;

/**
 * Resolves { comment, guestName, property, rating } from the request body,
 * loading them from a saved review when `reviewId` is supplied instead.
 * Shared by both the regular and streaming analyze handlers.
 */
async function resolveReviewInput(body) {
  let { comment, guestName, property, rating, reviewId } = body;

  if (reviewId !== undefined) {
    const review = await prisma.review.findUnique({ where: { id: Number(reviewId) } });
    if (!review) {
      const err = new Error(`Cannot analyze: review with ID ${reviewId} does not exist.`);
      err.status = 404;
      throw err;
    }
    comment = review.comment;
    guestName = review.guestName;
    property = review.property;
    rating = review.rating;
  }

  return { comment, guestName, property, rating, reviewId };
}

/**
 * POST /api/ai/analyze
 * Body: { comment: string, guestName?: string, property?: string, rating?: number, reviewId?: number }
 *
 * If reviewId is provided, the review is loaded from the database and its
 * guestName/property/rating/comment are used (comment in the body, if any,
 * is ignored in favor of the stored review). Otherwise the review fields
 * must be supplied directly in the body.
 */
async function analyzeReviewHandler(req, res, next) {
  const startedAt = Date.now();

  try {
    let { comment, guestName, property, rating, reviewId } = req.body;

    if (reviewId !== undefined) {
      const review = await prisma.review.findUnique({ where: { id: Number(reviewId) } });
      if (!review) {
        return res.status(404).json({
          success: false,
          message: `Cannot analyze: review with ID ${reviewId} does not exist.`,
        });
      }
      comment = review.comment;
      guestName = review.guestName;
      property = review.property;
      rating = review.rating;
    }

    console.log(
      `[AI] Analyze request received (user=${req.user?.id ?? 'unknown'}, reviewId=${reviewId ?? 'n/a'}, commentLength=${comment.length})`,
    );

    let result;
    let usedFallback = false;

    try {
      result = await analyzeReview({ comment, guestName, property, rating });
    } catch (err) {
      // Only fall back when Gemini itself is unavailable (quota exhausted /
      // HTTP 429 / RESOURCE_EXHAUSTED, after geminiService has already
      // retried). Any other AI service error (bad key, invalid response
      // shape, non-quota network failure, etc.) still surfaces normally.
      const isQuotaExhausted = err instanceof AIServiceError && err.status === QUOTA_EXHAUSTED_STATUS;
      if (!isQuotaExhausted) throw err;

      console.warn(
        `[AI] Gemini quota exhausted (429) after ${Date.now() - startedAt}ms — using keyword-based fallback analysis instead.`,
      );
      result = generateFallbackAnalysis({ comment, guestName, property, rating });
      usedFallback = true;
    }

    console.log(
      `[AI] Analyze request succeeded in ${Date.now() - startedAt}ms${usedFallback ? ' (fallback)' : ''}.`,
    );

    return res.status(200).json({
      success: true,
      message: 'Review analyzed successfully.',
      data: result,
      // Internal-only flag — not an error, and safe for the frontend to
      // ignore entirely. Lets logs/admins tell fallback analyses apart from
      // genuine Gemini responses without changing the response contract.
      meta: { source: usedFallback ? 'fallback' : 'gemini' },
    });
  } catch (err) {
    if (err instanceof AIServiceError) {
      console.error(`[AI] Analyze request failed after ${Date.now() - startedAt}ms: ${err.message}`);
      return res.status(err.status || 502).json({
        success: false,
        message: err.message,
      });
    }
    return next(err);
  }
}

/**
 * POST /api/ai/analyze/stream
 * Same input contract as /api/ai/analyze, but streams Gemini's raw output
 * as Server-Sent Events while it's generated, then emits one final "done"
 * event with the fully parsed & validated analysis.
 *
 * Event shapes (all sent as `data: <json>\n\n`):
 *   { type: 'delta', text }   — a chunk of raw text as Gemini generates it
 *   { type: 'done', data }    — the complete, validated analysis object
 *   { type: 'error', message }— a fatal error; stream ends after this
 */
async function analyzeReviewStreamHandler(req, res) {
  const startedAt = Date.now();

  // Headers must go out before any writes; once sent we can no longer
  // change the HTTP status code, so every failure path from here on
  // reports itself as an SSE 'error' event rather than an HTTP status.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Keep intermediate proxies from timing out the connection on slow
  // generations.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);

  let clientClosed = false;
  req.on('close', () => { clientClosed = true; });

  try {
    const { comment, guestName, property, rating, reviewId } = await resolveReviewInput(req.body);

    console.log(
      `[AI] Stream analyze request received (user=${req.user?.id ?? 'unknown'}, reviewId=${reviewId ?? 'n/a'}, commentLength=${comment.length})`,
    );

    let result;
    try {
      result = await analyzeReviewStream({ comment, guestName, property, rating }, (delta) => {
        if (!clientClosed) send({ type: 'delta', text: delta });
      });
    } catch (err) {
      const isQuotaExhausted = err instanceof AIServiceError && err.status === QUOTA_EXHAUSTED_STATUS;
      if (!isQuotaExhausted) throw err;

      console.warn(
        `[AI] Gemini quota exhausted (429) during stream after ${Date.now() - startedAt}ms — falling back to keyword-based analysis.`,
      );
      result = generateFallbackAnalysis({ comment, guestName, property, rating });
      if (!clientClosed) send({ type: 'delta', text: JSON.stringify(result, null, 2) });
    }

    console.log(`[AI] Stream analyze request succeeded in ${Date.now() - startedAt}ms.`);
    if (!clientClosed) send({ type: 'done', data: result });
  } catch (err) {
    const message =
      err instanceof AIServiceError
        ? err.message
        : err.status === 404
          ? err.message
          : 'AI analysis failed. Please try again.';
    console.error(`[AI] Stream analyze request failed after ${Date.now() - startedAt}ms: ${message}`);
    if (!clientClosed) send({ type: 'error', message });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
}

module.exports = { analyzeReviewHandler, analyzeReviewStreamHandler };
