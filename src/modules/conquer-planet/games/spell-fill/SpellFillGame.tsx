import { useMemo, useRef, useState } from 'react'
import { POS_RACE } from '../../types'
import type { GameProps, GameWord } from '../types'
import '../games.css'

export interface SpellFillConfig {
  /** 使用哪组挖空位，默认 captured（2-3 空）；无则自动挖中间字母 */
  slot?: 'captured' | 'own'
  /** 自动挖空时的空位数，默认 2 */
  autoBlanks?: number
}

function resolveBlanks(word: GameWord, slot: 'captured' | 'own', autoBlanks: number): number[] {
  const slots = slot === 'own' ? word.keySlots?.own : word.keySlots?.captured
  if (slots && slots.length > 0) return [...slots].sort((a, b) => a - b)

  const len = word.word.length
  if (len <= 2) return [Math.max(0, len - 1)]
  const candidates: number[] = []
  for (let i = 1; i < len - 1; i++) candidates.push(i)
  const count = Math.min(autoBlanks, candidates.length)
  const start = Math.floor((candidates.length - count) / 2)
  return candidates.slice(start, start + count)
}

/** 拼写挖空：补全单词中缺失的 2-3 个字母 */
export function SpellFillGame({ context, config, onComplete }: GameProps<SpellFillConfig>) {
  const slot = config?.slot ?? 'captured'
  const autoBlanks = config?.autoBlanks ?? 2
  const words = context.words

  const [idx, setIdx] = useState(0)
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const correct = useRef<string[]>([])
  const wrong = useRef<string[]>([])
  const wrongThisWord = useRef(false)

  const current = words[idx]
  const blanks = useMemo(
    () => (current ? resolveBlanks(current, slot, autoBlanks) : []),
    [current, slot, autoBlanks],
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

  const advance = () => {
    setFeedback(null)
    setInputs({})
    wrongThisWord.current = false
    if (idx + 1 >= words.length) finish()
    else setIdx((i) => i + 1)
  }

  const submit = () => {
    if (feedback) return
    const ok = blanks.every(
      (i) => (inputs[i] ?? '').toLowerCase() === current.word[i].toLowerCase(),
    )
    if (ok) {
      setFeedback('right')
      if (!wrongThisWord.current) correct.current.push(current.word)
      setTimeout(advance, 800)
    } else {
      wrongThisWord.current = true
      if (!wrong.current.includes(current.word)) wrong.current.push(current.word)
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 1000)
    }
  }

  return (
    <div className="cp-stage">
      <p className="cp-stage-step">拼写 {idx + 1} / {words.length}</p>
      <div className="cp-quiz-word">
        <span className="cp-quiz-race">
          {POS_RACE[current.partOfSpeech].race} · {current.meaning}
        </span>
      </div>
      <p className="cp-quiz-ask">补全缺失的字母：</p>
      <div className="cp-spell-row">
        {current.word.split('').map((ch, i) =>
          blanks.includes(i) ? (
            <input
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="cp-spell-slot"
              maxLength={1}
              value={inputs[i] ?? ''}
              onChange={(e) => setInputs((prev) => ({ ...prev, [i]: e.target.value.slice(-1) }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          ) : (
            // eslint-disable-next-line react/no-array-index-key
            <span key={i} className="cp-spell-fixed">{ch}</span>
          ),
        )}
      </div>
      <button type="button" className="cp-btn cp-btn--primary" onClick={submit}>
        提交
      </button>
      {feedback === 'right' && <p className="cp-fb cp-fb--right">拼对了！</p>}
      {feedback === 'wrong' && (
        <p className="cp-fb cp-fb--wrong">拼写有误，正确答案：{current.word}</p>
      )}
    </div>
  )
}
