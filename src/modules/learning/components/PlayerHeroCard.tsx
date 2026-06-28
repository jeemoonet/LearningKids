import type { ReactNode } from 'react'
import type { LevelProgress } from '../api'
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

function xpPercentFromProgress(progress: LevelProgress): number {
  const span = Math.max(1, progress.ceiling - progress.floor)
  return Math.min(100, Math.round(((progress.current - progress.floor) / span) * 100))
}

export interface PlayerHeroCardProps {
  displayName: string
  level: number
  levelTitle?: string
  armySize?: number
  combatPower?: number
  magicPower?: number
  levelProgress?: LevelProgress | null
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
  levelProgress,
  animateStats = false,
  menuOpen,
  onMenuToggle,
  menuContent,
  className,
}: PlayerHeroCardProps) {
  const avatar = heroAvatarFor(displayName)
  const title = levelTitle ?? '词条练习生'
  const showStats =
    armySize !== undefined || combatPower !== undefined || magicPower !== undefined
  const xpPercent = levelProgress ? xpPercentFromProgress(levelProgress) : 0

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
        <span className="lw-mw-hero__title">✦ {title} ✦</span>

        {showStats && (
          <div
            className="lw-mw-hero__stats"
            aria-label={`军团 ${armySize ?? 0}，战斗力 ${combatPower ?? 0}，魔法值 ${magicPower ?? 0}`}
          >
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
        )}

        {levelProgress && (
          <div
            className="lw-mw-hero__xp lk-player-hero__xp"
            role="progressbar"
            aria-valuenow={levelProgress.current}
            aria-valuemin={levelProgress.floor}
            aria-valuemax={levelProgress.ceiling}
            aria-label={`成长进度 ${xpPercent}%`}
          >
            <span className="lw-mw-hero__xp-fill" style={{ width: `${xpPercent}%` }} />
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
