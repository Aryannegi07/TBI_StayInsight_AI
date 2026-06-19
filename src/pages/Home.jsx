import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ReviewCard from '../components/ReviewCard'
import Footer from '../components/Footer'

const sampleReviews = [
  {
    title: 'Exceptional Stay — Would Return',
    review: 'The room was spotless and the staff went above and beyond. Breakfast was outstanding, especially the freshly baked bread. Check-in was seamless and the location is perfect for exploring the city.',
    sentiment: 'positive',
    theme: 'Cleanliness & Service',
  },
  {
    title: 'Good Location, Noisy Nights',
    review: 'Location is unbeatable — walking distance to everything. However, the room facing the street was quite noisy after midnight. Might be worth requesting a courtyard-facing room next time.',
    sentiment: 'neutral',
    theme: 'Location & Noise',
  },
  {
    title: 'Disappointing for the Price',
    review: "At this price point I expected more. The bathroom had visible grout stains, the AC rattled constantly, and room service took over an hour. The concierge was helpful but couldn't compensate for the rest.",
    sentiment: 'negative',
    theme: 'Value & Maintenance',
  },
]

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3L12.5 8.5H18L13.5 12L15.5 17.5L10 14L4.5 17.5L6.5 12L2 8.5H7.5L10 3Z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Sentiment Analysis',
    description: 'Detect positive, neutral, and negative tone in every guest review with high accuracy — automatically, at scale.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14M3 9h9M3 13h11M3 17h7" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Theme Detection',
    description: 'Cluster feedback into categories — cleanliness, service, food, location — so you can spot patterns across hundreds of reviews.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M17 10C17 13.866 13.866 17 10 17C8.6 17 7.3 16.6 6.2 15.9L3 17L4.1 13.8C3.4 12.7 3 11.4 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="7" cy="10" r="1" fill="#2563eb"/>
        <circle cx="10" cy="10" r="1" fill="#2563eb"/>
        <circle cx="13" cy="10" r="1" fill="#2563eb"/>
      </svg>
    ),
    title: 'Smart Responses',
    description: 'Generate on-brand reply drafts for each review in seconds — ready to post with minor edits or approved as-is.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* Sample Reviews */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Reviews, parsed and understood</h2>
            <p className="mt-1 text-sm text-gray-500">
              StayInsight extracts sentiment and themes from every guest review automatically.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sampleReviews.map((r, i) => (
              <ReviewCard key={i} {...r} />
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">Everything you need to understand guests</h2>
              <p className="mt-1 text-sm text-gray-500 max-w-lg">
                Three core capabilities that turn raw feedback into actionable hospitality intelligence.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {FEATURES.map(({ icon, title, description }) => (
                <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                    {icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
