import { useEffect, useMemo, useState } from 'react'
import type { SentenceLevel, SentenceTrack } from './types'
import { isSentenceLevelUnlocked, loadSentenceProgress } from './progress'

interface TrackSectionMeta {
  track: SentenceTrack
  title: string
  shortTitle: string
  description: string
}

interface SentenceLevelSelectProps {
  levels: SentenceLevel[]
  onSelectLevel: (level: SentenceLevel) => void
  onStartBoss: () => void
  trackSections?: TrackSectionMeta[]
  showBoss?: boolean
  layout?: 'sidebar' | 'topnav'
}

const ALL_TRACK_SECTIONS: TrackSectionMeta[] = [
  {
    track: 'structure',
    shortTitle: '句子成分',
    title: '句子成分 · 主谓宾定状补',
    description: '宽屏拼句还原句子；含状语入门、时间/地点状语与综合高级关',
  },
  {
    track: 'tense',
    shortTitle: '动词时态',
    title: '动词与时态',
    description: '一般时、进行时、完成时，以及动词形式变化',
  },
  {
    track: 'adverbial',
    shortTitle: '时间地点',
    title: '时间 & 地点状语',
    description: '回答 When？Where？掌握时间与方位表达',
  },
  {
    track: 'adj-adv',
    shortTitle: '形副高级',
    title: '形容词 & 副词（高级）',
    description: '形副辨析、系动词后接形容词、比较级与最高级',
  },
]

type ActivePanel = SentenceTrack | 'boss'

function LevelCard({
  level,
  unlocked,
  progress,
  onSelect,
}: {
  level: SentenceLevel
  unlocked: boolean
  progress?: { bestScore: number; totalQuestions: number; passed: boolean }
  onSelect: () => void
}) {
  const stars = progress?.passed ? '★' : progress ? '☆' : ''
  const scoreText =
    progress && progress.totalQuestions > 0
      ? `${progress.bestScore}/${progress.totalQuestions}`
      : `${level.questionCount} 题`

  return (
    <button
      type="button"
      className={`sentence-level-card${unlocked ? '' : ' is-locked'}${progress?.passed ? ' is-passed' : ''}`}
      data-track={level.track}
      onClick={onSelect}
      disabled={!unlocked}
    >
      <span className="sentence-level-card-scene">{level.scene}</span>
      <span className="sentence-level-card-title">{level.title}</span>
      {level.focusRoles.length > 0 && (
        <span className="sentence-level-card-roles">{level.focusRoles.join(' · ')}</span>
      )}
      <span className="sentence-level-card-meta">
        {unlocked ? scoreText : '未解锁'}
        {stars && <span className="sentence-level-card-star">{stars}</span>}
      </span>
    </button>
  )
}

function countPassedLevels(
  sectionLevels: SentenceLevel[],
  progressMap: ReturnType<typeof loadSentenceProgress>,
) {
  return sectionLevels.filter((level) => progressMap[level.id]?.passed).length
}

function TrackNav({
  layout,
  availableSections,
  levels,
  progressMap,
  activePanel,
  bossLevel,
  bossUnlocked,
  showBoss,
  onSelectPanel,
}: {
  layout: 'sidebar' | 'topnav'
  availableSections: TrackSectionMeta[]
  levels: SentenceLevel[]
  progressMap: ReturnType<typeof loadSentenceProgress>
  activePanel: ActivePanel
  bossLevel?: SentenceLevel
  bossUnlocked: boolean
  showBoss: boolean
  onSelectPanel: (panel: ActivePanel) => void
}) {
  const navClass = layout === 'topnav' ? 'prep-level-topnav' : 'sentence-level-sidebar-nav'
  const itemClass = layout === 'topnav' ? 'prep-level-topnav-item' : 'sentence-level-sidebar-item'

  const items = (
    <>
      {availableSections.map((section) => {
        const sectionLevels = levels.filter((level) => level.track === section.track)
        const passed = countPassedLevels(sectionLevels, progressMap)
        const isActive = activePanel === section.track

        return (
          <button
            key={section.track}
            type="button"
            className={`${itemClass}${isActive ? ' is-active' : ''}`}
            data-track={section.track}
            onClick={() => onSelectPanel(section.track)}
          >
            <span className={layout === 'topnav' ? 'prep-level-topnav-item-title' : 'sentence-level-sidebar-item-title'}>
              {section.shortTitle}
            </span>
            <span className={layout === 'topnav' ? 'prep-level-topnav-item-meta' : 'sentence-level-sidebar-item-meta'}>
              {passed}/{sectionLevels.length} 通关
            </span>
          </button>
        )
      })}
      {showBoss && bossLevel && (
        <button
          type="button"
          className={`${itemClass}${layout === 'topnav' ? ' prep-level-topnav-item-boss' : ' sentence-level-sidebar-item-boss'}${
            activePanel === 'boss' ? ' is-active' : ''
          }${bossUnlocked ? '' : ' is-locked'}`}
          onClick={() => onSelectPanel('boss')}
        >
          <span className={layout === 'topnav' ? 'prep-level-topnav-item-title' : 'sentence-level-sidebar-item-title'}>
            综合闯关
          </span>
          <span className={layout === 'topnav' ? 'prep-level-topnav-item-meta' : 'sentence-level-sidebar-item-meta'}>
            {bossUnlocked ? '混合考点' : '未解锁'}
          </span>
        </button>
      )}
    </>
  )

  if (layout === 'topnav') {
    return (
      <nav className={navClass} aria-label="子赛道">
        {items}
      </nav>
    )
  }

  return (
    <aside className="sentence-level-sidebar" aria-label="学习赛道">
      <p className="sentence-level-sidebar-label">学习赛道</p>
      <nav className={navClass}>{items}</nav>
    </aside>
  )
}

