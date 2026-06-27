import type { PlanetWord } from '../types'
import { POS_RACE } from '../types'

interface WordChipProps {
  word: PlanetWord
  familiarity?: number
  showMeaning?: boolean
  onClick?: () => void
  selected?: boolean
}

export function WordChip({ word, familiarity, showMeaning, onClick, selected }: WordChipProps) {
  const race = POS_RACE[word.partOfSpeech]
  return (
    <button
      type="button"
      className={`cp-chip${selected ? ' cp-chip--selected' : ''}${onClick ? '' : ' cp-chip--static'}`}
      onClick={onClick}
      disabled={!onClick}
      style={{ borderColor: race.color }}
    >
      <span className="cp-chip-dot" style={{ background: race.color }} />
      <span className="cp-chip-word">{word.word}</span>
      <span className="cp-chip-lv">Lv{word.syllables}</span>
      {showMeaning && <span className="cp-chip-meaning">{word.meaning}</span>}
      {typeof familiarity === 'number' && (
        <span className="cp-chip-exp" title="经验值">
          {'★'.repeat(familiarity)}
          {'☆'.repeat(Math.max(0, 5 - familiarity))}
        </span>
      )}
    </button>
  )
}
