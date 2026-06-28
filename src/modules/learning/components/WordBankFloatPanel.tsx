import { useMemo, useState, type CSSProperties } from 'react'
import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { basePower, roundPower } from '../../conquer-planet/domain/power'
import type { PlanetSoldier } from '../../conquer-planet/types'
import { POS_RACE, SIX_RACES } from '../../conquer-planet/types'
import { RaceIcon } from '../../conquer-planet/components/RaceIcon'
import { LegionWordDetailModal } from './LegionWordDetailModal'

const PRONOUN_WORDS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
])

type RaceFilter = 'all' | Exclude<PartOfSpeech, 'other'>

const SQUAD_ORDER: PartOfSpeech[] = [...SIX_RACES, 'other']

interface SoldierView {
  soldier: PlanetSoldier
  power: number
  race: PartOfSpeech
}

interface SquadView {
  pos: PartOfSpeech
  soldiers: SoldierView[]
  totalPower: number
}

interface WordBankFloatPanelProps {
  soldiers: PlanetSoldier[]
  onClose: () => void
}

function resolveSoldierRace(soldier: PlanetSoldier): PartOfSpeech {
  if (soldier.partOfSpeech !== 'other') return soldier.partOfSpeech
  if (PRONOUN_WORDS.has(soldier.word.toLowerCase())) return 'pronoun'
  return 'other'
}

function soldierPower(soldier: PlanetSoldier, race: PartOfSpeech): number {
  return roundPower(
    basePower({
      id: soldier.wordId,
      word: soldier.word,
      meaning: soldier.meaning,
      partOfSpeech: race,
      syllables: soldier.syllables,
      keySlots: { own: [], captured: [] },
      sentence: '',
      sentenceZh: '',
    }),
  )
}

function SoldierCard({
  soldier,
  power,
  rank,
  race,
  onSelect,
}: {
  soldier: PlanetSoldier
  power: number
  rank: number
  race: PartOfSpeech
  onSelect: () => void
}) {
  const raceMeta = POS_RACE[race]
  const verbBonus = race === 'verb' ? ' ×1.5' : ''

  return (
    <article
      className="lw-legion-card lw-legion-card--clickable"
      style={{ '--race-color': raceMeta.color } as CSSProperties}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="lw-legion-card__icon" aria-hidden="true">
        <RaceIcon pos={race} size={34} />
      </div>
      <div className="lw-legion-card__body">
        <div className="lw-legion-card__row">
          <span className="lw-legion-card__rank">#{rank}</span>
          <span className="lw-legion-card__power">⚔ {power}</span>
        </div>
        <strong className="lw-legion-card__word">{soldier.word}</strong>
        <span className="lw-legion-card__meaning">{soldier.meaning}</span>
        <div className="lw-legion-card__footer">
          <span className="lw-legion-card__lv">Lv{soldier.syllables}{verbBonus}</span>
          <span className="lw-legion-card__stars" title="经验值">
            {'★'.repeat(soldier.familiarity)}
            {'☆'.repeat(Math.max(0, 5 - soldier.familiarity))}
          </span>
        </div>
      </div>
    </article>
  )
}

