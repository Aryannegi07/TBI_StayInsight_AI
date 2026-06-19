import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const NAV_LINKS = [
  { label: 'Home',      to: '/' },
  { label: 'Reviews',   to: '/reviews' },
  { label: 'Dashboard', to: '/dashboard' },
]

/* Sun / Moon icons */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.06 1.06M11.84 11.84l1.06 1.06M3.1 12.9l1.06-1.06M11.84 4.16l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 100 11 6 6 0 007-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10.5L7 3.5L12 10.5H2Z" fill="white" fillOpacity="0.9"/>
                <path d="M5 10.5L7 7L9 10.5H5Z" fill="white" fillOpacity="0.45"/>
              </svg>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-tight">
              StayInsight
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* CTA + theme toggle + mobile toggle */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <Link
              to="/login"
              className="hidden md:inline-flex btn-primary text-xs px-3 py-1.5"
            >
              Sign in
            </Link>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-4 h-[1.5px] bg-gray-700 dark:bg-gray-300 transition-all duration-200 ${open ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block w-4 h-[1.5px] bg-gray-700 dark:bg-gray-300 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block w-4 h-[1.5px] bg-gray-700 dark:bg-gray-300 transition-all duration-200 ${open ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-200 ${open ? 'max-h-64' : 'max-h-0'}`}>
        <div className="px-4 py-3 space-y-1 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="block mt-2 px-3 py-2 text-sm font-medium text-white bg-brand-600 dark:bg-brand-500 rounded-lg text-center hover:bg-brand-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}
