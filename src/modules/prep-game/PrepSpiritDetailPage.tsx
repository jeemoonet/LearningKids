import type { PrepLevel } from './types'
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
      <div className="prep-spirit-detail-heading">
        <button type="button" className="prep-spirit-detail-back-link" onClick={onBack}>
          ← 精灵起源
        </button>
        <h1>{title}</h1>
        <p className="prep-spirit-detail-intro">{intro}</p>
      </div>

      <PrepSpiritSeriesLayout level={level} onStart={onStartTest} starting={starting} />
    </div>
  )
}
