import { useMemo } from 'react'
import type { SentenceLevel } from './types'
import { isSentenceLevelUnlocked, loadSentenceProgress } from './progress'
import { MAGIC_GAME_FAMILY } from './magicGameCatalog'

interface MagicLevelSelectProps {
  levels: SentenceLevel[]
  onSelectLevel: (level: SentenceLevel) => void
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

export function MagicLevelSelect({ levels, onSelectLevel }: MagicLevelSelectProps) {
  const progressMap = loadSentenceProgress()

  const magicLevels = useMemo(
    () => levels.filter((level) => level.track === 'adj-adv'),
    [levels],
  )

  const passedCount = magicLevels.filter((level) => progressMap[level.id]?.passed).length

  return (
    <div className="prep-level-select prep-level-select-pc prep-spirit-families-page prep-magic-families-page">
      <section
        className="prep-spirit-family-section"
        data-track={MAGIC_GAME_FAMILY.id}
        aria-labelledby="magic-family-adj-adv"
      >
        <header className="prep-spirit-family-header">
          <span className="prep-spirit-family-icon" aria-hidden="true">
            {MAGIC_GAME_FAMILY.icon}
          </span>
          <div className="prep-spirit-family-header-text">
            <h2 id="magic-family-adj-adv" className="prep-spirit-family-name">
              {MAGIC_GAME_FAMILY.name}
            </h2>
            <p className="prep-spirit-family-sub">{MAGIC_GAME_FAMILY.subtitle}</p>
            <p className="prep-spirit-family-desc">{MAGIC_GAME_FAMILY.intro}</p>
          </div>
          <span className="prep-spirit-family-progress">
            {passedCount}/{magicLevels.length} 通关
          </span>
        </header>

        <div className="prep-spirit-series-grid">
          {magicLevels.map((level) => {
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
    </div>
  )
}
