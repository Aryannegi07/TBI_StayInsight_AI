import { memo } from 'react'

// Static presentation config only — no fabricated numbers. The score shown
// per card is derived from the review's real `rating` (see below), never
// a fixed per-sentiment constant.
const SENTIMENT_CONFIG = {
  positive: {
    label: 'Positive',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    barClass:   'bg-green-500',
    dotClass:   'bg-green-500',
  },
  neutral: {
    label: 'Neutral',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    barClass:   'bg-yellow-500',
    dotClass:   'bg-yellow-500',
  },
  negative: {
    label: 'Negative',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    barClass:   'bg-red-400',
    dotClass:   'bg-red-400',
  },
}

function ReviewCard({ title, review, sentiment = 'neutral', theme, rating }) {
  const cfg = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral
  // Score bar only renders when a real rating is supplied — never a
  // fabricated stand-in number.
  const hasScore = typeof rating === 'number' && !Number.isNaN(rating)
  const score = hasScore ? Math.round((rating / 5) * 100) : null

  return (
    <article className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 flex-1">
          {title}
        </h3>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4 flex-1">
        {review}
      </p>

      {/* Score bar — only shown when a real rating was supplied */}
      {hasScore && (
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-gray-400">
            <span>Guest rating</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{score}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.barClass}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Theme tag */}
      {theme && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400 flex-shrink-0">
            <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400">{theme}</span>
        </div>
      )}
    </article>
  )
}

export default memo(ReviewCard)
