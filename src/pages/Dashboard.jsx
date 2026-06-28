import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Loader from '../components/ui/Loader'
import { useToast } from '../components/ui/Toast'
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

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // Derive stat cards from real data
  const stats = data ? [
    { label: 'Total Reviews',    value: data.totalReviews.toLocaleString(),                   up: true  },
    { label: 'Positive Reviews', value: data.sentimentBreakdown.positive.toLocaleString(),    up: true  },
    { label: 'Negative Reviews', value: data.sentimentBreakdown.negative.toLocaleString(),    up: false },
    { label: 'Average Rating',   value: data.averageRating.toFixed(1),                        up: true  },
  ] : []

  // Chart: property summary as horizontal bars
  const chartItems = data?.propertySummary ?? []

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

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader size="lg" label="Loading dashboard…" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="card p-8 text-center">
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
              {stats.map(({ label, value, up }) => (
                <div key={label} className="card p-5">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</p>
                  <p className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
                    {up ? '▲' : '▼'} live data
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + recent */}
            <div className="grid lg:grid-cols-3 gap-5">

              {/* Property summary bars */}
              <div className="lg:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Property Performance</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Review count & average rating per property</p>
                  </div>
                </div>

                {chartItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No property data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {chartItems.map(({ property, reviewCount, avgRating }) => (
                      <div key={property}>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                          <span className="truncate font-medium">{property}</span>
                          <span className="ml-2 flex-shrink-0 text-gray-400">{reviewCount} review{reviewCount !== 1 ? 's' : ''} · {avgRating}★</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all duration-500"
                            style={{ width: `${(avgRating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentiment breakdown */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-around text-center">
                  {Object.entries(data.sentimentBreakdown).map(([s, count]) => (
                    <div key={s}>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</p>
                      <p className="text-xs text-gray-500 capitalize">{s}</p>
                      <span className={`inline-block mt-1 w-2 h-2 rounded-full ${SENTIMENT_DOT[s]}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent reviews */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Reviews</h2>
                {data.recentReviews.length === 0 ? (
                  <p className="text-sm text-gray-400">No reviews yet.</p>
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
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
