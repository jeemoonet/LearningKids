import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchPlanetConfig, fetchPlanetSession } from './api'
import { setPlanetMapConfig, type PlanetMapConfig } from './planetMapConfig'
import { emitPlayerStatsDirty } from '../learning/playerStatsEvents'
import type { PlanetSession } from './types'

interface ConquerContextValue {
  session: PlanetSession | null
  mapConfig: PlanetMapConfig | null
  loading: boolean
  error: string
  refresh: () => Promise<void>
  setSession: (session: PlanetSession) => void
}

const ConquerContext = createContext<ConquerContextValue | null>(null)

export function ConquerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlanetSession | null>(null)
  const [mapConfig, setMapConfig] = useState<PlanetMapConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [{ session: s }, config] = await Promise.all([
        fetchPlanetSession(),
        fetchPlanetConfig(),
      ])
      setSession(s)
      setMapConfig(config)
      setPlanetMapConfig(config)
      emitPlayerStatsDirty()
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  return (
    <ConquerContext.Provider value={{ session, mapConfig, loading, error, refresh, setSession: (s) => { setSession(s); emitPlayerStatsDirty() } }}>
      {children}
    </ConquerContext.Provider>
  )
}

export function useConquer() {
  const ctx = useContext(ConquerContext)
  if (!ctx) throw new Error('useConquer must be used within ConquerProvider')
  return ctx
}