export function WordBankFloatPanel({ soldiers, onClose }: WordBankFloatPanelProps) {
  const [raceFilter, setRaceFilter] = useState<RaceFilter>('all')
  const [detail, setDetail] = useState<SoldierView | null>(null)

  const { squads, totalPower, ranked, raceCounts } = useMemo(() => {
    const withPower: SoldierView[] = soldiers.map((soldier) => {
      const race = resolveSoldierRace(soldier)
      return {
        soldier,
        race,
        power: soldierPower(soldier, race),
      }
    })

    const ranked = [...withPower].sort(
      (a, b) => b.power - a.power || a.soldier.word.localeCompare(b.soldier.word),
    )

    const byPos = new Map<PartOfSpeech, SoldierView[]>()
    for (const item of ranked) {
      const list = byPos.get(item.race) ?? []
      list.push(item)
      byPos.set(item.race, list)
    }

    const squads: SquadView[] = SQUAD_ORDER
      .filter((pos) => byPos.has(pos))
      .map((pos) => {
        const squadSoldiers = byPos.get(pos) ?? []
        const squadTotalPower = roundPower(squadSoldiers.reduce((sum, s) => sum + s.power, 0))
        return { pos, soldiers: squadSoldiers, totalPower: squadTotalPower }
      })
      .sort((a, b) => b.totalPower - a.totalPower)

    const totalPower = roundPower(ranked.reduce((sum, s) => sum + s.power, 0))

    const raceCounts = {
      all: soldiers.length,
      noun: byPos.get('noun')?.length ?? 0,
      verb: byPos.get('verb')?.length ?? 0,
      adjective: byPos.get('adjective')?.length ?? 0,
      adverb: byPos.get('adverb')?.length ?? 0,
      prep: byPos.get('prep')?.length ?? 0,
      pronoun: byPos.get('pronoun')?.length ?? 0,
    } satisfies Record<RaceFilter, number>

    return { squads, totalPower, ranked, raceCounts }
  }, [soldiers])

  const visibleSquads =
    raceFilter === 'all' ? squads : squads.filter((squad) => squad.pos === raceFilter)

  const visibleRanked =
    raceFilter === 'all'
      ? ranked
      : ranked.filter((item) => item.race === raceFilter)

  const filteredPower = roundPower(visibleRanked.reduce((sum, s) => sum + s.power, 0))

  const summaryText =
    raceFilter === 'all'
      ? `${soldiers.length} 名战士 · 总战斗力 ${totalPower}`
      : `${raceCounts[raceFilter]} 名 · ${POS_RACE[raceFilter].race} · 战力 ${filteredPower}`

  return (
    <>
      <div
        className="lw-wordbank-overlay"
        onClick={() => {
          if (!detail) onClose()
        }}
      >
      <dialog
        className="lw-wordbank-panel lw-legion-modal"
        open
        aria-label="我的军团"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lw-wordbank-head">
          <div>
            <h2 className="lw-wordbank-title">我的军团</h2>
            <p className="lw-wordbank-sub">{summaryText}</p>
          </div>
          <button type="button" className="lw-wordbank-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="lw-legion-filters" role="tablist" aria-label="种族筛选">
          <button
            type="button"
            role="tab"
            aria-selected={raceFilter === 'all'}
            className={`lw-legion-filter${raceFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setRaceFilter('all')}
          >
            全部
            <span className="lw-legion-filter__count">{raceCounts.all}</span>
          </button>
          {SIX_RACES.map((pos) => {
            const race = POS_RACE[pos]
            return (
              <button
                key={pos}
                type="button"
                role="tab"
                aria-selected={raceFilter === pos}
                className={`lw-legion-filter${raceFilter === pos ? ' is-active' : ''}`}
                style={{ '--race-color': race.color } as CSSProperties}
                onClick={() => setRaceFilter(pos)}
              >
                <span className="lw-legion-filter__icon" aria-hidden="true">
                  <RaceIcon pos={pos} size={24} />
                </span>
                <span className="lw-legion-filter__label">{race.race}</span>
                <span className="lw-legion-filter__count">{raceCounts[pos]}</span>
              </button>
            )
          })}
        </div>

        <div className="lw-wordbank-body">
          {visibleSquads.length === 0 ? (
            <p className="lw-legion-empty">该种族暂无战士</p>
          ) : (
            visibleSquads.map((squad) => {
              const race = POS_RACE[squad.pos]
              return (
                <section key={squad.pos} className="lw-wordbank-squad">
                  <header className="lw-wordbank-squad__head">
                    <span className="lw-wordbank-squad__icon" aria-hidden="true">
                      <RaceIcon pos={squad.pos} size={28} />
                    </span>
                    <div className="lw-wordbank-squad__meta">
                      <strong>{race.race}</strong>
                      <span>编队 · {squad.soldiers.length} 人</span>
                    </div>
                    <span className="lw-wordbank-squad__power">战力 {squad.totalPower}</span>
                  </header>
                  <div className="lw-legion-grid">
                    {squad.soldiers.map(({ soldier, power, race }, index) => (
                      <SoldierCard
                        key={soldier.wordId}
                        soldier={soldier}
                        power={power}
                        rank={index + 1}
                        race={race}
                        onSelect={() => setDetail({ soldier, power, race })}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </dialog>
      </div>
      {detail && (
        <LegionWordDetailModal
          soldier={detail.soldier}
          race={detail.race}
          power={detail.power}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  )
}
