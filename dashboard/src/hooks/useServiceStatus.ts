import { useState, useEffect, useRef } from 'react'

const POLL_INTERVAL_MS = 30_000
import type { ServiceStatus } from '../types'
import { TOOLS } from '../data/tools'

const LOCAL_TOOLS = TOOLS.filter((t) => t.isLocal && t.port)

export function useServiceStatus() {
  const [statuses, setStatuses] = useState<ServiceStatus[]>(() =>
    LOCAL_TOOLS.map((t) => ({
      id: t.id,
      name: t.name,
      url: t.url,
      port: t.port,
      status: 'checking' as const,
    })),
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkStatuses = async () => {
    try {
      const res = await fetch('/api/status', { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data: { id: string; status: 'online' | 'offline'; latency?: number }[] =
          await res.json()
        setStatuses((prev) =>
          prev.map((s) => {
            const found = data.find((d) => d.id === s.id)
            return found
              ? { ...s, status: found.status, latency: found.latency, lastChecked: new Date() }
              : { ...s, status: 'offline' as const, lastChecked: new Date() }
          }),
        )
        return
      }
    } catch {
      // backend not available — mark all offline
    }
    setStatuses((prev) =>
      prev.map((s) => ({ ...s, status: 'offline' as const, lastChecked: new Date() })),
    )
  }

  useEffect(() => {
    checkStatuses()
    intervalRef.current = setInterval(checkStatuses, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { statuses, refetch: checkStatuses }
}
