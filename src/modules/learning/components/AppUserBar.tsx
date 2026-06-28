import { useMemo, useState } from 'react'
import type { LearningProfile, LevelProgress } from '../api'
import { emptyRaceBreakdown } from '../userBarExtrasStore'
import { PlayerHeroCard } from './PlayerHeroCard'

export interface PlayerBarMetrics {
  armySize: number
  combatPower: number
  magicPower: number
  totalPower?: number
  level: number
  levelTitle?: string
  levelProgress?: LevelProgress
}

export interface RaceBreakdownItem {
  label: string
  posTag: string
  color: string
  count: number
}

interface AppUserBarProps {
  userDisplayName?: string
  profile: LearningProfile | null
  onLogout: () => void
  playerMetrics?: PlayerBarMetrics | null
  raceBreakdown?: RaceBreakdownItem[]
  onInspectArmy?: () => void
  conquestProgress?: {
    label: string
    done: number
    total: number
    percent: number
  }
}

function formatTotalPower(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function AppUserBar({
  userDisplayName,
  profile,
  onLogout,
  playerMetrics,
  raceBreakdown,
  onInspectArmy,
  conquestProgress,
}: AppUserBarProps) {
  const [open, setOpen] = useState(false)
  const name = profile?.displayName ?? userDisplayName ?? '学员'
  const grade = profile?.grade?.trim()
  const level = playerMetrics?.level ?? 1
  const levelTitle = playerMetrics?.levelTitle

  const growthMetrics = useMemo(() => {
    if (!playerMetrics) return []
    return [
      { label: '军团人数', value: playerMetrics.armySize },
      { label: '战斗力', value: playerMetrics.combatPower },
      { label: '魔法值', value: playerMetrics.magicPower },
    ]
  }, [playerMetrics])

  const races = raceBreakdown?.length ? raceBreakdown : emptyRaceBreakdown()
  const totalPowerText =
    playerMetrics?.totalPower !== undefined
      ? formatTotalPower(playerMetrics.totalPower)
      : null

  const menuContent = open ? (
    <>
      <button
        type="button"
        className="lw-mw-menu__backdrop"
        aria-label="关闭菜单"
        onClick={() => setOpen(false)}
      />
      <div className="lw-mw-menu lk-user-bar__menu" role="dialog" aria-label="军团整体情况">
        <div className="lk-user-bar__menu-head">
          <strong>{name}</strong>
          {levelTitle ? (
            <span>Lv.{level} · {levelTitle}</span>
          ) : grade ? (
            <span>{grade}</span>
          ) : null}
        </div>

        {playerMetrics && (
          <div className="lk-user-bar__menu-section">
            <p className="lk-user-bar__menu-section-title">成长概况</p>
            <div className="lk-user-bar__menu-metrics lk-user-bar__menu-metrics--triple">
              {growthMetrics.map((item) => (
                <div key={item.label} className="lk-user-bar__menu-metric">
                  <span className="lk-user-bar__menu-metric-num">{item.value}</span>
                  <span className="lk-user-bar__menu-metric-label">{item.label}</span>
                </div>
              ))}
            </div>
            {totalPowerText !== null && (
              <div className="lk-user-bar__menu-total">
                <span className="lk-user-bar__menu-total-num">{totalPowerText}</span>
                <span className="lk-user-bar__menu-total-label">总战力</span>
              </div>
            )}
            <div className="lk-user-bar__race-grid">
              {races.map((race) => (
                <div key={race.posTag} className="lk-user-bar__race-item">
                  <span className="lk-user-bar__race-dot" style={{ background: race.color }} />
                  <span className="lk-user-bar__race-label">{race.label}</span>
                  <span className="lk-user-bar__race-tag">{race.posTag}</span>
                  <span className="lk-user-bar__race-count">{race.count}</span>
                </div>
              ))}
            </div>
            {onInspectArmy && (
              <button
                type="button"
                className="lk-user-bar__inspect-btn"
                onClick={() => {
                  setOpen(false)
                  onInspectArmy()
                }}
              >
                视察军队
              </button>
            )}
          </div>
        )}

        <div className="lk-user-bar__menu-section">
          <p className="lk-user-bar__menu-section-title">征服目标</p>
          <p className="lk-user-bar__conquest-label">
            {conquestProgress?.label ?? profile?.currentLibraryName ?? '未选择'}
          </p>
          <div
            className="lk-user-bar__conquest-bar"
            role="progressbar"
            aria-valuenow={conquestProgress?.done ?? 0}
            aria-valuemin={0}
            aria-valuemax={conquestProgress?.total ?? 0}
            aria-label={`征服进度 ${conquestProgress?.done ?? 0} / ${conquestProgress?.total ?? 0}`}
          >
            <span
              className="lk-user-bar__conquest-bar-fill"
              style={{ width: `${conquestProgress?.percent ?? 0}%` }}
            />
            <span className="lk-user-bar__conquest-bar-text">
              {conquestProgress?.done ?? 0} / {conquestProgress?.total ?? 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="lw-mw-menu__item lk-user-bar__menu-item--danger"
          onClick={() => void onLogout()}
        >
          退出登录
        </button>
      </div>
    </>
  ) : null

  return (
    <div className="lk-user-bar">
      <PlayerHeroCard
        displayName={name}
        level={level}
        levelTitle={levelTitle}
        armySize={playerMetrics?.armySize}
        combatPower={playerMetrics?.combatPower}
        magicPower={playerMetrics?.magicPower}
        levelProgress={playerMetrics?.levelProgress}
        animateStats={Boolean(playerMetrics)}
        menuOpen={open}
        onMenuToggle={() => setOpen((v) => !v)}
        menuContent={menuContent}
      />
    </div>
  )
}
