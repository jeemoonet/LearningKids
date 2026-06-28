import { CampLevelDetailHeading } from '../learning/components/CampLevelDetailHeading'
import { WARRIOR_MATCH_META } from './data/warriorMagicianMatch'
import { WARRIOR_GAME_FAMILIES } from './warriorGameCatalog'
import { CampLevelSeriesLayout } from './CampLevelSeriesLayout'
import type { SentenceLevel } from './types'
import type { WarriorTenseComparison, WarriorTenseProfile } from './warriorTenseCatalog'

const MATCH_PROFILES: WarriorTenseProfile[] = [
  {
    word: '动词 + 魔法师',
    ability: '为动词挑选合适的副词修饰',
    exampleEn: 'She runs quickly.',
    exampleZh: '她跑得很快。',
  },
  {
    word: '学者 + 名词',
    ability: '右侧备选词中的学者修饰名词',
    exampleEn: 'a beautiful day',
    exampleZh: '美好的一天',
  },
  {
    word: '连线规则',
    ability: '先点左侧动词，再点右侧词语',
    exampleEn: 'read + quietly',
    exampleZh: '安静地读',
  },
]

const MATCH_COMPARISON: WarriorTenseComparison = {
  title: '动词连线 vs 干扰项 怎么选？',
  rows: [
    { spirits: ['魔法师'], focus: '修饰动词，与动词搭配', example: 'run quickly · speak loudly' },
    { spirits: ['学者'], focus: '修饰名词，作干扰项', example: 'happy · beautiful' },
  ],
  tip: '每个动词只有一个正确魔法师；双击已连线动词可取消。',
}

interface MatchLevelDetailPageProps {
  starting?: boolean
  onBack: () => void
  onStart: () => void
  onRetryWords?: () => void
}

export function MatchLevelDetailPage({
  starting = false,
  onBack,
  onStart,
  onRetryWords,
}: MatchLevelDetailPageProps) {
  const sceneLabel = WARRIOR_MATCH_META.scene.replace(/\s*·\s*/g, '/')
  const title = `${WARRIOR_MATCH_META.title}>${sceneLabel}（连线）`
  const summary = WARRIOR_GAME_FAMILIES.match.intro
  const pseudoLevel: SentenceLevel = {
    id: WARRIOR_MATCH_META.id,
    track: 'tense',
    title: WARRIOR_MATCH_META.title,
    scene: WARRIOR_MATCH_META.scene,
    ruleSummary: WARRIOR_MATCH_META.ruleSummary,
    questionCount: WARRIOR_MATCH_META.questionCount,
    focusRoles: [],
  }

  return (
    <div className="prep-spirit-detail-page">
      <CampLevelDetailHeading
        backLabel="武士的力量"
        onBack={onBack}
        title={title}
        summary={summary}
        ruleSummary={WARRIOR_MATCH_META.ruleSummary}
      />
      <CampLevelSeriesLayout
        level={pseudoLevel}
        profiles={MATCH_PROFILES}
        comparison={MATCH_COMPARISON}
        cardsTitle="玩法介绍"
        cardsSub="横滑查看连线规则与示例"
        cardTag="⚔ 连线"
        cardTagClassName="prep-spirit-card-tag--warrior"
        compareCol1="类型"
        startLabel="开始连线"
        hint="词组来自你已掌握的单词库"
        onStart={onStart}
        starting={starting}
      />
      {onRetryWords && (
        <div className="prep-spirit-actions prep-spirit-actions--secondary">
          <button type="button" className="prep-challenge-secondary-button" onClick={onRetryWords}>
            换一批词
          </button>
        </div>
      )}
    </div>
  )
}