export function SentenceLevelSelect({
  levels,
  onSelectLevel,
  onStartBoss,
  trackSections = ALL_TRACK_SECTIONS,
  showBoss = true,
  layout = 'sidebar',
}: SentenceLevelSelectProps) {
  const progressMap = loadSentenceProgress()
  const bossLevel = showBoss ? levels.find((level) => level.track === 'boss') : undefined
  const bossUnlocked = bossLevel ? isSentenceLevelUnlocked(bossLevel.id, levels) : false

  const availableSections = useMemo(
    () =>
      trackSections.filter((section) =>
        levels.some((level) => level.track === section.track),
      ),
    [levels, trackSections],
  )

  const [activePanel, setActivePanel] = useState<ActivePanel>(
    availableSections[0]?.track ?? 'structure',
  )

  useEffect(() => {
    if (activePanel === 'boss') return
    const stillAvailable = availableSections.some((section) => section.track === activePanel)
    if (!stillAvailable && availableSections.length > 0) {
      setActivePanel(availableSections[0].track)
    }
  }, [activePanel, availableSections])

  const activeSection =
    activePanel === 'boss'
      ? null
      : availableSections.find((section) => section.track === activePanel) ?? availableSections[0]

  const activeLevels = activeSection
    ? levels.filter((level) => level.track === activeSection.track)
    : []

  const passedCount = activeSection ? countPassedLevels(activeLevels, progressMap) : 0

  const trackNav = (
    <TrackNav
      layout={layout}
      availableSections={availableSections}
      levels={levels}
      progressMap={progressMap}
      activePanel={activePanel}
      bossLevel={bossLevel}
      bossUnlocked={bossUnlocked}
      showBoss={showBoss}
      onSelectPanel={setActivePanel}
    />
  )

  const mainPanel =
    activePanel === 'boss' && bossLevel ? (
      <section className="sentence-level-main-panel sentence-boss-panel prep-level-main-panel">
        <div className="sentence-track-header prep-track-header-pc">
          <div>
            <h2>综合闯关</h2>
            <p>10 道混合题，考查主谓宾定状补、时态与形副综合应用</p>
          </div>
        </div>
        <div className="sentence-boss-panel-body prep-boss-panel-body">
          <div className="sentence-boss-panel-info">
            <p className="sentence-boss-panel-lead">
              随机混合全部句型考点，检验你对句子成分、时态与形副的综合掌握。
            </p>
            <ul className="sentence-boss-panel-rules prep-boss-panel-rules">
              <li>每题限时作答，拖入词语后立即判定</li>
              <li>涵盖主谓宾定状补、时态变化与形副辨析</li>
              <li>至少通关 4 个关卡后解锁</li>
            </ul>
          </div>
          <button
            type="button"
            className={`sentence-boss-button sentence-boss-button-pc prep-boss-button prep-boss-button-pc${bossUnlocked ? '' : ' is-locked'}`}
            disabled={!bossUnlocked}
            onClick={onStartBoss}
          >
            <span className="sentence-boss-button-title prep-boss-button-title">开始综合闯关</span>
            <span className="sentence-boss-button-desc prep-boss-button-desc">
              {bossUnlocked ? '随机混合全部句型考点' : '至少通关 4 个关卡后解锁'}
            </span>
          </button>
        </div>
      </section>
    ) : activeSection ? (
      <section className="sentence-level-main-panel prep-level-main-panel" data-track={activeSection.track}>
        <div className="sentence-track-header sentence-track-header-pc prep-track-header-pc">
          <div className="prep-track-header-text">
            <h2>{activeSection.title}</h2>
            <p>{activeSection.description}</p>
          </div>
          <span className="sentence-track-progress prep-track-progress">
            已通关 {passedCount}/{activeLevels.length}
          </span>
        </div>
        <div className="sentence-level-grid sentence-level-grid-pc prep-level-grid-pc">
          {activeLevels.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              unlocked={isSentenceLevelUnlocked(level.id, levels)}
              progress={progressMap[level.id]}
              onSelect={() => onSelectLevel(level)}
            />
          ))}
        </div>
      </section>
    ) : null

  if (layout === 'topnav') {
    return (
      <div className="prep-level-select prep-level-select-pc">
        {trackNav}
        <div className="prep-level-body">{mainPanel}</div>
      </div>
    )
  }

  return (
    <div className="sentence-level-select sentence-level-select-pc">
      {trackNav}
      <div className="sentence-level-main">{mainPanel}</div>
    </div>
  )
}
