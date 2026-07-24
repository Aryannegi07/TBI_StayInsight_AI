// ─── Gemini AI Service ────────────────────────────────────────────────────────
// Wraps calls to Google's Generative Language API (Gemini) for review
// analysis. Uses Node's built-in fetch (Node 18+) — no extra HTTP client
// dependency needed.
//
// Responsibilities:
//   • Build the analysis prompt and force strict JSON output.
//   • Enforce a request timeout (AbortController).
//   • Retry transient failures (network errors, 429, 5xx) with exponential
//     backoff, up to GEMINI_MAX_RETRIES attempts.
//   • Validate that the model actually returned the shape we asked for.
//   • Never leak the API key — it only ever lives in process.env, read here.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 15000;
const GEMINI_MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES) || 2;

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const REQUIRED_FIELDS = [
  "sentiment",
  "overallScore",
  "confidence",
  "positivePoints",
  "negativePoints",
  "improvementSuggestions",
  "hostResponse",
];

/**
 * Thrown for any Gemini-related failure. `status` maps roughly onto the
 * HTTP status the controller should respond with.
 */
class AIServiceError extends Error {
  constructor(message, status = 502, cause) {
    super(message);
    this.name = "AIServiceError";
    this.status = status;
    if (cause) this.cause = cause;
  }
}

function buildPrompt({ comment, guestName, property, rating }) {
  return `You are an assistant for a hospitality review analytics platform.
Analyze the following guest review and respond with ONLY a single valid JSON
object — no markdown fences, no commentary, no extra text before or after it.

Review context:
- Guest name: ${guestName || "Unknown"}
- Property: ${property || "Unknown"}
- Star rating (1-5, if provided): ${rating ?? "Not provided"}
- Review text: """${comment}"""

Return a JSON object with EXACTLY these keys:
{
  "sentiment": "positive" | "neutral" | "negative",
  "overallScore": <number from 0 to 100 representing overall guest satisfaction>,
  "confidence": <number from 0 to 100 representing how confident YOU are in this analysis, given how clear/detailed the review text is>,
  "positivePoints": [<short strings — what the guest liked>],
  "negativePoints": [<short strings — what the guest disliked; empty array if none>],
  "improvementSuggestions": [<short, actionable strings for the host, may use light markdown like **bold** for key terms>],
  "hostResponse": "<a short, professional, empathetic reply the host could send to the guest; may use light markdown like **bold** for emphasis>"
}

Rules:
- "sentiment" must be exactly one of: positive, neutral, negative.
- "overallScore" must be an integer between 0 and 100.
- "confidence" must be an integer between 0 and 100.
- Arrays may be empty but must always be present.
- Do not wrap the JSON in markdown code fences.
- Do not include any keys other than the ones listed above.`;
}

function stripCodeFences(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : text;
}

