import { useState, type CSSProperties } from 'react'
import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { POS_RACE } from '../../conquer-planet/types'
import { RaceIcon } from '../../conquer-planet/components/RaceIcon'
import { RACE_GUIDES, RACE_SYNERGY_CHAIN } from '../data/raceGuideData'

interface RaceGuidePanelProps {
  layout?: 'sidebar' | 'page'
  activeRace?: Exclude<PartOfSpeech, 'other'> | null
  onSelectRace?: (pos: Exclude<PartOfSpeech, 'other'>) => void
  defaultExpandedAll?: boolean
}

export function RaceGuidePanel({
  layout = 'sidebar',
  activeRace,
  onSelectRace,
  defaultExpandedAll = false,
}: RaceGuidePanelProps) {
  const [expanded, setExpanded] = useState<Set<PartOfSpeech>>(() => {
    if (!defaultExpandedAll) return new Set()
    return new Set(RACE_GUIDES.map((g) => g.pos))
  })

  const toggle = (pos: PartOfSpeech) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(pos)) next.delete(pos)
      else next.add(pos)
      return next
    })
  }

  const rootClass =
    layout === 'page' ? 'lw-race-guide lw-race-guide--page' : 'lw-race-guide'

  return (
    <aside className={rootClass} aria-label="六大种族介绍">
      {layout === 'sidebar' && (
        <header className="lw-race-guide__head">
          <h3 className="lw-race-guide__title">六大种族</h3>
          <p className="lw-race-guide__sub">相生 +20% · 同族 -20% · 其他 ×1.0</p>
        </header>
      )}

      <div className="lw-race-guide__list">
        {RACE_GUIDES.map((guide) => {
          const meta = POS_RACE[guide.pos]
          const isOpen = expanded.has(guide.pos) || layout === 'page'
          const isActive = activeRace === guide.pos

          return (
            <article
              key={guide.pos}
              className={`lw-race-guide-card${isOpen ? ' is-open' : ''}${isActive ? ' is-highlight' : ''}`}
              style={{ '--race-color': meta.color } as CSSProperties}
            >
              <button
                type="button"
                className="lw-race-guide-card__toggle"
                aria-expanded={isOpen}
                onClick={() => layout === 'sidebar' && toggle(guide.pos)}
                disabled={layout === 'page'}
              >
                <span className="lw-race-guide-card__icon" aria-hidden="true">
                  <RaceIcon pos={guide.pos} size={32} />
                </span>
                <div className="lw-race-guide-card__brief">
                  <strong>{meta.race}</strong>
                  <span>{meta.role}</span>
                </div>
                {layout === 'sidebar' && (
                  <span className="lw-race-guide-card__chevron" aria-hidden="true">
                    {isOpen ? '▾' : '▸'}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="lw-race-guide-card__body">
                  <p className="lw-race-guide-card__line">
                    <span className="lw-race-guide-card__label">语法</span>
                    {guide.grammar}
                  </p>
                  <p className="lw-race-guide-card__line">
                    <span className="lw-race-guide-card__label">战斗力</span>
                    {guide.power}
                  </p>
                  <p className="lw-race-guide-card__line">
                    <span className="lw-race-guide-card__label">相生</span>
                    {guide.synergy}
                  </p>
                  <p className="lw-race-guide-card__line">
                    <span className="lw-race-guide-card__label">种族关系</span>
                    {guide.relations}
                  </p>
                  {onSelectRace && (
                    <button
                      type="button"
                      className="lw-race-guide-card__action"
                      onClick={() => onSelectRace(guide.pos)}
                    >
                      查看{meta.role}编队 →
                    </button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <footer className="lw-race-guide__foot">
        <p className="lw-race-guide__chain-title">相生链</p>
        <p className="lw-race-guide__chain">{RACE_SYNERGY_CHAIN}</p>
      </footer>
    </aside>
  )
}
