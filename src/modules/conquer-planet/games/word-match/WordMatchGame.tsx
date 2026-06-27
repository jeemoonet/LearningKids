import { useMemo, useRef, useState } from 'react'
import { shuffle } from '../../domain/quiz'
import type { GameProps, GameWord } from '../types'
import '../games.css'

export interface WordMatchConfig {
  /** 每组配对词数，默认 min(5, 词数) */
  groupSize?: number
}

/** 词义连线：先点单词、再点对应中文意思完成配对 */
export function WordMatchGame({ context, config, onComplete }: GameProps<WordMatchConfig>) {
  const groupSize = config?.groupSize ?? Math.min(5, context.words.length)
  const group = useMemo(
    () => shuffle(context.words).slice(0, groupSize),
    [context.words, groupSize],
  )
  const meanings = useMemo(() => shuffle(group), [group])

  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(() => new Set())
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null)
  const correct = useRef<string[]>([])
  const wrong = useRef<string[]>([])

  const finish = (m: Set<string>) => {
    onComplete({
      cleared: wrong.current.length === 0,
      correctWords: correct.current,
      wrongWords: wrong.current,
      score: group.length ? m.size / group.length : 1,
    })
  }

  const pickMeaning = (target: GameWord) => {
    if (!selectedWord || matched.has(target.id) || flash) return
    if (selectedWord === target.id) {
      if (!wrong.current.includes(target.word)) correct.current.push(target.word)
      const next = new Set(matched).add(target.id)
      setMatched(next)
      setFlash({ id: target.id, ok: true })
      setSelectedWord(null)
      setTimeout(() => {
        setFlash(null)
        if (next.size >= group.length) finish(next)
      }, 400)
    } else {
      const picked = group.find((w) => w.id === selectedWord)
      if (picked && !wrong.current.includes(picked.word)) wrong.current.push(picked.word)
      setFlash({ id: target.id, ok: false })
      setTimeout(() => setFlash(null), 400)
    }
  }

  return (
    <div className="cp-stage">
      <p className="cp-stage-step">连线配对 {matched.size} / {group.length}</p>
      <p className="cp-quiz-ask">先点单词，再点对应的中文意思</p>
      <div className="cp-match-grid">
        <div className="cp-match-col">
          {group.map((w) => (
            <button
              key={w.id}
              type="button"
              className={[
                'cp-match-chip',
                selectedWord === w.id ? 'cp-match-chip--active' : '',
                matched.has(w.id) ? 'cp-match-chip--done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={matched.has(w.id)}
              onClick={() => setSelectedWord(w.id)}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="cp-match-col">
          {meanings.map((w) => (
            <button
              key={w.id}
              type="button"
              className={[
                'cp-match-chip',
                matched.has(w.id) ? 'cp-match-chip--done' : '',
                flash?.id === w.id ? (flash.ok ? 'cp-match-chip--ok' : 'cp-match-chip--bad') : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={matched.has(w.id)}
              onClick={() => pickMeaning(w)}
            >
              {w.meaning}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
