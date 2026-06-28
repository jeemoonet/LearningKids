import type { ReactNode } from 'react'
import { AnimatedMetricNum } from './AnimatedMetricNum'
const HERO_AVATARS = ['🦊', '🦉', '🐻', '🐼', '🦁', '🐯', '🐸', '🦋']

export function heroAvatarFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (Math.imul(31, hash) + name.charCodeAt(i)) | 0
  }
  return HERO_AVATARS[Math.abs(hash) % HERO_AVATARS.length]
}

interface HeroStatProps {
  value: number
  animate?: boolean
}

function HeroStat({ value, animate }: HeroStatProps) {
  if (animate) {
    return (
      <AnimatedMetricNum
        value={value}
        format={(v) => String(Math.round(v))}
        className="lw-mw-hero__stat-num"
      />
    )
  }
  return <span className="lw-mw-hero__stat-num">{value}</span>
}

function wordPercent(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((done / total) * 100))
}

export interface WordProgress {
  done: number
  total: number
}

export interface PlayerHeroCardProps {
  displayName: string
  level: number
  levelTitle?: string
  armySize?: number
  combatPower?: number
  magicPower?: number
  wordProgress?: WordProgress | null
  animateStats?: boolean
  menuOpen: boolean
  onMenuToggle: () => void
  menuContent?: ReactNode
  className?: string
}

export function PlayerHeroCard({
  displayName,
  level,
  levelTitle,
  armySize,
  combatPower,
  magicPower,
  wordProgress,
  animateStats = false,
  menuOpen,
  onMenuToggle,
  menuContent,
  className,
}: PlayerHeroCardProps) {
  const avatar = heroAvatarFor(displayName)
  const title = levelTitle?.trim() || '青铜战士'
  const showStats =
    armySize !== undefined || combatPower !== undefined || magicPower !== undefined
  const wordPercentValue = wordProgress
    ? wordPercent(wordProgress.done, wordProgress.total)
    : 0
  const showWordProgress = Boolean(wordProgress && wordProgress.total > 0)

  return (
    <section
      className={['lw-mw-glass', 'lw-mw-hero', 'lk-player-hero', className].filter(Boolean).join(' ')}
    >
      <div className="lw-mw-hero__crest" aria-hidden="true">
        <span className="lw-mw-hero__crest-face">{avatar}</span>
        <span className="lw-mw-hero__level">Lv.{level}</span>
      </div>

      <div className="lw-mw-hero__main">
        <span className="lw-mw-hero__name">{displayName}</span>
        <span className="lw-mw-hero__title">{title}</span>

        {showStats && (
          <div
            className="lw-mw-hero__stats"
            aria-label={`军团 ${armySize ?? 0}，战斗力 ${combatPower ?? 0}，魔法值 ${magicPower ?? 0}${showWordProgress ? `，掌握单词 ${wordProgress!.done} / ${wordProgress!.total}` : ''}`}
          >
            <div className="lw-mw-hero__stats-metrics">
              {armySize !== undefined && (
                <span>
                  🛡️ <HeroStat value={armySize} animate={animateStats} />
                </span>
              )}
              {combatPower !== undefined && (
                <span>
                  ⚔️ <HeroStat value={combatPower} animate={animateStats} />
                </span>
              )}
              {magicPower !== undefined && (
                <span>
                  ✨ <HeroStat value={magicPower} animate={animateStats} />
                </span>
              )}
            </div>
            {showWordProgress && (
              <div
                className="lw-mw-hero__word-progress lk-player-hero__word-progress"
                role="progressbar"
                aria-valuenow={wordProgress!.done}
                aria-valuemin={0}
                aria-valuemax={wordProgress!.total}
                aria-label={`掌握单词 ${wordProgress!.done} / ${wordProgress!.total}`}
              >
                <span
                  className="lw-mw-hero__word-progress-fill"
                  style={{ width: `${wordPercentValue}%` }}
                />
                <span className="lw-mw-hero__word-progress-text">
                  {wordProgress!.done}/{wordProgress!.total}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lw-mw-hero__menu-wrap">
        <button
          type="button"
          className="lw-mw-hero__menu-btn"
          aria-label="查看军团整体情况"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          onClick={onMenuToggle}
        >
          {menuOpen ? '▴' : '▾'}
        </button>
        {menuOpen && menuContent}
      </div>
    </section>
  )
}
