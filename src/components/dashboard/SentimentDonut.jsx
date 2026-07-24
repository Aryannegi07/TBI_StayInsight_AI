import { memo } from 'react'

/**
 * SentimentDonut
 * Small SVG donut chart visualising the positive/neutral/negative review
 * split, plus a legend with counts and percentages.
 *
 * @param {{ positive: number, neutral: number, negative: number }} breakdown
 */
const COLORS = {
  positive: '#22c55e',
  neutral:  '#eab308',
  negative: '#ef4444',
}

const LABELS = {
  positive: 'Positive',
  neutral:  'Neutral',
  negative: 'Negative',
}

function SentimentDonut({ breakdown }) {
  const entries = ['positive', 'neutral', 'negative'].map(key => ({
    key,
    count: breakdown?.[key] ?? 0,
  }))
  const total = entries.reduce((sum, e) => sum + e.count, 0)

  const radius = 40
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  return (
    <div className="flex items-center gap-6">
      <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90 flex-shrink-0" aria-hidden="true">
        <circle cx="52" cy="52" r={radius} fill="none" strokeWidth="14" className="stroke-gray-100 dark:stroke-gray-800" />
        {total > 0 && entries.map(({ key, count }) => {
          if (count === 0) return null
          const fraction = count / total
          const dash = fraction * circumference
          const offset = -cumulative * circumference
          cumulative += fraction
          return (
            <circle
              key={key}
              cx="52" cy="52" r={radius}
              fill="none"
              stroke={COLORS[key]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
          )
        })}
      </svg>

      <div className="flex-1 min-w-0" role="img" aria-label={`Sentiment breakdown: ${entries.map(e => `${e.count} ${LABELS[e.key]}`).join(', ')}`}>
        <ul className="space-y-2">
          {entries.map(({ key, count }) => (
            <li key={key} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[key] }} />
                {LABELS[key]}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {count}
                <span className="ml-1 text-gray-400 font-normal">
                  ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default memo(SentimentDonut)
