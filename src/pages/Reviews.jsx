import { useState } from 'react'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import Footer from '../components/Footer'

function analyseReview(text) {
  const lower = text.toLowerCase()
  const positiveWords = ['great','excellent','amazing','wonderful','fantastic','perfect','outstanding','love','best','superb','spotless','attentive','smooth','fresh','definitely','exceeded','clean','friendly']
  const negativeWords = ['bad','terrible','awful','horrible','worst','dirty','noisy','rude','slow','broken','disappointed','disappointing','stain','rattle','hour','poor','unacceptable']

  const posCount = positiveWords.filter(w => lower.includes(w)).length
  const negCount = negativeWords.filter(w => lower.includes(w)).length

  let sentiment
  if (posCount > negCount + 1)      sentiment = 'positive'
  else if (negCount > posCount + 1) sentiment = 'negative'
  else                               sentiment = 'neutral'

  const themeMap = [
    [['clean','spotless','dirty','stain'],          'Cleanliness'],
    [['staff','service','concierge','rude','attentive'], 'Staff & Service'],
    [['breakfast','food','pastry','restaurant'],    'Food & Dining'],
    [['noisy','quiet','noise','loud'],              'Noise Levels'],
    [['location','walk','distance','city'],         'Location'],
    [['price','value','expensive','worth'],         'Value for Money'],
  ]
  const theme = themeMap.find(([kws]) => kws.some(k => lower.includes(k)))?.[1] ?? 'General Experience'
  const words = text.trim().split(/\s+/)
  const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '')

  return { title, review: text.trim(), sentiment, theme }
}

export default function Reviews() {
  const [input, setInput]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function handleAnalyse() {
    const trimmed = input.trim()
    if (!trimmed)          { setError('Please enter a review before analysing.'); return }
    if (trimmed.length < 10) { setError('Review is too short — please add more detail.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setResults(prev => [analyseReview(trimmed), ...prev])
      setLoading(false)
    }, 500)
  }

  function handleClear() {
    setInput('')
    setResults([])
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Review Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Paste a guest review to detect sentiment, extract themes, and score feedback.
          </p>
        </div>

        {/* Input card */}
        <div className="card p-6 mb-8">
          <label htmlFor="review-input" className="block text-sm font-medium text-gray-700 mb-2">
            Guest review
          </label>
          <textarea
            id="review-input"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="Paste a guest review here…"
            rows={5}
            className="input resize-y"
          />

          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

          <div className="flex items-center justify-between mt-1 mb-5">
            <span />
            <span className="text-xs text-gray-400">{input.length} characters</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" strokeDasharray="8 8" strokeLinecap="round"/>
                  </svg>
                  Analysing…
                </>
              ) : 'Analyse Review'}
            </button>

            <button onClick={handleClear} className="btn-secondary">
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Results
              <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {results.length}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r, i) => <ReviewCard key={i} {...r} />)}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <svg className="mx-auto mb-3 opacity-40" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="4" y="6" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 14h16M10 19h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm">Paste a review above and click <span className="font-medium text-gray-600">Analyse Review</span></p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
