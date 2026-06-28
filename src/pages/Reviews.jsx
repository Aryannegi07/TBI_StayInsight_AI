import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import Footer from '../components/Footer'
import Loader from '../components/ui/Loader'
import { useToast } from '../components/ui/Toast'
import { ReviewsAPI } from '../api/api'

export default function Reviews() {
  // ── Analyse tab state ──────────────────────────────────────────────────────
  const [input, setInput]         = useState('')
  const [analyseError, setAnalyseError] = useState('')
  const [analyseLoading, setAnalyseLoading] = useState(false)

  // ── Browse / search state ─────────────────────────────────────────────────
  const [reviews, setReviews]     = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [activeTab, setActiveTab] = useState('analyse') // 'analyse' | 'browse'

  const { addToast } = useToast()

  // ── Fetch all reviews ──────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const res = await ReviewsAPI.getAll()
      setReviews(res.data)
    } catch (err) {
      setListError(err.message)
      addToast({ message: err.message, type: 'error' })
    } finally {
      setListLoading(false)
    }
  }, [addToast])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) {
      addToast({ message: 'Please enter a search term.', type: 'warning' })
      return
    }
    setSearchLoading(true)
    try {
      const res = await ReviewsAPI.search(q)
      setSearchResults(res.data)
      if (res.data.length === 0) {
        addToast({ message: `No results found for "${q}".`, type: 'info' })
      } else {
        addToast({ message: `${res.data.length} result${res.data.length !== 1 ? 's' : ''} found.`, type: 'success' })
      }
    } catch (err) {
      addToast({ message: err.message, type: 'error' })
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
  }

  const displayedReviews = searchResults ?? reviews

  // ── Analyse: send review to backend ───────────────────────────────────────
  const [analysedResults, setAnalysedResults] = useState([])

  async function handleAnalyse() {
    const trimmed = input.trim()
    if (!trimmed) {
      setAnalyseError('Please enter a review before analysing.')
      addToast({ message: 'Review text is required.', type: 'warning' })
      return
    }
    if (trimmed.length < 10) {
      setAnalyseError('Review is too short — please add more detail.')
      addToast({ message: 'Review is too short.', type: 'warning' })
      return
    }
    setAnalyseError('')
    setAnalyseLoading(true)

    // Derive sentiment locally (backend create requires guestName/property/rating)
    // We use the API to persist it as well with placeholder fields, then show it.
    const lower = trimmed.toLowerCase()
    const posWords = ['great','excellent','amazing','wonderful','fantastic','perfect','outstanding','love','best','superb','spotless','attentive','smooth','fresh','definitely','exceeded','clean','friendly']
    const negWords = ['bad','terrible','awful','horrible','worst','dirty','noisy','rude','slow','broken','disappointed','disappointing','stain','rattle','poor','unacceptable']
    const posCount = posWords.filter(w => lower.includes(w)).length
    const negCount = negWords.filter(w => lower.includes(w)).length
    let sentiment
    if (posCount > negCount + 1)       sentiment = 'positive'
    else if (negCount > posCount + 1)  sentiment = 'negative'
    else                               sentiment = 'neutral'

    const themeMap = [
      [['clean','spotless','dirty','stain'],               'Cleanliness'],
      [['staff','service','concierge','rude','attentive'], 'Staff & Service'],
      [['breakfast','food','pastry','restaurant'],         'Food & Dining'],
      [['noisy','quiet','noise','loud'],                   'Noise Levels'],
      [['location','walk','distance','city'],              'Location'],
      [['price','value','expensive','worth'],              'Value for Money'],
    ]
    const theme = themeMap.find(([kws]) => kws.some(k => lower.includes(k)))?.[1] ?? 'General Experience'
    const words = trimmed.split(/\s+/)
    const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '')
    const rating = sentiment === 'positive' ? 5 : sentiment === 'negative' ? 2 : 3

    try {
      const res = await ReviewsAPI.create({
        guestName: 'Guest (Manual Entry)',
        property:  'Manual Review',
        rating,
        sentiment,
        comment:   trimmed,
        tags:      [theme.toLowerCase().replace(/\s+&?\s+/g, '-')],
      })
      setAnalysedResults(prev => [{ title, review: trimmed, sentiment, theme }, ...prev])
      addToast({ message: 'Review analysed and saved!', type: 'success' })
      // Refresh browse list
      fetchReviews()
    } catch (err) {
      addToast({ message: err.message || 'Failed to save review.', type: 'error' })
      // Still show the local analysis result
      setAnalysedResults(prev => [{ title, review: trimmed, sentiment, theme }, ...prev])
    } finally {
      setAnalyseLoading(false)
    }
  }

  function handleClear() {
    setInput('')
    setAnalysedResults([])
    setAnalyseError('')
  }

  // ── Delete a review ────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Delete this review?')) return
    try {
      await ReviewsAPI.remove(id)
      setReviews(prev => prev.filter(r => r.id !== id))
      if (searchResults) setSearchResults(prev => prev.filter(r => r.id !== id))
      addToast({ message: 'Review deleted.', type: 'success' })
    } catch (err) {
      addToast({ message: err.message, type: 'error' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Review Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Analyse new guest reviews or browse all saved reviews.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-700">
          {['analyse', 'browse'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'analyse' ? 'Analyse Review' : `Browse All (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* ── Analyse Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'analyse' && (
          <>
            <div className="card p-6 mb-8">
              <label htmlFor="review-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Guest review
              </label>
              <textarea
                id="review-input"
                value={input}
                onChange={e => { setInput(e.target.value); setAnalyseError('') }}
                placeholder="Paste a guest review here…"
                rows={5}
                className="input resize-y"
              />

              {analyseError && <p className="mt-1.5 text-xs text-red-600">{analyseError}</p>}

              <div className="flex items-center justify-between mt-1 mb-5">
                <span />
                <span className="text-xs text-gray-400">{input.length} characters</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAnalyse}
                  disabled={analyseLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyseLoading ? (
                    <>
                      <Loader size="sm" />
                      Analysing…
                    </>
                  ) : 'Analyse Review'}
                </button>
                <button onClick={handleClear} className="btn-secondary">Clear</button>
              </div>
            </div>

            {analysedResults.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Results
                  <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {analysedResults.length}
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {analysedResults.map((r, i) => <ReviewCard key={i} {...r} />)}
                </div>
              </div>
            )}

            {analysedResults.length === 0 && !analyseLoading && (
              <div className="text-center py-16 text-gray-400">
                <svg className="mx-auto mb-3 opacity-40" width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect x="4" y="6" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 14h16M10 19h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm">
                  Paste a review above and click <span className="font-medium text-gray-600 dark:text-gray-300">Analyse Review</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Browse Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'browse' && (
          <>
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by guest, property, sentiment, tag…"
                className="input flex-1"
              />
              <button type="submit" disabled={searchLoading} className="btn-primary disabled:opacity-50">
                {searchLoading ? <Loader size="sm" /> : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                Search
              </button>
              {searchResults !== null && (
                <button type="button" onClick={clearSearch} className="btn-secondary">Clear</button>
              )}
            </form>

            {searchResults !== null && (
              <p className="text-sm text-gray-500 mb-4">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {/* List loader */}
            {listLoading && (
              <div className="flex justify-center py-16">
                <Loader size="lg" label="Loading reviews…" />
              </div>
            )}

            {/* List error */}
            {!listLoading && listError && (
              <div className="card p-8 text-center">
                <p className="text-red-500 mb-2 font-medium">Failed to load reviews</p>
                <p className="text-sm text-gray-500 mb-4">{listError}</p>
                <button onClick={fetchReviews} className="btn-primary mx-auto">Retry</button>
              </div>
            )}

            {/* Empty state */}
            {!listLoading && !listError && displayedReviews.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">No reviews found.</p>
              </div>
            )}

            {/* Reviews grid */}
            {!listLoading && !listError && displayedReviews.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedReviews.map(r => (
                  <div key={r.id} className="relative group">
                    <ReviewCard
                      title={r.property}
                      review={r.comment}
                      sentiment={r.sentiment}
                      theme={r.guestName}
                    />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <span className="text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono">
                        {r.rating}★
                      </span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded hover:bg-red-600"
                        title="Delete review"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
