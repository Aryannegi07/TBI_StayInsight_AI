import { memo } from 'react'

/**
 * AIAnalysisSkeleton
 * Pulsing placeholder shown while a review is being analysed, mirroring the
 * layout of AIAnalysisCard so the UI doesn't "jump" once results arrive.
 */
function AIAnalysisSkeleton() {
  return (
    <div className="card p-6 animate-pulse" role="status" aria-label="Analysing review…">
      {/* Header: score meter + sentiment */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-[92px] h-[92px] rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>

      {/* Points grid */}
      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <div className="space-y-2.5">
          <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-4/6 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-5 space-y-2.5">
        <div className="h-3 w-36 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3.5 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
      </div>

      {/* Host reply */}
      <div className="pt-5 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
        <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-16 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>

      <span className="sr-only">Analysing review…</span>
    </div>
  )
}

export default memo(AIAnalysisSkeleton)