function validateShape(parsed) {
  const missing = REQUIRED_FIELDS.filter((key) => !(key in parsed));
  if (missing.length > 0) {
    throw new AIServiceError(
      `AI response is missing required field(s): ${missing.join(", ")}.`,
      502,
    );
  }

  if (!["positive", "neutral", "negative"].includes(parsed.sentiment)) {
    throw new AIServiceError(
      "AI response returned an invalid sentiment value.",
      502,
    );
  }

  const score = Number(parsed.overallScore);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    throw new AIServiceError(
      "AI response returned an invalid overallScore value.",
      502,
    );
  }
  parsed.overallScore = Math.round(score);

  const confidence = Number(parsed.confidence);
  if (Number.isNaN(confidence) || confidence < 0 || confidence > 100) {
    throw new AIServiceError(
      "AI response returned an invalid confidence value.",
      502,
    );
  }
  parsed.confidence = Math.round(confidence);

  ["positivePoints", "negativePoints", "improvementSuggestions"].forEach(
    (key) => {
      if (!Array.isArray(parsed[key])) {
        parsed[key] = parsed[key] ? [String(parsed[key])] : [];
      }
    },
  );

  if (typeof parsed.hostResponse !== "string" || !parsed.hostResponse.trim()) {
    throw new AIServiceError(
      "AI response returned an empty hostResponse.",
      502,
    );
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Races a promise against GEMINI_TIMEOUT_MS. The Gemini SDK call itself
 * keeps running in the background if it loses the race (Node has no way to
 * truly cancel an in-flight fetch without the SDK exposing an AbortSignal
 * hook), but the caller gets control back promptly instead of hanging
 * indefinitely, and the timeout is treated as retryable.
 */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new AIServiceError(`${label} timed out after ${ms}ms.`, 504);
      err.retryable = true;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function callGeminiOnce(prompt) {
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }),
      GEMINI_TIMEOUT_MS,
      "Gemini request",
    );

    if (!response || !response.text) {
      throw new AIServiceError("AI service returned an empty response.", 502);
    }

    const rawText = response.text.trim();

    let parsed;
    try {
      parsed = JSON.parse(stripCodeFences(rawText));
    } catch (err) {
      throw new AIServiceError("AI returned invalid JSON.", 502, err);
    }

    return validateShape(parsed);
  } catch (err) {
    console.error("Gemini SDK Error:", err);

    const wrapped = new AIServiceError(
      err.message || "Gemini SDK failed.",
      err.status || 502,
      err,
    );

    wrapped.retryable =
      err.status === 429 || err.status >= 500 || err.name === "AbortError";

    throw wrapped;
  }
}
/**
 * Public entry point: analyzes a single guest review with retry + backoff.
 * @param {{ comment: string, guestName?: string, property?: string, rating?: number }} input
 */
async function analyzeReview(input) {
  if (!GEMINI_API_KEY) {
    throw new AIServiceError(
      "AI analysis is not configured on this server (missing GEMINI_API_KEY).",
      503,
    );
  }

  const prompt = buildPrompt(input);
  let lastError;

  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    try {
      return await callGeminiOnce(prompt);
    } catch (err) {
      lastError =
        err instanceof AIServiceError
          ? err
          : new AIServiceError(err.message, 502, err);
      const isLastAttempt = attempt === GEMINI_MAX_RETRIES;
      if (!lastError.retryable || isLastAttempt) {
        throw lastError;
      }
      const backoffMs = 500 * 2 ** attempt;
      console.warn(
        `[GeminiService] Attempt ${attempt + 1} failed (${lastError.message}). Retrying in ${backoffMs}ms...`,
      );
      await sleep(backoffMs);
    }
  }

  // Unreachable in practice — the loop above always returns or throws.
  throw lastError;
}

/**
 * Streaming variant of analyzeReview. Calls `onDelta(textChunk)` for every
 * chunk of raw text Gemini emits as it generates the JSON response, then
 * returns the final validated, parsed object once the stream completes.
 * No retry/backoff here — a stream that fails partway through can't be
 * transparently retried without duplicating output the client already
 * rendered, so the caller (aiController) is responsible for deciding what
 * to do on failure (e.g. falling back to the non-streaming mock service).
 *
 * @param {{ comment: string, guestName?: string, property?: string, rating?: number }} input
 * @param {(chunk: string) => void} onDelta
 */
async function analyzeReviewStream(input, onDelta) {
  if (!GEMINI_API_KEY) {
    throw new AIServiceError(
      "AI analysis is not configured on this server (missing GEMINI_API_KEY).",
      503,
    );
  }

  const prompt = buildPrompt(input);

  try {
    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let full = "";
    for await (const chunk of stream) {
      const text = chunk?.text || "";
      if (text) {
        full += text;
        onDelta(text);
      }
    }

    if (!full.trim()) {
      throw new AIServiceError("AI service returned an empty response.", 502);
    }

    let parsed;
    try {
      parsed = JSON.parse(stripCodeFences(full.trim()));
    } catch (err) {
      throw new AIServiceError("AI returned invalid JSON.", 502, err);
    }

    return validateShape(parsed);
  } catch (err) {
    if (err instanceof AIServiceError) throw err;
    console.error("Gemini SDK streaming error:", err);
    const wrapped = new AIServiceError(err.message || "Gemini SDK failed.", err.status || 502, err);
    wrapped.retryable = err.status === 429 || err.status >= 500 || err.name === "AbortError";
    throw wrapped;
  }
}

module.exports = { analyzeReview, analyzeReviewStream, AIServiceError };
