import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { AuthAPI } from '../api/api'

function UserAvatar({ user, size = 64 }) {
  const initials = (user?.name || '?').trim().charAt(0).toUpperCase()
  const [imgFailed, setImgFailed] = useState(false)

  if (user?.picture && !imgFailed) {
    return (
      <img
        src={user.picture}
        alt={user?.name ? `${user.name}'s profile picture` : 'Profile picture'}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
      />
    )
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-semibold flex-shrink-0"
    >
      {initials}
    </span>
  )
}

/**
 * Profile
 * Lets the logged-in user view their account details and update their
 * display name and password. Password fields are hidden entirely for
 * Google-only accounts that haven't set one yet, and a "set a password"
 * flow (no current-password check) is offered instead, matching what the
 * backend allows (see authController.updateMe).
 */
export default function Profile() {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const hasPassword = !!user?.hasPassword
  const nameChanged = name.trim() !== (user?.name || '')
  const wantsPasswordChange = showPasswordFields && (newPassword || confirmPassword || currentPassword)

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Name is required.'

    if (wantsPasswordChange) {
      if (hasPassword && !currentPassword) {
        e.currentPassword = 'Enter your current password.'
      }
      if (!newPassword) {
        e.newPassword = hasPassword ? 'Enter a new password.' : 'Choose a password.'
      } else if (newPassword.length < 6) {
        e.newPassword = 'Password must be at least 6 characters long.'
      }
      if (newPassword && confirmPassword !== newPassword) {
        e.confirmPassword = 'Passwords do not match.'
      }
    }

    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      addToast({ message: 'Please fix the validation errors.', type: 'warning' })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const body = { name: name.trim() }
      if (wantsPasswordChange) {
        body.newPassword = newPassword
        if (hasPassword) body.currentPassword = currentPassword
      }
      const res = await AuthAPI.updateMe(body)
      updateUser(res.data.user)
      addToast({ message: 'Profile updated successfully.', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordFields(false)
    } catch (err) {
      const msg = err.status === 401
        ? 'Current password is incorrect.'
        : err.message || 'Could not update profile. Please try again.'
      addToast({ message: msg, type: 'error' })
      setErrors({ api: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account details and password.
          </p>
        </div>

        {/* Account summary */}
        <div className="card p-6 mb-6 flex items-center gap-4">
          <UserAvatar user={user} size={64} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            <span className="mt-1.5 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">
              {user?.role || 'viewer'}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })) }}
              className="input"
              disabled={saving}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <input type="email" value={user?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Email cannot be changed.</p>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            {!showPasswordFields ? (
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {hasPassword ? 'Change password' : 'Set a password'}
              </button>
            ) : (
              <div className="space-y-4 pt-2">
                {hasPassword && (
                  <div>
                    <label htmlFor="current-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={e => { setCurrentPassword(e.target.value); setErrors(prev => ({ ...prev, currentPassword: undefined })) }}
                      className="input"
                      autoComplete="current-password"
                      disabled={saving}
                    />
                    {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>}
                  </div>
                )}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {hasPassword ? 'New password' : 'Password'}
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: undefined })) }}
                    className="input"
                    autoComplete="new-password"
                    disabled={saving}
                  />
                  {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm {hasPassword ? 'new ' : ''}password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })) }}
                    className="input"
                    autoComplete="new-password"
                    disabled={saving}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordFields(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setErrors(prev => ({ ...prev, currentPassword: undefined, newPassword: undefined, confirmPassword: undefined }))
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  disabled={saving}
                >
                  Cancel password change
                </button>
              </div>
            )}
          </div>

          {errors.api && <p className="text-xs text-red-600" role="alert">{errors.api}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || (!nameChanged && !wantsPasswordChange)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <><Loader size="sm" /> Saving…</> : 'Save changes'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
