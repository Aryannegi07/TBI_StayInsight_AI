import { memo, useEffect, useRef } from 'react'

/**
 * AIStreamingPreview
 * Shown while the AI is actively generating a response. Renders the raw
 * text arriving from the SSE stream in a terminal-like panel with a
 * blinking cursor, auto-scrolling to the latest content. Once the stream
 * finishes, the caller swaps this out for the fully formatted
 * <AIAnalysisCard>.
 *
 * @param {string} text - accumulated raw text streamed so far
 */
function AIStreamingPreview({ text }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [text])

  return (
    <div className="card p-6 animate-[fadeIn_0.2s_ease]" role="status" aria-live="polite">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Generating analysis…
        </span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-56 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-3.5"
      >
        <pre className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words font-mono">
          {text || ' '}
          <span className="inline-block w-1.5 h-3.5 align-text-bottom bg-brand-500 ml-0.5 animate-pulse" />
        </pre>
      </div>
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Streaming live from the AI model — this will turn into a formatted report once complete.
      </p>
    </div>
  )
}

export default memo(AIStreamingPreview)
