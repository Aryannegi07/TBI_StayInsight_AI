import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ReviewCard from '../components/ReviewCard'
import Footer from '../components/Footer'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCardGrid } from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import { ReviewsAPI } from '../api/api'

// How many of the most recent reviews to feature on the landing page.
const FEATURED_COUNT = 3

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3L12.5 8.5H18L13.5 12L15.5 17.5L10 14L4.5 17.5L6.5 12L2 8.5H7.5L10 3Z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Sentiment Analysis',
    description: 'Detect positive, neutral, and negative tone in every guest review with high accuracy — automatically, at scale.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14M3 9h9M3 13h11M3 17h7" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Theme Detection',
    description: 'Cluster feedback into categories — cleanliness, service, food, location — so you can spot patterns across hundreds of reviews.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M17 10C17 13.866 13.866 17 10 17C8.6 17 7.3 16.6 6.2 15.9L3 17L4.1 13.8C3.4 12.7 3 11.4 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="7" cy="10" r="1" fill="#2563eb"/>
        <circle cx="10" cy="10" r="1" fill="#2563eb"/>
        <circle cx="13" cy="10" r="1" fill="#2563eb"/>
      </svg>
    ),
    title: 'Smart Responses',
    description: 'Generate on-brand reply drafts for each review in seconds — ready to post with minor edits or approved as-is.',
  },
]

export default function Home() {
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const { addToast } = useToast()

  const fetchFeatured = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Public endpoint — no auth required. Feature the most recent reviews.
      const res = await ReviewsAPI.getAll()
      setReviews((res.data ?? []).slice(0, FEATURED_COUNT))
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
    queueMicrotask(() => { fetchFeatured() })
  }, [fetchFeatured])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* Featured Reviews — live from the backend */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reviews, parsed and understood</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              StayInsight extracts sentiment and themes from every guest review automatically.
            </p>
          </div>

          {loading && <SkeletonCardGrid count={3} />}

          {!loading && error && (
            <div className="card p-8 text-center" role="alert">
              <p className="text-red-500 font-medium mb-2">Failed to load reviews</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <button onClick={fetchFeatured} className="btn-primary mx-auto">Retry</button>
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <EmptyState
              variant="inline"
              title="No reviews yet"
              description="Be the first to analyse a guest review."
              className="py-12"
            />
          )}

          {!loading && !error && reviews.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  title={r.property}
                  review={r.comment}
                  sentiment={r.sentiment}
                  theme={r.guestName}
                  rating={r.rating}
                />
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Everything you need to understand guests</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                Three core capabilities that turn raw feedback into actionable hospitality intelligence.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {FEATURES.map(({ icon, title, description }) => (
                <div key={title} className="card p-6 hover:shadow-md dark:hover:shadow-black/30 transition-shadow">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800/50 flex items-center justify-center mb-4">
                    {icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
