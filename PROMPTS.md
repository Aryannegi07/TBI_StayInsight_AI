# PROMPTS.md — Gemini Prompt Engineering Notes

This documents the prompt used by `POST /api/ai/analyze` (implemented in
`backend/services/geminiService.js`), two alternative approaches that were
considered, and why the current one was chosen.

The endpoint calls Google's `generateContent` API for the model configured
in `GEMINI_MODEL` (default `gemini-2.0-flash`), with `temperature: 0.4` and
`responseMimeType: 'application/json'`.

---

## ✅ Best / Production Prompt

This is the exact template `buildPrompt()` sends, with the guest review
interpolated in. It is a **single user-role message** — see "Variation 2"
below for why a separate `systemInstruction` was considered and rejected
for now.

```text
You are an assistant for a hospitality review analytics platform.
Analyze the following guest review and respond with ONLY a single valid JSON
object — no markdown fences, no commentary, no extra text before or after it.

Review context:
- Guest name: ${guestName || 'Unknown'}
- Property: ${property || 'Unknown'}
- Star rating (1-5, if provided): ${rating ?? 'Not provided'}
- Review text: """${comment}"""

Return a JSON object with EXACTLY these keys:
{
  "sentiment": "positive" | "neutral" | "negative",
  "overallScore": <number from 0 to 100 representing overall guest satisfaction>,
  "positivePoints": [<short strings — what the guest liked>],
  "negativePoints": [<short strings — what the guest disliked; empty array if none>],
  "improvementSuggestions": [<short, actionable strings for the host>],
  "hostResponse": "<a short, professional, empathetic reply the host could send to the guest>"
}

Rules:
- "sentiment" must be exactly one of: positive, neutral, negative.
- "overallScore" must be an integer between 0 and 100.
- Arrays may be empty but must always be present.
- Do not wrap the JSON in markdown code fences.
- Do not include any keys other than the ones listed above.
```

**Why this is the one we ship:**
- **Forces a fixed schema by naming every key and its type** in the prompt itself, then validates the response server-side (`validateShape()`) and rejects/retries anything that doesn't match — the prompt is the first line of defense, the validator is the second.
- **Delimits the review text with `"""`** so a review containing quote marks, newlines, or attempted prompt-injection text ("ignore the above and...") stays clearly scoped as *data*, not instructions.
- **Single message, no back-and-forth** — cheapest and fastest shape for a one-shot classification+generation task; no conversation history to manage or pay for.
- Combined with `responseMimeType: 'application/json'` (constrained decoding), this gave the most consistently parseable output of the three variations during testing — see comparison below.

---

## Variation 1 — Chain-of-thought before the JSON

**Idea:** ask the model to reason step-by-step, then emit the JSON, in case reasoning-first improves the quality of `overallScore` and `improvementSuggestions`.

```text
Read the guest review below carefully. First, in a few sentences, think
through what the guest liked, disliked, and how a host should respond.
Then, on a new line, output ONLY a JSON object with the following keys:
sentiment, overallScore, positivePoints, negativePoints,
improvementSuggestions, hostResponse.

Review: """${comment}"""
```

**Why it wasn't chosen:** the reasoning preamble makes the response harder to parse reliably (has to be stripped out before `JSON.parse`), roughly doubles token usage/latency/cost per request, and in side-by-side testing didn't produce meaningfully better `overallScore` values or suggestions than the direct schema-first prompt — the task is closer to structured extraction than open-ended reasoning, so the extra "thinking out loud" step didn't earn its cost. Kept as a documented option in case a future model/version benefits more from it.

---

## Variation 2 — Split into `systemInstruction` + short user prompt

**Idea:** move the role/format/rules into Gemini's dedicated `systemInstruction` field (a first-class part of the `generateContent` request, separate from `contents`) and keep the per-request user message minimal.

```js
// request body
{
  systemInstruction: {
    parts: [{ text: `You are an assistant for a hospitality review analytics
platform. Always respond with ONLY a single valid JSON object matching this
exact shape: { sentiment, overallScore, positivePoints, negativePoints,
improvementSuggestions, hostResponse }. No markdown fences, no commentary.` }]
  },
  contents: [{
    role: 'user',
    parts: [{ text: `Guest: ${guestName || 'Unknown'} | Property: ${property || 'Unknown'} | Rating: ${rating ?? 'N/A'}\nReview: """${comment}"""` }]
  }]
}
```

**Why it wasn't chosen (yet):** functionally near-identical output quality to the production prompt in testing — `systemInstruction` and a well-structured user message are treated very similarly by Gemini for a single-turn request like this one. It's a slightly cleaner separation of "instructions" from "data" and would be the natural next step if this endpoint grows multi-turn (e.g. a follow-up "regenerate the host reply in a friendlier tone" request reusing the same system instruction), but for the current single-shot use case it adds a second field to build and log without a measurable accuracy gain. Documented here so it's a one-line change (`buildPrompt` → `buildSystemInstruction` + `buildUserContent`) if/when that need shows up.

---

## Sample Input / Output

**Request** — `POST /api/ai/analyze`
```json
{
  "comment": "The apartment was spotless and the host, Maria, checked in on us twice to make sure everything was okay. The only downside was that the WiFi kept dropping in the evenings, which made it hard to work remotely.",
  "guestName": "Alex Chen",
  "property": "Riverside Loft 3B",
  "rating": 4
}
```

**Response**
```json
{
  "success": true,
  "message": "Review analyzed successfully.",
  "data": {
    "sentiment": "positive",
    "overallScore": 78,
    "positivePoints": [
      "Apartment was spotless",
      "Host was attentive and checked in twice"
    ],
    "negativePoints": [
      "WiFi repeatedly dropped in the evenings"
    ],
    "improvementSuggestions": [
      "Upgrade or troubleshoot the evening WiFi reliability",
      "Consider a backup mobile hotspot for remote-working guests"
    ],
    "hostResponse": "Thank you so much for staying with us, Alex — we're so glad the space felt spotless and that Maria could look after you! We're sorry the WiFi gave you trouble in the evenings and are looking into it so future guests (and you, if you return!) have a smoother connection."
  }
}
```

(Illustrative — actual Gemini output varies run to run since `temperature: 0.4` is non-zero by design, to keep `hostResponse` from sounding robotic/repetitive across reviews.)

---

## Notes on reliability (not prompt text, but part of the same design)

These live in code, not the prompt, but are worth noting alongside it since they're what makes the prompt above safe to rely on in production:

- **Shape validation** (`validateShape`) rejects any response missing a required key, with a bad `sentiment` enum value, or an out-of-range `overallScore` — the caller gets a clean `502` instead of malformed data reaching the frontend.
- **Retry with backoff** on timeouts, network errors, `429`, and `5xx` (`GEMINI_MAX_RETRIES`, default 2) — transient failures self-heal without the user re-submitting.
- **Fail-fast on missing config**: no `GEMINI_API_KEY` → `503` immediately, no wasted request.
