import { useMemo } from 'react'
import type { PrepLevel, PrepTrack } from './types'
import { loadPrepProgress } from './progress'
import { PREP_FAMILIES } from './prepSpiritCatalog'

interface PrepLevelSelectProps {
  levels: PrepLevel[]
  onSelectLevel: (level: PrepLevel) => void
}

const TRACK_ORDER: PrepTrack[] = ['time', 'position', 'more']

function countPassedLevels(
  sectionLevels: PrepLevel[],
  progressMap: ReturnType<typeof loadPrepProgress>,
) {
  return sectionLevels.filter((level) => progressMap[level.id]?.passed).length
}

function SeriesCard({
  level,
  passed,
  onSelect,
}: {
  level: PrepLevel
  passed: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`prep-spirit-series-card${passed ? ' is-passed' : ''}`}
      onClick={onSelect}
      disabled={level.questionCount === 0}
    >
      <span className="prep-spirit-series-card-title">{level.title}</span>
      <span className="prep-spirit-series-card-scene">{level.scene}</span>
      {passed && <span className="prep-spirit-series-card-star" aria-label="已通关">★</span>}
    </button>
  )
}

export function PrepLevelSelect({ levels, onSelectLevel }: PrepLevelSelectProps) {
  const progressMap = loadPrepProgress()

  const familySections = useMemo(
    () =>
      TRACK_ORDER.filter((track) => levels.some((level) => level.track === track)).map((track) => ({
        track,
        family: PREP_FAMILIES[track],
        levels: levels.filter((level) => level.track === track),
      })),
    [levels],
  )

  return (
    <div className="prep-level-select prep-level-select-pc prep-spirit-families-page">
      {familySections.map(({ track, family, levels: sectionLevels }) => {
        const passed = countPassedLevels(sectionLevels, progressMap)

        return (
          <section
            key={track}
            className="prep-spirit-family-section"
            data-track={track}
            aria-labelledby={`prep-family-${track}`}
          >
            <header className="prep-spirit-family-header">
              <span className="prep-spirit-family-icon" aria-hidden="true">
                {family.icon}
              </span>
              <div className="prep-spirit-family-header-text">
                <h2 id={`prep-family-${track}`} className="prep-spirit-family-name">
                  {family.name}
                </h2>
                <p className="prep-spirit-family-desc">{family.intro}</p>
              </div>
              <span className="prep-spirit-family-progress">
                {passed}/{sectionLevels.length} 通关
              </span>
            </header>

            <div className="prep-spirit-series-grid">
              {sectionLevels.map((level) => (
                <SeriesCard
                  key={level.id}
                  level={level}
                  passed={progressMap[level.id]?.passed ?? false}
                  onSelect={() => onSelectLevel(level)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
