import { CampLevelDetailHeading } from '../learning/components/CampLevelDetailHeading'
import type { SentenceLevel } from './types'
import { CampLevelSeriesLayout } from './CampLevelSeriesLayout'
import {
  formatMagicLevelHeading,
  getMagicScholarComparison,
  getMagicScholarProfiles,
} from './magicScholarCatalog'

interface MagicLevelDetailPageProps {
  level: SentenceLevel
  starting?: boolean
  onBack: () => void
  onStartTest: () => void
}

export function MagicLevelDetailPage({
  level,
  starting = false,
  onBack,
  onStartTest,
}: MagicLevelDetailPageProps) {
  const heading = formatMagicLevelHeading(level)

  return (
    <div className="prep-spirit-detail-page">
      <CampLevelDetailHeading
        backLabel="魔法世界"
        onBack={onBack}
        title={heading.title}
        summary={heading.summary}
        ruleSummary={heading.ruleSummary}
      />
      <CampLevelSeriesLayout
        level={level}
        profiles={getMagicScholarProfiles(level.id)}
        comparison={getMagicScholarComparison(level.id)}
        cardsTitle="学者 & 魔法师介绍"
        cardsSub="横滑查看本关核心身份与例句"
        cardTag="🪄 魔法"
        cardTagClassName="prep-spirit-card-tag--warrior"
        compareCol1="身份"
        startLabel="开始测试"
        onStart={onStartTest}
        starting={starting}
      />
    </div>
  )
}
