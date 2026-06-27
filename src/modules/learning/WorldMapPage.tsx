import type { LearningProfile } from './api'
import { MyWorldDashboard } from './MyWorldDashboard'

interface WorldMapPageProps {
  profile: LearningProfile | null
  onRefresh: () => Promise<void>
  onEnterKingdom: (kingdomId: string) => void
  onOpenCollection: () => void
  onLogout: () => void
}

export function WorldMapPage({
  profile,
  onRefresh,
  onEnterKingdom,
  onOpenCollection,
  onLogout,
}: WorldMapPageProps) {
  return (
    <div className="lw-world-map">
      <div className="lw-world-map-stage">
        <MyWorldDashboard
          profile={profile}
          onEnterKingdom={onEnterKingdom}
          onOpenCollection={onOpenCollection}
          onRefresh={onRefresh}
          onLogout={onLogout}
        />
      </div>
    </div>
  )
}
