import { useMemo } from 'react'
import type { SentenceLevel } from './types'
import { isSentenceLevelUnlocked, loadSentenceProgress } from './progress'
import { FORMATION_GAME_FAMILIES } from './formationGameCatalog'

interface FormationLevelSelectProps {
  levels: SentenceLevel[]
  onSelectLevel: (level: SentenceLevel) => void
  showBoss?: boolean
}

function LevelCard({
  level,
  unlocked,
  passed,
  scoreText,
  onSelect,
}: {
  level: SentenceLevel
  unlocked: boolean
  passed: boolean
  scoreText: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`prep-spirit-series-card${passed ? ' is-passed' : ''}${unlocked ? '' : ' is-locked'}`}
      onClick={onSelect}
      disabled={!unlocked}
    >
      <span className="prep-spirit-series-card-title">{level.title}</span>
      <span className="prep-spirit-series-card-scene">{level.scene}</span>
      <span className="prep-spirit-series-card-status">{unlocked ? scoreText : '未解锁'}</span>
      {passed && <span className="prep-spirit-series-card-star" aria-label="已通关">★</span>}
    </button>
  )
}

export function FormationLevelSelect({
  levels,
  onSelectLevel,
  showBoss = true,
}: FormationLevelSelectProps) {
  const progressMap = loadSentenceProgress()

  const families = useMemo(
    () => FORMATION_GAME_FAMILIES.filter((family) => showBoss || family.id !== 'boss'),
    [showBoss],
  )

  return (
    <div className="prep-level-select prep-level-select-pc prep-spirit-families-page prep-formation-families-page">
      {families.map((family) => {
        const familyLevels = family.levelIds
          .map((id) => levels.find((level) => level.id === id))
          .filter((level): level is SentenceLevel => level != null)

        if (familyLevels.length === 0) return null

        const passedCount = familyLevels.filter((level) => progressMap[level.id]?.passed).length
        const gridClass =
          familyLevels.length === 1 ? 'prep-spirit-series-grid prep-spirit-series-grid--single' : 'prep-spirit-series-grid'

        return (
          <section
            key={family.id}
            className="prep-spirit-family-section"
            data-track={family.track}
            aria-labelledby={`formation-family-${family.id}`}
          >
            <header className="prep-spirit-family-header">
              <span className="prep-spirit-family-icon" aria-hidden="true">
                {family.icon}
              </span>
              <div className="prep-spirit-family-header-text">
                <h2 id={`formation-family-${family.id}`} className="prep-spirit-family-name">
                  {family.name}
                </h2>
                <p className="prep-spirit-family-sub">{family.subtitle}</p>
                <p className="prep-spirit-family-desc">{family.intro}</p>
              </div>
              <span className="prep-spirit-family-progress">
                {passedCount}/{familyLevels.length} 通关
              </span>
            </header>

            <div className={gridClass}>
              {familyLevels.map((level) => {
                const progress = progressMap[level.id]
                const unlocked = isSentenceLevelUnlocked(level.id, levels)
                const passed = progress?.passed ?? false
                const scoreText =
                  progress && progress.totalQuestions > 0
                    ? `${progress.bestScore}/${progress.totalQuestions} 题`
                    : `${level.questionCount} 题`

                return (
                  <LevelCard
                    key={level.id}
                    level={level}
                    unlocked={unlocked}
                    passed={passed}
                    scoreText={scoreText}
                    onSelect={() => onSelectLevel(level)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
