import { memo } from 'react'

/**
 * StatCard
 * A single statistic tile for the dashboard header row.
 *
 * @param {string} label - e.g. "Total Reviews"
 * @param {string|number} value - the headline number
 * @param {string} [sub] - small supporting text below the value (data-derived, never a fabricated trend)
 * @param {'up'|'down'|'neutral'} [tone='neutral'] - colours the sub text
 * @param {React.ReactNode} [icon] - small icon shown top-right
 */
const TONE_CLASSES = {
  up:      'text-green-600 dark:text-green-400',
  down:    'text-red-500 dark:text-red-400',
  neutral: 'text-gray-400 dark:text-gray-500',
}

function StatCard({ label, value, sub, tone = 'neutral', icon }) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {icon && (
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className={`text-xs font-medium ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}>{sub}</p>}
    </div>
  )
}

export default memo(StatCard)
