/**
 * Input
 *
 * @param {string} [label] - Label text displayed above the input.
 * @param {string} [placeholder] - Placeholder text.
 * @param {string} [type='text'] - HTML input type (text, email, password, …).
 * @param {string} [value] - Controlled value.
 * @param {Function} [onChange] - Change handler.
 * @param {string} [error] - Error message shown below the input.
 * @param {string} [id] - Input id (auto-generated from label if omitted).
 * @param {string} [className] - Extra wrapper classes.
 */
import React, { useId } from 'react'

export default function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  id,
  className = '',
  ...rest
}) {
  const autoId = useId()
  const inputId = id || autoId

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`
          w-full bg-white dark:bg-gray-800
          border rounded-lg px-3 py-2 text-sm
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-brand-500/20
          transition-colors
          ${error
            ? 'border-red-500 focus:border-red-500 dark:border-red-400'
            : 'border-gray-300 dark:border-gray-600 focus:border-brand-500 dark:focus:border-brand-400'
          }
        `.replace(/\s+/g, ' ').trim()}
        {...rest}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-red-600 dark:text-red-400 mt-0.5"
        >
          {error}
        </p>
      )}
    </div>
  )
}
