import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import Footer from '../components/Footer'
import Loader from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCardGrid } from '../components/ui/Skeleton'
import AIAnalysisCard from '../components/ai/AIAnalysisCard'
import AIAnalysisSkeleton from '../components/ai/AIAnalysisSkeleton'
import AIStreamingPreview from '../components/ai/AIStreamingPreview'
import { useToast } from '../hooks/useToast'
import { ReviewsAPI, AIApi } from '../api/api'
import { streamAnalyze } from '../api/aiStream'

const EMPTY_FORM = { guestName: '', property: '', rating: 5, sentiment: 'neutral', comment: '', tags: '' }

function validateForm(form) {
  const errors = {}
  if (!form.guestName.trim()) errors.guestName = 'Guest name is required.'
  if (!form.property.trim()) errors.property = 'Property is required.'
  const rating = Number(form.rating)
  if (!form.rating || Number.isNaN(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Rating must be a whole number between 1 and 5.'
  }
  if (!form.comment.trim()) {
    errors.comment = 'Review text is required.'
  } else if (form.comment.trim().length < 10) {
    errors.comment = 'Review is too short — please add more detail.'
  } else if (form.comment.trim().length > 5000) {
    errors.comment = 'Review must be 5000 characters or fewer.'
  }
  return errors
}

/* ── Reusable create/edit form modal ─────────────────────────────────────── */
function ReviewFormModal({ isOpen, onClose, onSubmit, submitting, initial, title, submitLabel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      // Deferred via queueMicrotask so this effect's setState calls don't
      // run synchronously inside the effect body (avoids cascading renders,
      // same pattern used for the initial reviews fetch on this page).
      queueMicrotask(() => {
        setForm(initial ?? EMPTY_FORM)
        setErrors({})
      })
    }
  }, [isOpen, initial])

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    await onSubmit(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Guest name</label>
            <input
              type="text"
              value={form.guestName}
              onChange={e => setField('guestName', e.target.value)}
              className="input"
              placeholder="e.g. Priya Sharma"
              disabled={submitting}
            />
            {errors.guestName && <p className="mt-1 text-xs text-red-600">{errors.guestName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
            <input
              type="text"
              value={form.property}
              onChange={e => setField('property', e.target.value)}
              className="input"
              placeholder="e.g. Seaside Villa"
              disabled={submitting}
            />
            {errors.property && <p className="mt-1 text-xs text-red-600">{errors.property}</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rating (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={e => setField('rating', e.target.value)}
              className="input"
              disabled={submitting}
            />
            {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sentiment</label>
            <select
              value={form.sentiment}
              onChange={e => setField('sentiment', e.target.value)}
              className="input"
              disabled={submitting}
            >
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Review text</label>
          <textarea
            rows={4}
            value={form.comment}
            onChange={e => setField('comment', e.target.value)}
            className="input resize-y"
            placeholder="What did the guest say?"
            disabled={submitting}
          />
          {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated, optional)</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => setField('tags', e.target.value)}
            className="input"
            placeholder="e.g. clean, quiet, great-view"
            disabled={submitting}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <><Loader size="sm" /> Saving…</> : submitLabel}
          </button>
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary disabled:opacity-50">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ── Delete confirmation modal ────────────────────────────────────────────── */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, submitting, reviewTitle }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete review?" className="max-w-sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
        This will permanently delete{reviewTitle ? <> the review for <strong className="text-gray-800 dark:text-gray-200">{reviewTitle}</strong></> : ' this review'}. This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <><Loader size="sm" /> Deleting…</> : 'Delete'}
        </button>
        <button onClick={onClose} disabled={submitting} className="btn-secondary disabled:opacity-50">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

export default function Reviews() {
  // ── Analyse tab state ──────────────────────────────────────────────────────
  const [input, setInput]         = useState('')
  const [analyseError, setAnalyseError] = useState('')
  const [analyseLoading, setAnalyseLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  // Tracks every in-flight AI stream's AbortController (there can be more
  // than one at once — e.g. regenerating one card while another is still
  // streaming) so navigating away cleanly cancels all of them without one
  // request's cleanup accidentally cancelling an unrelated one.
  const streamControllersRef = useRef(new Set())

  // ── Browse / search state ─────────────────────────────────────────────────
  const [reviews, setReviews]     = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [activeTab, setActiveTab] = useState('analyse') // 'analyse' | 'browse'

  // ── Create / edit / delete modal state ──────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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

  useEffect(() => {
    // Deferred via queueMicrotask so the initial fetch's setState calls don't
    // run synchronously inside the effect body (avoids cascading renders).
    queueMicrotask(() => { fetchReviews() })
  }, [fetchReviews])

  // Abort any in-flight AI stream(s) if the user navigates away.
  useEffect(() => () => {
    streamControllersRef.current.forEach(c => c.abort())
    streamControllersRef.current.clear()
  }, [])

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

  // ── Analyse: send review to the AI backend (streaming, with fallback) ────
  const [analysedResults, setAnalysedResults] = useState([])
  const [analyseServiceError, setAnalyseServiceError] = useState('')
  const [regeneratingId, setRegeneratingId] = useState(null)

  /**
   * Runs AI analysis for a piece of review text. Tries the streaming SSE
   * endpoint first (so the UI can show live progress); if that fails for
   * any reason — older proxy, network hiccup, browser without streaming
   * fetch support — it transparently falls back to the plain JSON
   * endpoint so the feature still works, just without the live preview.
   */
  async function analyzeComment(trimmed, onDelta) {
    const controller = new AbortController()
    streamControllersRef.current.add(controller)
    try {
      return await streamAnalyze({ comment: trimmed }, { onDelta, signal: controller.signal })
    } catch (err) {
      if (err.name === 'AbortError') throw err
      // Fall back to the non-streaming endpoint.
      const res = await AIApi.analyze({ comment: trimmed })
      return res.data
    } finally {
      streamControllersRef.current.delete(controller)
    }
  }

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
    setAnalyseServiceError('')
    setAnalyseLoading(true)
    setIsStreaming(true)
    setStreamingText('')

    try {
      const result = await analyzeComment(trimmed, (delta) => {
        setStreamingText(prev => prev + delta)
      })

      setAnalysedResults(prev => [{ id: Date.now(), comment: trimmed, result }, ...prev])
      addToast({ message: 'Review analysed successfully.', type: 'success' })

      // Persist the review too, so it also shows up in Browse/Dashboard.
      // A rough 1-5 star rating is derived from the AI's 0-100 score. This
      // save is best-effort — if it fails, the analysis result above still
      // stands, since that's what the user actually asked to see.
      const rating = Math.max(1, Math.min(5, Math.round(result.overallScore / 20) || 1))
      try {
        const created = await ReviewsAPI.create({
          guestName: 'Guest (Manual Entry)',
          property: 'Manual Review',
          rating,
          sentiment: result.sentiment,
          comment: trimmed,
          tags: [],
        })
        setReviews(prev => [created.data, ...prev])
      } catch {
        // Non-fatal — analysis result is still shown to the user.
      }
    } catch (err) {
      setAnalyseServiceError(err.message || 'AI analysis failed. Please try again.')
      addToast({ message: err.message || 'AI analysis failed.', type: 'error' })
    } finally {
      setAnalyseLoading(false)
      setIsStreaming(false)
    }
  }

  async function handleRegenerate(id, comment) {
    setRegeneratingId(id)
    try {
      const result = await analyzeComment(comment, () => {})
      setAnalysedResults(prev => prev.map(r => (r.id === id ? { ...r, result } : r)))
      addToast({ message: 'Analysis regenerated.', type: 'success' })
    } catch (err) {
      addToast({ message: err.message || 'Could not regenerate analysis.', type: 'error' })
    } finally {
      setRegeneratingId(null)
    }
  }

  function handleClear() {
    setInput('')
    setAnalysedResults([])
    setAnalyseError('')
    setAnalyseServiceError('')
    setStreamingText('')
  }

  // ── Create a review (manual entry, from the Browse tab) ──────────────────
  async function handleCreate(form) {
    setCreateSubmitting(true)
    // Optimistic insert: show the review immediately with a temporary id.
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      guestName: form.guestName.trim(),
      property: form.property.trim(),
      rating: Number(form.rating),
      sentiment: form.sentiment,
      comment: form.comment.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    setReviews(prev => [optimistic, ...prev])

    try {
      const res = await ReviewsAPI.create({
        guestName: optimistic.guestName,
        property: optimistic.property,
        rating: optimistic.rating,
        sentiment: optimistic.sentiment,
        comment: optimistic.comment,
        tags: optimistic.tags,
      })
      setReviews(prev => prev.map(r => (r.id === tempId ? res.data : r)))
      addToast({ message: 'Review created successfully.', type: 'success' })
      setCreateOpen(false)
    } catch (err) {
      setReviews(prev => prev.filter(r => r.id !== tempId))
      addToast({ message: err.message || 'Could not create review.', type: 'error' })
    } finally {
      setCreateSubmitting(false)
    }
  }

  // ── Update a review ────────────────────────────────────────────────────────
  function openEdit(review) {
    setEditingReview(review)
  }

  async function handleUpdate(form) {
    if (!editingReview) return
    setEditSubmitting(true)
    const id = editingReview.id
    const previous = reviews.find(r => r.id === id)
    const updatedFields = {
      guestName: form.guestName.trim(),
      property: form.property.trim(),
      rating: Number(form.rating),
      sentiment: form.sentiment,
      comment: form.comment.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }

    // Optimistic update.
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, ...updatedFields } : r)))
    if (searchResults) {
      setSearchResults(prev => prev.map(r => (r.id === id ? { ...r, ...updatedFields } : r)))
    }

    try {
      const res = await ReviewsAPI.update(id, updatedFields)
      setReviews(prev => prev.map(r => (r.id === id ? res.data : r)))
      if (searchResults) setSearchResults(prev => prev.map(r => (r.id === id ? res.data : r)))
      addToast({ message: 'Review updated successfully.', type: 'success' })
      setEditingReview(null)
    } catch (err) {
      // Roll back on failure.
      if (previous) {
        setReviews(prev => prev.map(r => (r.id === id ? previous : r)))
        if (searchResults) setSearchResults(prev => prev.map(r => (r.id === id ? previous : r)))
      }
      addToast({ message: err.message || 'Could not update review.', type: 'error' })
    } finally {
      setEditSubmitting(false)
    }
  }

  // ── Delete a review ────────────────────────────────────────────────────────
  function requestDelete(review) {
    setDeleteTarget(review)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteSubmitting(true)

    // Optimistic removal, with rollback on failure.
    const removedFromReviews = reviews.find(r => r.id === id)
    const removedIndex = reviews.findIndex(r => r.id === id)
    setReviews(prev => prev.filter(r => r.id !== id))
    if (searchResults) setSearchResults(prev => prev.filter(r => r.id !== id))

    try {
      await ReviewsAPI.remove(id)
      addToast({ message: 'Review deleted.', type: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      if (removedFromReviews) {
        setReviews(prev => {
          const next = [...prev]
          next.splice(Math.min(removedIndex, next.length), 0, removedFromReviews)
          return next
        })
        if (searchResults) {
          setSearchResults(prev => {
            if (prev.some(r => r.id === id)) return prev
            return [removedFromReviews, ...prev]
          })
        }
      }
      addToast({ message: err.message || 'Could not delete review.', type: 'error' })
    } finally {
      setDeleteSubmitting(false)
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
                disabled={analyseLoading}
                className="input resize-y disabled:opacity-70"
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
                <button onClick={handleClear} disabled={analyseLoading} className="btn-secondary disabled:opacity-50">
                  Clear
                </button>
              </div>
            </div>

            {/* Loading: live stream preview when available, skeleton otherwise */}
            {analyseLoading && (
              <div aria-live="polite">
                {isStreaming && streamingText ? (
                  <AIStreamingPreview text={streamingText} />
                ) : (
                  <AIAnalysisSkeleton />
                )}
              </div>
            )}

            {/* AI service error (e.g. AI not configured, rate-limited, upstream failure) */}
            {!analyseLoading && analyseServiceError && (
              <div className="card p-8 text-center" role="alert">
                <svg className="mx-auto mb-3 text-red-400" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 10v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="16" cy="21" r="1" fill="currentColor"/>
                </svg>
                <p className="text-red-500 font-medium mb-1">Couldn&rsquo;t analyse this review</p>
                <p className="text-sm text-gray-500 mb-4">{analyseServiceError}</p>
                <button onClick={handleAnalyse} className="btn-primary mx-auto">Retry</button>
              </div>
            )}

            {!analyseLoading && !analyseServiceError && analysedResults.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Results
                  <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {analysedResults.length}
                  </span>
                </h2>
                <div className="grid gap-5 lg:grid-cols-2">
                  {analysedResults.map(r => (
                    <AIAnalysisCard
                      key={r.id}
                      result={r.result}
                      reviewText={r.comment}
                      onRegenerate={() => handleRegenerate(r.id, r.comment)}
                      regenerating={regeneratingId === r.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {!analyseLoading && !analyseServiceError && analysedResults.length === 0 && (
              <EmptyState
                variant="inline"
                title="No analysis yet"
                description={<>Paste a review above and click <span className="font-medium text-gray-600 dark:text-gray-300">Analyse Review</span>.</>}
                className="py-16"
              />
            )}
          </>
        )}

        {/* ── Browse Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'browse' && (
          <>
            {/* Search bar + new review */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
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
              <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary whitespace-nowrap">
                + New Review
              </button>
            </div>

            {searchResults !== null && (
              <p className="text-sm text-gray-500 mb-4">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {/* List loader — skeleton grid mirrors the eventual card layout */}
            {listLoading && <SkeletonCardGrid count={6} />}

            {/* List error */}
            {!listLoading && listError && (
              <div className="card p-8 text-center" role="alert">
                <p className="text-red-500 mb-2 font-medium">Failed to load reviews</p>
                <p className="text-sm text-gray-500 mb-4">{listError}</p>
                <button onClick={fetchReviews} className="btn-primary mx-auto">Retry</button>
              </div>
            )}

            {/* Empty state */}
            {!listLoading && !listError && displayedReviews.length === 0 && (
              <EmptyState
                title={searchResults === null ? 'No reviews yet' : 'No matching reviews'}
                description={
                  searchResults === null
                    ? 'Create your first review to see it appear here.'
                    : `Nothing matched "${searchQuery}". Try a different search term.`
                }
                action={
                  searchResults === null ? (
                    <button onClick={() => setCreateOpen(true)} className="btn-primary">+ New Review</button>
                  ) : (
                    <button onClick={clearSearch} className="btn-secondary">Clear search</button>
                  )
                }
                className="py-16"
              />
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
                      rating={r.rating}
                    />
                    {/* Always visible on touch/small screens (no hover there); fades in on hover for pointer devices. */}
                    <div className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity flex gap-1">
                      <span className="text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono">
                        {r.rating}★
                      </span>
                      <button
                        onClick={() => openEdit(r)}
                        disabled={String(r.id).startsWith('temp-')}
                        className="text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit review"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => requestDelete(r)}
                        disabled={String(r.id).startsWith('temp-')}
                        className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Create modal */}
      <ReviewFormModal
        isOpen={createOpen}
        onClose={() => !createSubmitting && setCreateOpen(false)}
        onSubmit={handleCreate}
        submitting={createSubmitting}
        initial={EMPTY_FORM}
        title="New review"
        submitLabel="Create review"
      />

      {/* Edit modal */}
      <ReviewFormModal
        isOpen={!!editingReview}
        onClose={() => !editSubmitting && setEditingReview(null)}
        onSubmit={handleUpdate}
        submitting={editSubmitting}
        initial={editingReview ? {
          guestName: editingReview.guestName || '',
          property: editingReview.property || '',
          rating: editingReview.rating || 5,
          sentiment: editingReview.sentiment || 'neutral',
          comment: editingReview.comment || '',
          tags: Array.isArray(editingReview.tags) ? editingReview.tags.join(', ') : '',
        } : EMPTY_FORM}
        title="Edit review"
        submitLabel="Save changes"
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleteSubmitting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        submitting={deleteSubmitting}
        reviewTitle={deleteTarget?.property}
      />
    </div>
  )
}
