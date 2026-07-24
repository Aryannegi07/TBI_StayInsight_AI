import { memo } from 'react'

/**
 * RatingTrend
 * Minimal SVG sparkline plotting star-rating (1-5) across the most recent
 * reviews, oldest to newest, so a host can eyeball whether things are
 * trending up or down.
 *
 * @param {Array<{ rating: number, createdAt: string }>} reviews - most-recent-first
 */
function RatingTrend({ reviews = [] }) {
  if (reviews.length < 2) {
    return <p className="text-xs text-gray-400 text-center py-6">Not enough data yet for a trend.</p>
  }

  // Reverse to chronological (oldest → newest, left → right).
  const chrono = [...reviews].reverse()
  const width = 240
  const height = 56
  const padX = 4
  const padY = 6

  const points = chrono.map((r, i) => {
    const x = padX + (i / (chrono.length - 1)) * (width - padX * 2)
    const y = height - padY - ((r.rating - 1) / 4) * (height - padY * 2)
    return { x, y }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const first = chrono[0].rating
  const last = chrono[chrono.length - 1].rating
  const trendLabel = last > first ? 'Trending up' : last < first ? 'Trending down' : 'Holding steady'
  const trendColor = last > first ? 'text-green-600 dark:text-green-400' : last < first ? 'text-red-500 dark:text-red-400' : 'text-gray-400'

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Rating trend across recent reviews: ${trendLabel.toLowerCase()}`}>
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 dark:text-brand-400" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" className="fill-brand-500 dark:fill-brand-400" />
        ))}
      </svg>
      <p className={`text-xs font-medium mt-1 ${trendColor}`}>{trendLabel} · last {chrono.length} reviews</p>
    </div>
  )
}

export default memo(RatingTrend)
