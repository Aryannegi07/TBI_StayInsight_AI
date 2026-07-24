/**
 * Skeleton primitives
 *
 * Lightweight building blocks for loading placeholders. Prefer these over a
 * bare spinner whenever the eventual content has a predictable shape (stat
 * tiles, cards, list rows, table rows) — skeletons communicate the shape of
 * what's coming and feel faster than a blank area + spinner.
 *
 * All pieces respect prefers-reduced-motion via the `motion-safe:` variant
 * on the pulse animation (configured through Tailwind's default behaviour).
 */

/** Base shimmering block. Compose with width/height utility classes. */
export function SkeletonBlock({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  )
}

/** A single line of skeleton text. */
export function SkeletonText({ className = 'h-3 w-full' }) {
  return <SkeletonBlock className={className} />
}

/** Mimics a StatCard tile while dashboard stats are loading. */
export function SkeletonStatCard() {
  return (
    <div className="card p-5 flex flex-col gap-3" aria-hidden="true">
      <SkeletonText className="h-3 w-2/3" />
      <SkeletonText className="h-7 w-1/2" />
      <SkeletonText className="h-3 w-1/3" />
    </div>
  )
}

/** Mimics a ReviewCard / AIAnalysisCard while a list is loading. */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 flex flex-col gap-4" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <SkeletonText className="h-4 w-2/3" />
        <SkeletonBlock className="h-5 w-16 rounded-full flex-shrink-0" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonText key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
      <SkeletonText className="h-1.5 w-full rounded-full" />
    </div>
  )
}

/** A grid of skeleton cards — drop-in replacement for a card grid while loading. */
export function SkeletonCardGrid({ count = 6, className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={className} role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** A row of skeleton stat tiles — drop-in replacement for the dashboard stat row. */
export function SkeletonStatRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

/** Mimics a horizontal bar-list panel (e.g. Property Performance). */
export function SkeletonBarList({ rows = 4 }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <SkeletonText className="h-3 w-1/3" />
            <SkeletonText className="h-3 w-1/5" />
          </div>
          <SkeletonText className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Mimics a compact list row (e.g. Recent Reviews sidebar). */
export function SkeletonListRows({ rows = 4 }) {
  return (
    <ul className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
          <SkeletonBlock className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonText className="h-3 w-2/3" />
            <SkeletonText className="h-2.5 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default SkeletonBlock
