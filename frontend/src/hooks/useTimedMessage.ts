import { useCallback, useEffect, useRef, useState } from 'react'

export const useTimedMessage = (durationMs = 3000) => {
  const [message, setMessage] = useState('')
  const timeoutRef = useRef<number | null>(null)

  const clearMessage = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setMessage('')
  }, [])

  const showMessage = useCallback(
    (text: string) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      setMessage(text)
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        setMessage('')
      }, durationMs)
    },
    [durationMs],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { message, showMessage, clearMessage }
}
