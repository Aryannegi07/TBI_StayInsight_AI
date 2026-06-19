import { Link } from "react-router-dom";

const STATS = [
  { value: "98%", label: "Sentiment accuracy" },
  { value: "12ms", label: "Average parse time" },
  { value: "50+", label: "Theme categories" },
];

export default function Hero() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-20 sm:py-28">
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            2026 StayInsight AI. All rights reserved
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            {" "}
            Understand every guest review, instantly
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-300">
            {" "}
            StayInsight turns raw hotel feedback into structured insights —
            surfacing what guests love, what they flag, and what to fix next.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
              Open Dashboard
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7H12M12 7L8 3M12 7L8 11"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link to="/reviews" className="btn-secondary px-5 py-2.5 text-sm">
              Analyse a review
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-12 pt-8 border-t border-gray-200">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
