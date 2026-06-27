import { useMemo, useRef, useState } from 'react'
import { buildMeaningOptions, type MeaningOption } from '../../domain/quiz'
import { POS_RACE } from '../../types'
import type { GameProps } from '../types'

export interface FlashcardConfig {
  /** 自定义提问语 */
  prompt?: string
}

/** 闪卡认词：逐词四选一选释义 */
export function FlashcardGame({ context, config, onComplete }: GameProps<FlashcardConfig>) {
  const { words, distractors } = context
  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const correct = useRef<string[]>([])
  const wrong = useRef<string[]>([])
  const wrongThisCard = useRef(false)

  const current = words[idx]
  const options = useMemo<MeaningOption[]>(
    () => (current ? buildMeaningOptions(current, [...words, ...distractors]) : []),
    [current, words, distractors],
  )

  if (!current) return null

  const finish = () => {
    onComplete({
      cleared: wrong.current.length === 0,
      correctWords: correct.current,
      wrongWords: wrong.current,
      score: words.length ? correct.current.length / words.length : 1,
    })
  }

  const handlePick = (opt: MeaningOption) => {
    if (feedback) return
    if (opt.correct) {
      setFeedback('right')
      if (!wrongThisCard.current) correct.current.push(current.word)
      setTimeout(() => {
        setFeedback(null)
        wrongThisCard.current = false
        if (idx + 1 >= words.length) finish()
        else setIdx((i) => i + 1)
      }, 600)
    } else {
      wrongThisCard.current = true
      if (!wrong.current.includes(current.word)) wrong.current.push(current.word)
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 600)
    }
  }

  return (
    <div className="cp-stage">
      <p className="cp-stage-step">认词 {idx + 1} / {words.length}</p>
      <div className="cp-quiz-word">
        <span className="cp-quiz-en">{current.word}</span>
        <span className="cp-quiz-race">
          {POS_RACE[current.partOfSpeech].race} · Lv{current.syllables}
        </span>
      </div>
      <p className="cp-quiz-ask">{config?.prompt ?? '选出正确的中文意思'}</p>
      <div className="cp-options">
        {options.map((opt) => (
          <button key={opt.text} type="button" className="cp-option" onClick={() => handlePick(opt)}>
            {opt.text}
          </button>
        ))}
      </div>
      {feedback === 'right' && <p className="cp-fb cp-fb--right">认对了！</p>}
      {feedback === 'wrong' && <p className="cp-fb cp-fb--wrong">再试一次。</p>}
    </div>
  )
}
