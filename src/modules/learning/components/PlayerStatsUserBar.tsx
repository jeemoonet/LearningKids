import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPlanetSession } from '../../conquer-planet/api'
import type { PlanetSession } from '../../conquer-planet/types'
import { ArmyInspectModal } from '../../conquer-planet/components/ArmyInspectModal'
import { learningApi, type LearningProfile } from '../api'
import { PLAYER_STATS_DIRTY } from '../playerStatsEvents'
import { raceBreakdownFromSession, useUserBarExtrasStore } from '../userBarExtrasStore'
import { AppUserBar, type PlayerBarMetrics, type RaceBreakdownItem } from './AppUserBar'

interface PlayerStatsUserBarProps {
  userDisplayName?: string
  profile: LearningProfile | null
  onLogout: () => void
}

export function PlayerStatsUserBar({
  userDisplayName,
  profile,
  onLogout,
}: PlayerStatsUserBarProps) {
  const [metrics, setMetrics] = useState<PlayerBarMetrics | null>(null)
  const [session, setSession] = useState<PlanetSession | null>(null)
  const [inspectOpen, setInspectOpen] = useState(false)
  const storeSession = useUserBarExtrasStore((s) => s.planetSession)

  const loadAll = useCallback(() => {
    learningApi
      .playerStats()
      .then((stats) =>
        setMetrics({
          armySize: stats.armySize,
          combatPower: stats.combatPower,
          magicPower: stats.magicPower,
          totalPower: stats.legionBattlePower,
          level: stats.level,
          levelTitle: stats.levelTitle,
          levelProgress: stats.levelProgress,
        }),
      )
      .catch(() => setMetrics(null))

    fetchPlanetSession()
      .then(({ session: nextSession }) => setSession(nextSession))
      .catch(() => setSession(null))
  }, [])

  useEffect(() => {
    loadAll()
    const onDirty = () => loadAll()
    window.addEventListener(PLAYER_STATS_DIRTY, onDirty)
    return () => window.removeEventListener(PLAYER_STATS_DIRTY, onDirty)
  }, [loadAll])

  const effectiveSession = storeSession ?? session

  const raceBreakdown = useMemo((): RaceBreakdownItem[] => {
    if (!effectiveSession) return []
    return raceBreakdownFromSession(effectiveSession)
  }, [effectiveSession])

  const conquestProgress = useMemo(() => {
    const label = profile?.currentLibraryName ?? '未选择'
    if (!effectiveSession?.kingdoms.length) {
      return { label, done: 0, total: 0, percent: 0 }
    }
    const done = effectiveSession.kingdoms.reduce((sum, k) => sum + k.levelsDone, 0)
    const total = effectiveSession.kingdoms.reduce((sum, k) => sum + k.levelsTotal, 0)
    const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
    return { label, done, total, percent }
  }, [profile?.currentLibraryName, effectiveSession])

  return (
    <>
      <AppUserBar
        userDisplayName={userDisplayName}
        profile={profile}
        onLogout={onLogout}
        playerMetrics={metrics}
        raceBreakdown={raceBreakdown}
        onInspectArmy={effectiveSession ? () => setInspectOpen(true) : undefined}
        conquestProgress={conquestProgress}
      />
      {inspectOpen && effectiveSession && (
        <ArmyInspectModal
          open
          session={effectiveSession}
          onClose={() => setInspectOpen(false)}
        />
      )}
    </>
  )
}
