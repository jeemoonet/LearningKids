import type { ReactNode } from 'react'
import { MapHud } from '../components/MapHud'
import { ContinentalMapScene } from '../components/ContinentalMapScene'
import { MonsterSprite } from '../components/monsters/MonsterIllustrations'
import { getKingdomMapPosition } from '../planetMapConfig'
import { useConquer } from '../ConquerContext'
import type { PlanetKingdomSummary } from '../types'

interface ContinentalMapViewProps {
  onEnterKingdom: (kingdom: PlanetKingdomSummary) => void
  hudTitle?: string
  hudSubtitle?: string
  hudLeading?: ReactNode
  hudTrailing?: ReactNode
  hudContent?: ReactNode
  showArmy?: boolean
}

function statusLabel(status: PlanetKingdomSummary['status']): string {
  if (status === 'locked') return '未解锁'
  if (status === 'cleared') return '已征服'
  return '出征中'
}

export function ContinentalMapView({
  onEnterKingdom,
  hudTitle = '词性星球 · 七王国全景',
  hudSubtitle,
  hudLeading,
  hudTrailing,
  hudContent,
  showArmy = true,
}: ContinentalMapViewProps) {
  const { session } = useConquer()
  if (!session) return null

  const clearedCount = session.kingdoms.filter((k) => k.status === 'cleared').length
  const defaultSubtitle = `已征服 ${clearedCount} / 7 国 · 点击解锁的王国进入作战地图`

  return (
    <div className="cp-map-layout cp-map-layout--immersive">
      <div className="cp-world-map cp-world-map--immersive cp-world-map--continent">
        <div className="cp-world-map__canvas cp-world-map__canvas--immersive">
          <ContinentalMapScene />

          {hudContent ?? (
            <MapHud
              title={hudTitle}
              subtitle={hudSubtitle ?? defaultSubtitle}
              leading={hudLeading}
              trailing={hudTrailing}
              showArmy={showArmy}
            />
          )}

          <div className="cp-continent-nodes">
            {session.kingdoms.map((kingdom) => {
              const pos = getKingdomMapPosition(kingdom.id)
              if (!pos) return null
              const locked = kingdom.status === 'locked'
              const isCurrent = kingdom.status === 'current'

              return (
                <button
                  key={kingdom.id}
                  type="button"
                  className={[
                    'cp-continent-node',
                    locked ? 'cp-continent-node--locked' : '',
                    isCurrent ? 'cp-continent-node--current' : '',
                    kingdom.status === 'cleared' ? 'cp-continent-node--cleared' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  disabled={locked}
                  onClick={() => onEnterKingdom(kingdom)}
                  aria-label={`${kingdom.name}，${statusLabel(kingdom.status)}`}
                >
                  <div className="cp-continent-node__monster">
                    <MonsterSprite
                      id={kingdom.monster.id}
                      size={locked ? 44 : 56}
                      title={kingdom.monster.name}
                      className={locked ? 'cp-monster-art--locked' : ''}
                    />
                  </div>
                  <span className="cp-continent-node__order">王国 {kingdom.order}</span>
                  <span className="cp-continent-node__name">{kingdom.name}</span>
                  <span className="cp-continent-node__region">{pos.region}</span>
                  <span className={`cp-continent-node__status cp-continent-node__status--${kingdom.status}`}>
                    {statusLabel(kingdom.status)}
                    {!locked && kingdom.levelsTotal > 0 && (
                      <> · {kingdom.levelsDone}/{kingdom.levelsTotal}</>
                    )}
                    {locked && kingdom.order > 1 && ' · 需先征服前一国'}
                    {!locked && kingdom.levelsTotal === 0 && ' · 即将开放'}
                  </span>
                  <span className="cp-continent-node__monster-name">{kingdom.monster.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="cp-world-map__hint cp-world-map__hint--float">
          自西南边境起，沿远征古道向北，直取暗影王座
        </p>
      </div>
    </div>
  )
}
