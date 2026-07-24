import { createContext } from 'react'

/**
 * Toast context object. Consumed by `ToastProvider` (./Toast.jsx) and
 * `useToast` (../../hooks/useToast.js).
 */
export const ToastContext = createContext(null)
