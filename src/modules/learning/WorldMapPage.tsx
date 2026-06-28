import type { LearningProfile } from './api'
import { MyWorldDashboard } from './MyWorldDashboard'
import { MyWorldTopActions } from './components/MyWorldTopActions'

interface WorldMapPageProps {
  profile: LearningProfile | null
  onRefresh: () => Promise<void>
  onEnterKingdom: (kingdomId: string) => void
  onOpenCollection: () => void
}

export function WorldMapPage({
  profile,
  onRefresh,
  onEnterKingdom,
  onOpenCollection,
}: WorldMapPageProps) {
  return (
    <div className="lw-world-map">
      <MyWorldTopActions profile={profile} onRefresh={onRefresh} />
      <div className="lw-world-map-stage">
        <MyWorldDashboard
          profile={profile}
          onEnterKingdom={onEnterKingdom}
          onOpenCollection={onOpenCollection}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}
