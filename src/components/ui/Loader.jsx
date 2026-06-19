/**
 * Loader
 *
 * @param {'sm'|'md'|'lg'} [size='md'] - Spinner size.
 * @param {string} [label='Loading…'] - Accessible label read by screen readers.
 * @param {string} [className] - Extra wrapper classes.
 * @param {boolean} [fullPage=false] - Centers the spinner in the full viewport.
 */
import React from 'react'

const sizeMap = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-7 h-7 border-2',
  lg: 'w-10 h-10 border-[3px]',
}

export default function Loader({
  size = 'md',
  label = 'Loading…',
  className = '',
  fullPage = false,
}) {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      className={`
        inline-block rounded-full
        border-gray-200 dark:border-gray-700
        border-t-brand-600 dark:border-t-brand-400
        animate-spin
        ${sizeMap[size] || sizeMap.md}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    />
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-950/70 backdrop-blur-sm z-50">
        {spinner}
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center justify-center">
      {spinner}
      <span className="sr-only">{label}</span>
    </span>
  )
}
