import { memo } from 'react'

/**
 * SentimentBadge
 * Small pill showing a sentiment (positive / neutral / negative) with an
 * icon, label and consistent colour coding used across the app.
 *
 * @param {'positive'|'neutral'|'negative'} sentiment
 * @param {'sm'|'md'} [size='md']
 */

const CONFIG = {
  positive: {
    label: 'Positive',
    classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.3 8.7s.9 1.6 2.7 1.6 2.7-1.6 2.7-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="5.9" cy="6.1" r="0.85" fill="currentColor" />
        <circle cx="10.1" cy="6.1" r="0.85" fill="currentColor" />
      </svg>
    ),
  },
  neutral: {
    label: 'Neutral',
    classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.3 9.5h5.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="5.9" cy="6.1" r="0.85" fill="currentColor" />
        <circle cx="10.1" cy="6.1" r="0.85" fill="currentColor" />
      </svg>
    ),
  },
  negative: {
    label: 'Negative',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.3 10.3s.9-1.6 2.7-1.6 2.7 1.6 2.7 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="5.9" cy="6.1" r="0.85" fill="currentColor" />
        <circle cx="10.1" cy="6.1" r="0.85" fill="currentColor" />
      </svg>
    ),
  },
}

function SentimentBadge({ sentiment = 'neutral', size = 'md', className = '' }) {
  const cfg = CONFIG[sentiment] ?? CONFIG.neutral
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${cfg.classes} ${className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

export default memo(SentimentBadge)
