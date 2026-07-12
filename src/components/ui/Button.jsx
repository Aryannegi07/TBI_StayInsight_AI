/**
 * Button
 *
 * @param {'primary'|'secondary'|'outline'} [variant='primary'] - Visual style.
 * @param {'sm'|'md'|'lg'} [size='md'] - Size preset.
 * @param {boolean} [disabled=false] - Disables interaction and dims the button.
 * @param {Function} [onClick] - Click handler.
 * @param {React.ReactNode} children - Button label / content.
 * @param {string} [className] - Additional classes.
 */


const variantClasses = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 border border-transparent dark:bg-brand-500 dark:hover:bg-brand-600',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
  outline:
    'bg-transparent text-brand-600 hover:bg-brand-50 border border-brand-600 dark:text-brand-400 dark:border-brand-400 dark:hover:bg-brand-950',
}

const sizeClasses = {
  sm:  'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md:  'px-4 py-2 text-sm rounded-lg gap-2',
  lg:  'px-5 py-2.5 text-base rounded-xl gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium transition-all active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
