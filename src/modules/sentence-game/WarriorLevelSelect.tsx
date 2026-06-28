import { useMemo } from 'react'
import type { SentenceLevel } from './types'
import { isSentenceLevelUnlocked, loadSentenceProgress } from './progress'
import { WARRIOR_GAME_FAMILIES } from './warriorGameCatalog'
import { WARRIOR_MATCH_META } from './data/warriorMagicianMatch'

interface WarriorLevelSelectProps {
  levels: SentenceLevel[]
  onSelectLevel: (level: SentenceLevel) => void
  onStartWarriorMatch: () => void
}

function TenseLevelCard({
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

function MatchGameCard({
  passed,
  scoreText,
  onSelect,
}: {
  passed: boolean
  scoreText: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`prep-spirit-series-card prep-spirit-series-card--match${passed ? ' is-passed' : ''}`}
      onClick={onSelect}
    >
      <span className="prep-spirit-series-card-title">{WARRIOR_MATCH_META.title}</span>
      <span className="prep-spirit-series-card-scene">{WARRIOR_MATCH_META.scene}</span>
      <span className="prep-spirit-series-card-status">{scoreText}</span>
      {passed && <span className="prep-spirit-series-card-star" aria-label="已通关">★</span>}
    </button>
  )
}

export function WarriorLevelSelect({
  levels,
  onSelectLevel,
  onStartWarriorMatch,
}: WarriorLevelSelectProps) {
  const progressMap = loadSentenceProgress()

  const tenseLevels = useMemo(
    () => levels.filter((level) => level.track === 'tense'),
    [levels],
  )

  const tensePassed = tenseLevels.filter((level) => progressMap[level.id]?.passed).length
  const matchProgress = progressMap[WARRIOR_MATCH_META.id]
  const matchPassed = matchProgress?.passed ?? false

  return (
    <div className="prep-level-select prep-level-select-pc prep-spirit-families-page prep-warrior-families-page">
      <section
        className="prep-spirit-family-section"
        data-track="tense"
        aria-labelledby="warrior-family-tense"
      >
        <header className="prep-spirit-family-header">
          <span className="prep-spirit-family-icon" aria-hidden="true">
            {WARRIOR_GAME_FAMILIES.tense.icon}
          </span>
          <div className="prep-spirit-family-header-text">
            <h2 id="warrior-family-tense" className="prep-spirit-family-name">
              {WARRIOR_GAME_FAMILIES.tense.name}
            </h2>
            <p className="prep-spirit-family-sub">{WARRIOR_GAME_FAMILIES.tense.subtitle}</p>
            <p className="prep-spirit-family-desc">{WARRIOR_GAME_FAMILIES.tense.intro}</p>
          </div>
          <span className="prep-spirit-family-progress">
            {tensePassed}/{tenseLevels.length} 通关
          </span>
        </header>

        <div className="prep-spirit-series-grid">
          {tenseLevels.map((level) => {
            const progress = progressMap[level.id]
            const unlocked = isSentenceLevelUnlocked(level.id, levels)
            const passed = progress?.passed ?? false
            const scoreText =
              progress && progress.totalQuestions > 0
                ? `${progress.bestScore}/${progress.totalQuestions} 题`
                : `${level.questionCount} 题`

            return (
              <TenseLevelCard
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

      <section
        className="prep-spirit-family-section"
        data-track="match"
        aria-labelledby="warrior-family-match"
      >
        <header className="prep-spirit-family-header">
          <span className="prep-spirit-family-icon" aria-hidden="true">
            {WARRIOR_GAME_FAMILIES.match.icon}
          </span>
          <div className="prep-spirit-family-header-text">
            <h2 id="warrior-family-match" className="prep-spirit-family-name">
              {WARRIOR_GAME_FAMILIES.match.name}
            </h2>
            <p className="prep-spirit-family-sub">{WARRIOR_GAME_FAMILIES.match.subtitle}</p>
            <p className="prep-spirit-family-desc">{WARRIOR_GAME_FAMILIES.match.intro}</p>
          </div>
          <span className="prep-spirit-family-progress">
            {matchPassed ? '1/1 通关' : '0/1 通关'}
          </span>
        </header>

        <div className="prep-spirit-series-grid prep-spirit-series-grid--single">
          <MatchGameCard
            passed={matchPassed}
            scoreText={
              matchPassed
                ? `${matchProgress?.bestScore ?? 6}/${matchProgress?.totalQuestions ?? 6} 组`
                : '6 组连线'
            }
            onSelect={onStartWarriorMatch}
          />
        </div>
      </section>
    </div>
  )
}
