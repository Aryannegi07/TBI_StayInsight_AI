import { useContext } from 'react'
import { ToastContext } from '../components/ui/toastContext'

/**
 * useToast – consume the toast context.
 * @returns {{ addToast: (opts: {message: string, type?: 'success'|'error'|'warning'|'info', duration?: number}) => void }}
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
