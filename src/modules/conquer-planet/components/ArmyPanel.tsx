import { useMemo } from 'react'
import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { POS_RACE, SIX_RACES } from '../types'
import { useConquer } from '../ConquerContext'

const POS_ORDER: PartOfSpeech[] = [...SIX_RACES]

interface ArmyPanelProps {
  variant?: 'default' | 'compact' | 'float'
  onInspectArmy?: () => void
}

export function ArmyPanel({ variant = 'compact', onInspectArmy }: ArmyPanelProps) {
  const { session } = useConquer()

  const byPos = useMemo(() => {
    const map: Record<string, number> = {}
    if (!session) return map
    for (const s of session.soldiers) {
      map[s.partOfSpeech] = (map[s.partOfSpeech] ?? 0) + 1
    }
    return map
  }, [session])

  if (!session) return null

  const panelClass = [
    'cp-army-panel',
    variant === 'float' ? 'cp-army-panel--float' : '',
    variant === 'compact' || variant === 'float' ? 'cp-army-panel--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={panelClass}>
      <div className="cp-stats cp-stats--compact">
        <div className="cp-stat cp-stat--compact">
          <span className="cp-stat-num">{session.armySize}</span>
          <span className="cp-stat-label">战斗力</span>
        </div>
        <div className="cp-stat cp-stat--compact">
          <span className="cp-stat-num">{session.armyExp}</span>
          <span className="cp-stat-label">经验值</span>
        </div>
        <div className="cp-stat cp-stat--compact">
          <span className="cp-stat-num">{session.totalPower}</span>
          <span className="cp-stat-label">总战力</span>
        </div>
      </div>
      <div className="cp-army-breakdown cp-army-breakdown--compact">
        {POS_ORDER.map((pos) => {
          const race = POS_RACE[pos]
          return (
            <div key={pos} className="cp-army-race cp-army-race--compact">
              <span className="cp-chip-dot" style={{ background: race.color }} />
              <span className="cp-race-name">{race.race}</span>
              <span className="cp-race-count">{byPos[pos] ?? 0}</span>
            </div>
          )
        })}
      </div>
      {onInspectArmy && (
        <button type="button" className="cp-army-inspect-btn" onClick={onInspectArmy}>
          视察军队
        </button>
      )}
    </aside>
  )
}
