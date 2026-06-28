import { CampLevelDetailHeading } from '../learning/components/CampLevelDetailHeading'
import type { SentenceLevel } from './types'
import { CampLevelSeriesLayout } from './CampLevelSeriesLayout'
import {
  formatWarriorLevelHeading,
  getWarriorTenseComparison,
  getWarriorTenseProfiles,
} from './warriorTenseCatalog'

interface WarriorLevelDetailPageProps {
  level: SentenceLevel
  starting?: boolean
  onBack: () => void
  onStartTest: () => void
}

export function WarriorLevelDetailPage({
  level,
  starting = false,
  onBack,
  onStartTest,
}: WarriorLevelDetailPageProps) {
  const heading = formatWarriorLevelHeading(level)

  return (
    <div className="prep-spirit-detail-page">
      <CampLevelDetailHeading
        backLabel="武士的力量"
        onBack={onBack}
        title={heading.title}
        summary={heading.summary}
        ruleSummary={heading.ruleSummary}
      />
      <CampLevelSeriesLayout
        level={level}
        profiles={getWarriorTenseProfiles(level.id)}
        comparison={getWarriorTenseComparison(level.id)}
        cardsTitle="武士介绍"
        cardsSub="横滑查看本关每位时态的能力与例句"
        cardTag="🛡️ 武士"
        cardTagClassName="prep-spirit-card-tag--warrior"
        compareCol1="时态"
        onStart={onStartTest}
        starting={starting}
      />
    </div>
  )
}
