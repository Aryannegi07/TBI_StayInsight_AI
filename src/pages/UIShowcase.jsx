/**
 * UIShowcase
 * Evaluation page demonstrating the Week 3 component library:
 * Button variants & sizes, Input examples, Modal demo, Toast demo, Loader demo.
 * Route: /ui-showcase
 */
import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Button, Input, Modal, Loader, useToast } from '../components/ui'

/* ─── section wrapper ─── */
function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
        {title}
      </h2>
      <div className="card dark:bg-gray-900 dark:border-gray-700 p-6">
        {children}
      </div>
    </section>
  )
}

/* ─── main ─── */
export default function UIShowcase() {
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [password, setPassword] = useState('')
  const { addToast } = useToast()

  const validateEmail = (val) => {
    if (!val) return setEmailError('Email is required')
    if (!val.includes('@')) return setEmailError('Enter a valid email address')
    setEmailError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            UI Component Showcase
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Week 3 component library — for evaluation purposes.
          </p>
        </div>

        {/* ── BUTTONS ── */}
        <Section title="Button — variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Button — sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        {/* ── INPUTS ── */}
        <Section title="Input — examples">
          <div className="space-y-4 max-w-sm">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); validateEmail(e.target.value) }}
              error={emailError}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <Input
              label="Search"
              placeholder="Search reviews…"
            />

            <Input
              label="Error state"
              placeholder="Enter something"
              error="This field is required"
            />
          </div>
        </Section>

        {/* ── MODAL ── */}
        <Section title="Modal">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm Action"
          >
            <p className="mb-5">
              Are you sure you want to proceed? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setModalOpen(false)
                  addToast({ message: 'Action confirmed!', type: 'success' })
                }}
              >
                Confirm
              </Button>
            </div>
          </Modal>
        </Section>

        {/* ── TOASTS ── */}
        <Section title="Toast notifications">
          <div className="flex flex-wrap gap-3">
            {[
              { type: 'success', message: 'Review saved successfully!' },
              { type: 'error',   message: 'Something went wrong.' },
              { type: 'warning', message: 'Your session will expire soon.' },
              { type: 'info',    message: 'New reviews are available.' },
            ].map(({ type, message }) => (
              <Button
                key={type}
                variant={type === 'error' ? 'outline' : 'secondary'}
                onClick={() => addToast({ message, type })}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </Section>

        {/* ── LOADER ── */}
        <Section title="Loader — sizes">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Loader size="sm" />
              <span className="text-xs text-gray-500 dark:text-gray-400">sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Loader size="md" />
              <span className="text-xs text-gray-500 dark:text-gray-400">md</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Loader size="lg" />
              <span className="text-xs text-gray-500 dark:text-gray-400">lg</span>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
