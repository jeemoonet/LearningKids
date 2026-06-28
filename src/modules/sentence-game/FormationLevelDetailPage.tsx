import { CampLevelDetailHeading } from '../learning/components/CampLevelDetailHeading'
import type { SentenceLevel } from './types'
import { CampLevelSeriesLayout } from './CampLevelSeriesLayout'
import {
  formatFormationLevelHeading,
  getFormationStructureComparison,
  getFormationStructureProfiles,
} from './formationStructureCatalog'

interface FormationLevelDetailPageProps {
  level: SentenceLevel
  starting?: boolean
  onBack: () => void
  onStartTest: () => void
}

export function FormationLevelDetailPage({
  level,
  starting = false,
  onBack,
  onStartTest,
}: FormationLevelDetailPageProps) {
  const heading = formatFormationLevelHeading(level)
  const isBoss = level.track === 'boss'

  return (
    <div className="prep-spirit-detail-page">
      <CampLevelDetailHeading
        backLabel="排兵布阵"
        onBack={onBack}
        title={heading.title}
        summary={heading.summary}
        ruleSummary={heading.ruleSummary}
      />
      <CampLevelSeriesLayout
        level={level}
        profiles={getFormationStructureProfiles(level.id)}
        comparison={getFormationStructureComparison(level.id)}
        cardsTitle="句子成分介绍"
        cardsSub="横滑查看本关句子成分与例句"
        cardTag="🚩 成分"
        compareCol1="成分"
        startLabel={isBoss ? '开始综合闯关' : '开始还原'}
        hint={isBoss ? '混合全部句型考点，全对才算通关' : '将词块拖入正确位置，全对才算通关'}
        onStart={onStartTest}
        starting={starting}
      />
    </div>
  )
}
