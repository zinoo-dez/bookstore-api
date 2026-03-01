import { useEffect, useRef } from 'react'

type UseAutoRefreshOptions = {
  enabled?: boolean
  interval?: number // in milliseconds
  onRefresh: () => void
}

export const useAutoRefresh = ({ 
  enabled = true, 
  interval = 60000, // 60 seconds default
  onRefresh 
}: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      onRefresh()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, onRefresh])
}
