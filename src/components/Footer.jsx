import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 10.5L7 3.5L12 10.5H2Z"
                fill="white"
                fillOpacity="0.9"
              />
              <path d="M5 10.5L7 7L9 10.5H5Z" fill="white" fillOpacity="0.45" />
            </svg>
          </span>

          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            StayInsight
          </span>
        </Link>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
          Guest review analysis for modern hospitality teams.
        </p>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {year} StayInsight. All rights reserved.
          </p>

          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
