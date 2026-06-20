import { useEffect, useMemo, useState } from 'react'
import type { VocabQuizOption, VocabWord } from './types'
import { speakEnglish } from './speak'
import { getSpeakableWord, VocabWordHeadline } from './VocabWordHeadline'

interface VocabQuizCardProps {
  word: VocabWord
  options: VocabQuizOption[]
  index: number
  total: number
  onAnswer: (correct: boolean) => void
}

export function VocabQuizCard({
  word,
  options,
  index,
  total,
  onAnswer,
}: VocabQuizCardProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const speakWord = getSpeakableWord(word.word, word)

  useEffect(() => {
    setSelectedId(null)
    setAnswered(false)
    const timer = window.setTimeout(() => speakEnglish(speakWord), 200)
    return () => window.clearTimeout(timer)
  }, [word.id, speakWord])

  const shuffled = useMemo(
    () => [...options].sort(() => Math.random() - 0.5),
    [options, word.id],
  )

  const handleSelect = (option: VocabQuizOption) => {
    if (answered) return
    setSelectedId(option.id)
    setAnswered(true)
    onAnswer(option.isCorrect)
  }

  const handleReplay = () => speakEnglish(speakWord)

  return (
    <div className="vocab-quiz-card">
      <div className="vocab-quiz-head">
        <div className="vocab-quiz-word-row">
          <VocabWordHeadline rawWord={word.word} frequencySource={word} className="vocab-card-word" />
          <button
            type="button"
            className="vocab-audio-button vocab-audio-button-inline"
            onClick={handleReplay}
            aria-label="听发音"
          >
            🔊
          </button>
        </div>
        <span className="vocab-card-badge">
          测试 {index + 1} / {total}
        </span>
      </div>

      {word.phonetic && <p className="vocab-card-phonetic">{word.phonetic}</p>}

      <div className="vocab-quiz-options">
        {shuffled.map((option) => {
          const isSelected = selectedId === option.id
          const className = [
            'vocab-quiz-option',
            answered && option.isCorrect ? 'is-correct' : '',
            answered && isSelected && !option.isCorrect ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={option.id}
              type="button"
              className={className}
              disabled={answered}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
