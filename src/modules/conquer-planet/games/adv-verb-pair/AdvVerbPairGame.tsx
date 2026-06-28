import { useMemo, useRef, useState } from 'react'
import { shuffle } from '../../domain/quiz'
import type { GameProps } from '../types'

export interface AdvVerbPair {
  verb: string
  adverb: string
  verbHint?: string
  adverbHint?: string
}

export interface AdvVerbPairConfig {
  /** 配对轮数，默认全部 */
  rounds?: number
}

function buildAdverbOptions(
  correct: string,
  pool: string[],
  size = 4,
): string[] {
  const distractors = shuffle(pool.filter((a) => a !== correct))
  return shuffle([correct, ...distractors.slice(0, size - 1)])
}

/** 副词 + 动词搭配：为动词选择合适副词 */
export function AdvVerbPairGame({ context, config, onComplete }: GameProps<AdvVerbPairConfig>) {
  const pairs = (context.meta?.pairs as AdvVerbPair[] | undefined) ?? []
  const rounds = config?.rounds ?? pairs.length
  const queue = useMemo(() => shuffle(pairs).slice(0, Math.min(rounds, pairs.length)), [pairs, rounds])
  const adverbPool = useMemo(
    () => [...new Set([...pairs.map((p) => p.adverb), ...context.distractors.map((d) => d.word)])],
    [pairs, context.distractors],
  )

  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const correct = useRef<string[]>([])
  const wrong = useRef<string[]>([])

  const current = queue[idx]
  const options = useMemo(
    () => (current ? buildAdverbOptions(current.adverb, adverbPool) : []),
    [current, adverbPool],
  )

  if (!current || queue.length === 0) {
    return <p className="cp-level-empty">暂无动词搭配题，请稍后再试。</p>
  }

  const finish = () => {
    onComplete({
      cleared: wrong.current.length === 0,
      correctWords: correct.current,
      wrongWords: wrong.current,
      score: queue.length ? correct.current.length / queue.length : 1,
    })
  }

  const handlePick = (adverb: string) => {
    if (feedback) return
    if (adverb === current.adverb) {
      setFeedback('right')
      if (!correct.current.includes(current.verb)) correct.current.push(current.verb)
      setTimeout(() => {
        setFeedback(null)
        if (idx + 1 >= queue.length) finish()
        else setIdx((i) => i + 1)
      }, 600)
    } else {
      setFeedback('wrong')
      if (!wrong.current.includes(current.verb)) wrong.current.push(current.verb)
      setTimeout(() => setFeedback(null), 600)
    }
  }

  return (
    <div className="cp-stage">
      <p className="cp-stage-step">搭配 {idx + 1} / {queue.length}</p>
      <div className="cp-quiz-word">
        <span className="cp-quiz-en">{current.verb}</span>
        {current.verbHint && <span className="cp-quiz-race">{current.verbHint}</span>}
      </div>
      <p className="cp-quiz-ask">选出能修饰该动词的副词</p>
      <div className="cp-options">
        {options.map((adverb) => (
          <button key={adverb} type="button" className="cp-option" onClick={() => handlePick(adverb)}>
            {adverb}
          </button>
        ))}
      </div>
      {feedback === 'right' && <p className="cp-fb cp-fb--right">搭配正确！</p>}
      {feedback === 'wrong' && <p className="cp-fb cp-fb--wrong">再想想，哪个副词更合适？</p>}
    </div>
  )
}
