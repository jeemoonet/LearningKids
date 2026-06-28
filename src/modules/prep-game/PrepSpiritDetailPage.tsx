import type { PrepLevel } from './types'
import { CampLevelDetailHeading } from '../learning/components/CampLevelDetailHeading'
import { formatPrepLevelHeading } from './prepSpiritCatalog'
import { PrepSpiritSeriesLayout } from './PrepSpiritSeriesLayout'

interface PrepSpiritDetailPageProps {
  level: PrepLevel
  starting?: boolean
  onBack: () => void
  onStartTest: () => void
}

export function PrepSpiritDetailPage({
  level,
  starting = false,
  onBack,
  onStartTest,
}: PrepSpiritDetailPageProps) {
  const { title, intro } = formatPrepLevelHeading(level)

  return (
    <div className="prep-spirit-detail-page">
      <CampLevelDetailHeading
        backLabel="精灵起源"
        onBack={onBack}
        title={title}
        summary={intro}
        ruleSummary={level.ruleSummary}
      />

      <PrepSpiritSeriesLayout level={level} onStart={onStartTest} starting={starting} />
    </div>
  )
}
