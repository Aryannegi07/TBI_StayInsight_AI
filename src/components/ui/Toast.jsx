/**
 * Toast / useToast
 *
 * Self-contained toast system — no external dependencies.
 *
 * Usage:
 *   1. Wrap your app (or page) with <ToastProvider>.
 *   2. Call const { addToast } = useToast() inside any child.
 *   3. addToast({ message, type }) — type: 'success' | 'error' | 'info' | 'warning'
 *
 * Alternatively import the standalone <ToastContainer> and manage state manually.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

/* ── icons ── */
const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3L14 13H2L8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 7V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="5" r="0.5" fill="currentColor"/>
    </svg>
  ),
}

const typeClasses = {
  success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  error:   'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  info:    'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700',
}

/* ── single toast item ── */
function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const type = toast.type || 'info'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-md
        text-sm font-medium min-w-[260px] max-w-sm
        animate-[slideIn_0.2s_ease]
        ${typeClasses[type] || typeClasses.info}
      `.replace(/\s+/g, ' ').trim()}
    >
      <span className="mt-px flex-shrink-0">{icons[type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

/* ── context ── */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/**
 * useToast – consume the toast context.
 * @returns {{ addToast: (opts: {message: string, type?: 'success'|'error'|'warning'|'info', duration?: number}) => void }}
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

/* ── standalone container (also used by ToastProvider) ── */
export function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts.length) return null
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

/* default export for convenience */
export default ToastProvider
