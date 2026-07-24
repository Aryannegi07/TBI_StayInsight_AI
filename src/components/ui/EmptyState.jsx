/**
 * EmptyState
 *
 * Consistent "nothing here yet" panel used across lists, tables, and
 * dashboard widgets so every empty state in the app looks and behaves the
 * same way instead of each page rolling its own ad-hoc message.
 *
 * @param {React.ReactNode} [icon] - defaults to a generic inbox icon
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} [action] - e.g. a button to create the first item
 * @param {'panel'|'inline'} [variant='panel'] - 'panel' renders the .card wrapper, 'inline' doesn't (for embedding inside an existing card)
 */
function DefaultIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 14h16M10 19h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  description,
  action,
  variant = 'panel',
  className = '',
}) {
  const content = (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto mb-3 w-9 h-9 text-gray-300 dark:text-gray-600 flex items-center justify-center" aria-hidden="true">
        {icon || <DefaultIcon />}
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="mt-5 flex items-center justify-center">{action}</div>}
    </div>
  )

  if (variant === 'inline') return content
  return <div className="card">{content}</div>
}
