import { Component } from 'react'

/**
 * ErrorBoundary
 *
 * Catches JavaScript errors thrown anywhere in its child component tree
 * during render, in lifecycle methods, and in constructors, and renders a
 * friendly fallback instead of letting the whole app crash to a white
 * screen. Does NOT catch errors in event handlers, async code, or SSR —
 * those still need their own try/catch (see the try/catch blocks already
 * used around API calls throughout the app).
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * Optionally wrap individual sections so one broken widget doesn't take
 * down the rest of the page:
 *   <ErrorBoundary fallbackTitle="Couldn't load the chart">
 *     <RatingTrend reviews={reviews} />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Centralised logging point — swap for a real error-reporting service
    // (Sentry, LogRocket, etc.) when one is wired up. Kept as console.error
    // so failures are still visible in dev and in browser devtools.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) this.props.onReset()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback
      }

      const isFullPage = !!this.props.fullPage

      return (
        <div
          role="alert"
          className={
            isFullPage
              ? 'min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4'
              : 'card p-8 text-center'
          }
        >
          <div className="max-w-sm mx-auto text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" className="text-red-500">
                <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 6.5v5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="11" cy="15.2" r="1" fill="currentColor" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold mb-1">
              {this.props.fallbackTitle || 'Something went wrong'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {this.props.fallbackMessage ||
                "This part of the page hit an unexpected error. You can try again, or reload the page if the problem continues."}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={this.handleReset} className="btn-primary">
                Try again
              </button>
              <button onClick={() => window.location.reload()} className="btn-secondary">
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
