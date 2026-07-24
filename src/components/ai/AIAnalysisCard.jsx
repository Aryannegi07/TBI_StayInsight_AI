import { useState, memo } from 'react'
import SentimentBadge from './SentimentBadge'
import ScoreMeter from './ScoreMeter'
import Markdown from './Markdown'
import { useToast } from '../../hooks/useToast'

function ConfidenceBar({ confidence }) {
  const clamped = Math.max(0, Math.min(100, Math.round(confidence ?? 0)))
  const tone =
    clamped >= 70 ? 'bg-brand-500' :
    clamped >= 40 ? 'bg-amber-400' :
    'bg-gray-400'

  return (
    <div className="flex items-center gap-2" title={`AI confidence: ${clamped}%`}>
      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Confidence</span>
      <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${clamped}%`, transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{clamped}%</span>
    </div>
  )
}

const PointList = memo(function PointList({ items, tone }) {
  const toneClasses = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-500 dark:text-red-400',
    suggestion: 'text-brand-600 dark:text-brand-400',
  }
  const icon = {
    positive: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="flex-shrink-0 mt-0.5">
        <path d="M2.5 7.3L5.5 10.3L11.5 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    negative: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="flex-shrink-0 mt-0.5">
        <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    suggestion: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="flex-shrink-0 mt-0.5">
        <path d="M7 1.5a3.5 3.5 0 00-2 6.37c.4.3.5.66.5 1.02V9.5h3v-.61c0-.36.1-.72.5-1.02A3.5 3.5 0 007 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 11.5h3M6 13h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  }

  if (!items || items.length === 0) {
    return <p className="text-xs text-gray-400 italic">None identified.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((point, i) => (
        <li key={i} className={`flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 ${toneClasses[tone]}`}>
          {icon[tone]}
          <span className="text-gray-700 dark:text-gray-300 [&_p]:m-0"><Markdown>{point}</Markdown></span>
        </li>
      ))}
    </ul>
  )
})

/**
 * AIAnalysisCard
 * Displays the full result of a Gemini-powered review analysis:
 * sentiment, score meter, positive/negative points, suggestions and a
 * ready-to-send host reply.
 *
 * @param {object} result - { sentiment, overallScore, confidence, positivePoints, negativePoints, improvementSuggestions, hostResponse }
 * @param {string} [reviewText] - the original guest review, shown collapsed
 * @param {Function} [onRegenerate] - called to re-run the analysis for the same review, requesting a fresh result
 * @param {boolean} [regenerating] - true while a regenerate request for this card is in flight
 */
function AIAnalysisCard({ result, reviewText, onRegenerate, regenerating = false }) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  if (!result) return null

  const {
    sentiment = 'neutral',
    overallScore = 0,
    confidence,
    positivePoints = [],
    negativePoints = [],
    improvementSuggestions = [],
    hostResponse = '',
  } = result

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(hostResponse)
      setCopied(true)
      addToast({ message: 'Host reply copied to clipboard.', type: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast({ message: 'Could not copy — please copy manually.', type: 'error' })
    }
  }

  return (
    <article className={`card p-6 animate-[fadeIn_0.25s_ease] transition-opacity ${regenerating ? 'opacity-60' : ''}`}>
      {/* Header: sentiment + score */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
        <ScoreMeter score={overallScore} sizePx={92} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SentimentBadge sentiment={sentiment} />
            {typeof confidence === 'number' && <ConfidenceBar confidence={confidence} />}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={regenerating}
                title="Regenerate this analysis"
                className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                  className={regenerating ? 'animate-spin' : ''}
                >
                  <path d="M9.9 5A3.9 3.9 0 116.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M9.9 1.8V5H6.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            )}
          </div>
          {reviewText && (
            <div>
              <button
                type="button"
                onClick={() => setShowOriginal(v => !v)}
                aria-expanded={showOriginal}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                {showOriginal ? 'Hide' : 'Show'} original review
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
                  className={`transition-transform ${showOriginal ? 'rotate-180' : ''}`}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showOriginal && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {reviewText}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Points grid */}
      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2.5">
            What guests liked
          </h4>
          <PointList items={positivePoints} tone="positive" />
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2.5">
            Areas of concern
          </h4>
          <PointList items={negativePoints} tone="negative" />
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2.5">
          Suggestions for the host
        </h4>
        <PointList items={improvementSuggestions} tone="suggestion" />
      </div>

      {/* Host reply */}
      <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Suggested host reply
          </h4>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.3L4.7 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2.5 8V2.5a1 1 0 011-1H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3.5 [&_p]:m-0">
          <Markdown>{hostResponse}</Markdown>
        </div>
      </div>
    </article>
  )
}

export default memo(AIAnalysisCard)
