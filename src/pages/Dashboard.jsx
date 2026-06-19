import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

const STATS = [
  { label: 'Total Reviews',    value: '1,284', change: '+12% this month',  up: true  },
  { label: 'Positive Reviews', value: '964',   change: '+8% this month',   up: true  },
  { label: 'Negative Reviews', value: '183',   change: '−3% this month',   up: false },
  { label: 'Average Rating',   value: '4.6',   change: '+0.2 this month',  up: true  },
]

const CHART_DATA = [
  { month: 'Jan', pos: 72, neg: 18 },
  { month: 'Feb', pos: 68, neg: 22 },
  { month: 'Mar', pos: 80, neg: 14 },
  { month: 'Apr', pos: 75, neg: 17 },
  { month: 'May', pos: 88, neg: 10 },
  { month: 'Jun', pos: 91, neg: 8  },
]

const RECENT = [
  { title: 'Exceptional Stay',       sentiment: 'positive', theme: 'Service',     time: '2 min ago'  },
  { title: 'Noisy but Great Location', sentiment: 'neutral',  theme: 'Location',  time: '18 min ago' },
  { title: 'Not Worth the Price',    sentiment: 'negative', theme: 'Value',        time: '1 hr ago'   },
  { title: 'Wonderful Breakfast',    sentiment: 'positive', theme: 'Food',         time: '3 hrs ago'  },
  { title: 'Clean Room, Slow Service', sentiment: 'neutral', theme: 'Cleanliness', time: '5 hrs ago'  },
]

const SENTIMENT_DOT = {
  positive: 'bg-green-500',
  neutral:  'bg-yellow-500',
  negative: 'bg-red-400',
}

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Real-time insight across all guest reviews.</p>
          </div>
          <Link to="/reviews" className="btn-primary self-start">
            Analyse New Review
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5H11M11 6.5L7.5 3M11 6.5L7.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STATS.map(({ label, value, change, up }) => (
            <div key={label} className="card p-5">
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
              <p className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>{change}</p>
            </div>
          ))}
        </div>

        {/* Chart + recent */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Bar chart */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Sentiment Trend</h2>
                <p className="text-xs text-gray-400 mt-0.5">Positive vs Negative — last 6 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Positive
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Negative
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-36 pb-1">
              {CHART_DATA.map(({ month, pos, neg }) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex gap-0.5 items-end h-28">
                    <div className="flex-1 rounded-t bg-green-500 hover:bg-green-600 transition-colors" style={{ height: `${pos}%` }} />
                    <div className="flex-1 rounded-t bg-red-400 hover:bg-red-500 transition-colors"   style={{ height: `${neg}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Reviews</h2>
            <ul className="space-y-3">
              {RECENT.map(({ title, sentiment, theme, time }, i) => (
                <li key={i} className="flex items-start gap-2.5 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${SENTIMENT_DOT[sentiment]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{theme}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{time}</span>
                </li>
              ))}
            </ul>
            <Link to="/reviews" className="mt-4 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
              View all
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
