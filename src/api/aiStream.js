// ─── StayInsight AI – Streaming AI Analysis ───────────────────────────────
// The regular AIApi.analyze() call in api.js waits for the full response.
// This module talks to POST /api/ai/analyze/stream instead, which is a
// Server-Sent Events endpoint: it streams raw text chunks as Gemini
// generates them, then a final `done` event with the parsed, validated
// analysis. We can't use the built-in EventSource here since it only
// supports GET requests with no custom headers, so this hand-rolls a
// minimal SSE parser on top of fetch's ReadableStream.

import { getToken } from './api'

const baseURL = import.meta.env.VITE_API_URL || '/api'

/**
 * @param {{ comment: string, guestName?: string, property?: string, rating?: number, reviewId?: number }} body
 * @param {{ onDelta?: (text: string) => void, signal?: AbortSignal }} handlers
 * @returns {Promise<object>} the final validated analysis object
 */
export async function streamAnalyze(body, { onDelta, signal } = {}) {
  const token = getToken()

  let res
  try {
    res = await fetch(`${baseURL}/ai/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Network error – could not reach the server. Is the backend running?', { cause: err })
  }

  if (!res.ok) {
    // The server only sends non-2xx here for things that happen before it
    // switches into SSE mode (auth failure, rate limit, validation).
    let message = `Request failed (${res.status}).`
    try {
      const data = await res.json()
      message = data?.message || message
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    const wrapped = new Error(message)
    wrapped.status = res.status
    throw wrapped
  }

  if (!res.body) {
    throw new Error('Streaming is not supported by this browser or connection.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalResult = null
  let streamError = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by a blank line.
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data: '))
      if (!line) continue // e.g. a ": ping" heartbeat comment
      let payload
      try {
        payload = JSON.parse(line.slice('data: '.length))
      } catch {
        continue
      }

      if (payload.type === 'delta') {
        onDelta?.(payload.text)
      } else if (payload.type === 'done') {
        finalResult = payload.data
      } else if (payload.type === 'error') {
        streamError = payload.message
      }
    }
  }

  if (streamError) throw new Error(streamError)
  if (!finalResult) throw new Error('AI analysis stream ended without a result.')
  return finalResult
}
