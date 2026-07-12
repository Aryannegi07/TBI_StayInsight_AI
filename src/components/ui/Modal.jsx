/**
 * Modal
 *
 * @param {boolean} isOpen - Controls visibility.
 * @param {Function} onClose - Called when the modal should close (backdrop click / Escape key / X button).
 * @param {string} [title] - Modal heading text.
 * @param {React.ReactNode} children - Modal body content.
 * @param {string} [className] - Extra classes for the modal panel.
 */
import { useEffect, useRef } from 'react'

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  const dialogRef = useRef(null)

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* Trap focus inside the modal */
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`
          relative z-10 w-full max-w-md
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700
          rounded-2xl shadow-xl
          outline-none
          animate-[fadeIn_0.15s_ease]
          ${className}
        `.replace(/\s+/g, ' ').trim()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          {title && (
            <h2
              id="modal-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="ml-auto -mr-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  )
}
