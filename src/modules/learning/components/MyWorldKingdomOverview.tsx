import { useEffect, useMemo, useState } from 'react'
import { getKingdomMapImage } from '../../conquer-planet/components/ImageKingdomMapScene'
import { formatLearningMethodsSummary, levelKindShortLabel } from '../../conquer-planet/data/levelLearningMethods'
import type { PlanetKingdomSummary, PlanetKingdomStatus, PlanetLevel } from '../../conquer-planet/types'

function kingdomStatusLabel(status: PlanetKingdomStatus): string {
  if (status === 'locked') return '未解锁'
  if (status === 'cleared') return '已征服'
  return '出征中'
}

function levelMethodLabel(kind: PlanetLevel['kind']): string {
  return formatLearningMethodsSummary(kind)
}

function levelKindLabel(kind: PlanetLevel['kind']): string {
  return levelKindShortLabel(kind)
}

function canEnterKingdom(kingdom: PlanetKingdomSummary): boolean {
  return kingdom.status !== 'locked' && kingdom.levelsTotal > 0
}

interface MyWorldKingdomOverviewProps {
  kingdoms: PlanetKingdomSummary[]
  loading: boolean
  onEnterKingdom: (kingdomId: string) => void
}

export function MyWorldKingdomOverview({
  kingdoms,
  loading,
  onEnterKingdom,
}: MyWorldKingdomOverviewProps) {
  const currentKingdom = useMemo(
    () => kingdoms.find((k) => k.status === 'current') ?? kingdoms[0] ?? null,
    [kingdoms],
  )

  const [selectedKingdomId, setSelectedKingdomId] = useState<string | null>(null)

  useEffect(() => {
    if (kingdoms.length === 0) return
    setSelectedKingdomId((prev) => {
      if (prev && kingdoms.some((k) => k.id === prev)) return prev
      return currentKingdom?.id ?? kingdoms[0]?.id ?? null
    })
  }, [kingdoms, currentKingdom?.id])

  const selectedKingdom = useMemo(
    () => kingdoms.find((k) => k.id === selectedKingdomId) ?? currentKingdom,
    [kingdoms, selectedKingdomId, currentKingdom],
  )

  const kingdomMap = selectedKingdom ? getKingdomMapImage(selectedKingdom.id) : null
  const kingdomPercent =
    selectedKingdom && selectedKingdom.levelsTotal > 0
      ? Math.round((selectedKingdom.levelsDone / selectedKingdom.levelsTotal) * 100)
      : 0
  const nextLevelIdx = selectedKingdom
    ? selectedKingdom.levels.findIndex((lv) => !lv.done)
    : -1

  const enterSelected = () => {
    if (!selectedKingdom || !canEnterKingdom(selectedKingdom)) return
    onEnterKingdom(selectedKingdom.id)
  }

  const clearedCount = kingdoms.filter((k) => k.status === 'cleared').length

  if (kingdoms.length === 0) {
    return (
      <div className="lw-mw-glass lw-mw-realm--empty">
        <span className="lw-mw-realm__map-emoji" aria-hidden="true">🧭</span>
        <p>{loading ? '正在召集军团…' : '暂无王国数据'}</p>
      </div>
    )
  }

  return (
    <div className="lw-mw-kingdoms">
      <div className="lw-mw-kingdom-strip-wrap">
        <p className="lw-mw-kingdom-strip__legend">
          七王国远征 · 已征服 {clearedCount}/{kingdoms.length}
        </p>
        <div className="lw-mw-kingdom-strip" role="tablist" aria-label="七王国">
          {kingdoms.map((kingdom) => {
            const selected = kingdom.id === selectedKingdom?.id
            const locked = kingdom.status === 'locked'
            return (
              <button
                key={kingdom.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={[
                  'lw-mw-kingdom-pin',
                  selected ? 'is-selected' : '',
                  locked ? 'is-locked' : '',
                  kingdom.status === 'current' ? 'is-current' : '',
                  kingdom.status === 'cleared' ? 'is-cleared' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelectedKingdomId(kingdom.id)}
              >
                <span className="lw-mw-kingdom-pin__order">王国 {kingdom.order}</span>
                <span className="lw-mw-kingdom-pin__name">{kingdom.name}</span>
                <span className={`lw-mw-kingdom-pin__status lw-mw-kingdom-pin__status--${kingdom.status}`}>
                  {locked ? '🔒 ' : kingdom.status === 'cleared' ? '✓ ' : ''}
                  {kingdomStatusLabel(kingdom.status)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedKingdom && (
        <div
          className={[
            'lw-mw-glass lw-mw-realm',
            !canEnterKingdom(selectedKingdom) ? 'lw-mw-realm--locked' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role={canEnterKingdom(selectedKingdom) ? 'button' : undefined}
          tabIndex={canEnterKingdom(selectedKingdom) ? 0 : undefined}
          aria-label={
            canEnterKingdom(selectedKingdom)
              ? `进入 ${selectedKingdom.name}`
              : `${selectedKingdom.name}，${kingdomStatusLabel(selectedKingdom.status)}`
          }
          onClick={canEnterKingdom(selectedKingdom) ? enterSelected : undefined}
          onKeyDown={
            canEnterKingdom(selectedKingdom)
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    enterSelected()
                  }
                }
              : undefined
          }
        >
          <div className="lw-mw-realm__progress">
            <div className="lw-mw-realm__head">
              <span
                className={[
                  'lw-mw-realm__order',
                  selectedKingdom.status === 'locked' ? 'lw-mw-realm__order--locked' : '',
                  selectedKingdom.status === 'cleared' ? 'lw-mw-realm__order--cleared' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                王国 {selectedKingdom.order} · {kingdomStatusLabel(selectedKingdom.status)}
              </span>
              <h2 className="lw-mw-realm__name">{selectedKingdom.name}</h2>
              <p className="lw-mw-realm__sub">{selectedKingdom.subtitle}</p>
            </div>
            <p className="lw-mw-realm__boss">
              👹 镇守 · {selectedKingdom.monster.name}
              <span className="lw-mw-realm__boss-epithet">（{selectedKingdom.monster.epithet}）</span>
            </p>

            {selectedKingdom.status === 'locked' ? (
              <p className="lw-mw-realm__lock-msg">
                🔒 需先征服前一国才能解锁此王国
              </p>
            ) : selectedKingdom.levelsTotal === 0 ? (
              <p className="lw-mw-realm__lock-msg">🚧 关卡筹备中，即将开放</p>
            ) : (
              <>
                <div className="lw-mw-realm__bar" aria-hidden="true">
                  <span className="lw-mw-realm__bar-fill" style={{ width: `${kingdomPercent}%` }} />
                  <span className="lw-mw-realm__bar-text">
                    征服进度 {selectedKingdom.levelsDone}/{selectedKingdom.levelsTotal} 关
                  </span>
                </div>
                <ul className="lw-mw-track">
                  {selectedKingdom.levels.map((lv, idx) => (
                    <li
                      key={lv.id}
                      className={`lw-mw-track__item${lv.done ? ' is-done' : idx === nextLevelIdx ? ' is-current' : ''}`}
                    >
                      <span className="lw-mw-track__icon" aria-hidden="true">
                        {lv.done ? '✓' : lv.icon}
                      </span>
                      <span className="lw-mw-track__name">{lv.name}</span>
                      <span className="lw-mw-track__kind" title={levelMethodLabel(lv.kind)}>
                        {levelKindLabel(lv.kind)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="lw-mw-realm__map">
            {kingdomMap ? (
              <img
                className="lw-mw-realm__map-img"
                src={kingdomMap}
                alt={`${selectedKingdom.name}地图`}
              />
            ) : (
              <div className="lw-mw-realm__map-fallback">
                <span className="lw-mw-realm__map-emoji" aria-hidden="true">🗺️</span>
                <span>{selectedKingdom.status === 'locked' ? '尚未解锁' : '地图绘制中'}</span>
              </div>
            )}
            <span className="lw-mw-realm__map-scrim" aria-hidden="true" />
            {canEnterKingdom(selectedKingdom) ? (
              <span className="lw-mw-realm__enter">进入王国 ▸</span>
            ) : (
              <span className="lw-mw-realm__enter lw-mw-realm__enter--locked">
                {selectedKingdom.status === 'locked' ? '🔒 未解锁' : '🚧 即将开放'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
