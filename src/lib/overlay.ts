import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

/**
 * Quick views live in the URL (?p=<product> / ?e=<event>) on whatever page is
 * open, so closing one leaves you exactly where you were, the back button
 * closes it, and a link with the parameter opens it straight away.
 */
export function useOverlay() {
  const navigate = useNavigate()
  const openProduct = useCallback(
    (id: string) => navigate({ to: '.', search: (s) => ({ ...s, p: id, e: undefined }), resetScroll: false }),
    [navigate],
  )
  const openEvent = useCallback(
    (id: string) => navigate({ to: '.', search: (s) => ({ ...s, e: id, p: undefined }), resetScroll: false }),
    [navigate],
  )
  const close = useCallback(
    () => navigate({ to: '.', search: (s) => ({ ...s, p: undefined, e: undefined }), resetScroll: false, replace: true }),
    [navigate],
  )
  return { openProduct, openEvent, close }
}
