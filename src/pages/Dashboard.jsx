import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Loader from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonStatRow, SkeletonBarList, SkeletonListRows, SkeletonBlock } from '../components/ui/Skeleton'
import ErrorBoundary from '../components/ErrorBoundary'
import StatCard from '../components/dashboard/StatCard'
import SentimentDonut from '../components/dashboard/SentimentDonut'
import RatingTrend from '../components/dashboard/RatingTrend'
import { useToast } from '../hooks/useToast'
import { DashboardAPI } from '../api/api'

const SENTIMENT_DOT = {
  positive: 'bg-green-500',
  neutral:  'bg-yellow-500',
  negative: 'bg-red-400',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const { addToast } = useToast()

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await DashboardAPI.get()
      setData(res.data)
    } catch (err) {
      setError(err.message)
      addToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    // Deferred via queueMicrotask so the initial fetch's setState calls don't
    // run synchronously inside the effect body (avoids cascading renders).
    queueMicrotask(() => { fetchDashboard() })
  }, [fetchDashboard])

  // Derive stat cards from real data — every "sub" value below is computed
  // from the actual payload, never a fabricated trend arrow. Memoized so
  // this recomputes only when `data` itself changes, not on every render.
  const stats = useMemo(() => {
    if (!data) return []
    const positivePct = data.totalReviews > 0
      ? Math.round((data.sentimentBreakdown.positive / data.totalReviews) * 100)
      : 0
    const negativePct = data.totalReviews > 0
      ? Math.round((data.sentimentBreakdown.negative / data.totalReviews) * 100)
      : 0

    return [
      {
        label: 'Total Reviews',
        value: data.totalReviews.toLocaleString(),
        sub: `${data.propertySummary.length} propert${data.propertySummary.length === 1 ? 'y' : 'ies'}`,
        tone: 'neutral',
      },
      {
        label: 'Positive Reviews',
        value: data.sentimentBreakdown.positive.toLocaleString(),
        sub: `${positivePct}% of total`,
        tone: 'up',
      },
      {
        label: 'Negative Reviews',
        value: data.sentimentBreakdown.negative.toLocaleString(),
        sub: `${negativePct}% of total`,
        tone: negativePct > 20 ? 'down' : 'neutral',
      },
      {
        label: 'Average Rating',
        value: data.averageRating.toFixed(1),
        sub: '★'.repeat(Math.round(data.averageRating)) + '☆'.repeat(5 - Math.round(data.averageRating)),
        tone: data.averageRating >= 4 ? 'up' : data.averageRating >= 3 ? 'neutral' : 'down',
      },
    ]
  }, [data])

  // Chart: property summary as horizontal bars
  const chartItems = useMemo(() => data?.propertySummary ?? [], [data])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Real-time insight across all guest reviews.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {loading ? <Loader size="sm" /> : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M9.5 1.5v2.5H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Refresh
            </button>
            <Link to="/reviews" className="btn-primary self-start">
              Analyse New Review
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5H11M11 6.5L7.5 3M11 6.5L7.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Loading state — skeletons mirror the eventual layout so the page doesn't jump */}
        {loading && (
          <div aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading dashboard…</span>
            <SkeletonStatRow count={4} />
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <div className="card p-6">
                  <SkeletonBlock className="h-3 w-40 mb-2" />
                  <SkeletonBlock className="h-3 w-56 mb-6" />
                  <SkeletonBarList rows={4} />
                </div>
                <div className="card p-6">
                  <SkeletonBlock className="h-3 w-32 mb-2" />
                  <SkeletonBlock className="h-3 w-48 mb-6" />
                  <SkeletonBlock className="h-32 w-full" />
                </div>
              </div>
              <div className="space-y-5">
                <div className="card p-6">
                  <SkeletonBlock className="h-3 w-36 mb-4" />
                  <SkeletonBlock className="h-40 w-40 rounded-full mx-auto" />
                </div>
                <div className="card p-6">
                  <SkeletonBlock className="h-3 w-32 mb-4" />
                  <SkeletonListRows rows={4} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="card p-8 text-center" role="alert">
            <p className="text-red-500 font-medium mb-2">Failed to load dashboard</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button onClick={fetchDashboard} className="btn-primary mx-auto">Retry</button>
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map(({ label, value, sub, tone }) => (
                <StatCard key={label} label={label} value={value} sub={sub} tone={tone} />
              ))}
            </div>

            {/* Charts + recent */}
            <div className="grid lg:grid-cols-3 gap-5">

              {/* Property summary bars + rating trend */}
              <div className="lg:col-span-2 space-y-5">
                <div className="card p-6">
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Property Performance</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Review count & average rating per property</p>
                  </div>

                  {chartItems.length === 0 ? (
                    <EmptyState
                      variant="inline"
                      title="No property data yet"
                      description="Add a review and it will show up here with a per-property breakdown."
                      className="py-8"
                    />
                  ) : (
                    <div className="space-y-4">
                      {chartItems.map(({ property, reviewCount, averageRating }) => (
                        <div key={property}>
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                            <span className="truncate font-medium">{property}</span>
                            <span className="ml-2 flex-shrink-0 text-gray-400">{reviewCount} review{reviewCount !== 1 ? 's' : ''} · {averageRating}★</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-600 transition-all duration-500"
                              style={{ width: `${(averageRating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Rating Trend</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Star rating across the most recent reviews</p>
                  </div>
                  <ErrorBoundary fallbackTitle="Couldn't render this chart">
                    <RatingTrend reviews={data.recentReviews} />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Sentiment donut + recent reviews */}
              <div className="space-y-5">
                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Sentiment Breakdown</h2>
                  <ErrorBoundary fallbackTitle="Couldn't render this chart">
                    <SentimentDonut breakdown={data.sentimentBreakdown} />
                  </ErrorBoundary>
                </div>

                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Reviews</h2>
                  {data.recentReviews.length === 0 ? (
                    <EmptyState
                      variant="inline"
                      title="No reviews yet"
                      description="Analysed and saved reviews will appear here."
                      className="py-6"
                    />
                  ) : (
                    <ul className="space-y-3">
                      {data.recentReviews.map((r) => (
                        <li key={r.id} className="flex items-start gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${SENTIMENT_DOT[r.sentiment]}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{r.property}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{r.guestName} · {r.rating}★</p>
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(r.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/reviews" className="mt-4 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
                    View all
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
