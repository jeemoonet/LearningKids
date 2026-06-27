import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSentenceQuiz, type SentenceQuiz } from '../../domain/quiz'
import type { GameProps } from '../types'

export interface SentenceClozeConfig {
  /** 造句题目数量，默认 min(3, 可用词数) */
  tasks?: number
}

/** 选词造句：从候选词中选出正确单词，完成例句填空 */
export function SentenceClozeGame({ context, config, onComplete }: GameProps<SentenceClozeConfig>) {
  const { words, distractors } = context

  const playable = useMemo(
    () => words.filter((w) => w.sentence?.includes('___')),
    [words],
  )
  const taskCount = config?.tasks ?? Math.min(3, playable.length)
  const tasks = useMemo<SentenceQuiz[]>(() => {
    if (playable.length === 0) return []
    const pool = [...words, ...distractors]
    return Array.from({ length: taskCount }, (_, i) =>
      buildSentenceQuiz(playable[i % playable.length], pool),
    )
  }, [playable, words, distractors, taskCount])

  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const correct = useRef<string[]>([])
  const wrong = useRef<string[]>([])
  const wrongThisTask = useRef(false)

  // 无可玩任务（无例句）时直接判过，避免卡关
  useEffect(() => {
    if (tasks.length === 0) {
      onComplete({ cleared: true, correctWords: [], wrongWords: [] })
    }
  }, [tasks.length, onComplete])

  const task = tasks[idx]
  if (!task) return null

  const finish = () => {
    onComplete({
      cleared: wrong.current.length === 0,
      correctWords: correct.current,
      wrongWords: wrong.current,
      score: tasks.length ? correct.current.length / tasks.length : 1,
    })
  }

  const handle = (isCorrect: boolean) => {
    if (feedback) return
    const w = task.word.word
    if (isCorrect) {
      setFeedback('right')
      if (!wrongThisTask.current) correct.current.push(w)
      setTimeout(() => {
        setFeedback(null)
        wrongThisTask.current = false
        if (idx + 1 >= tasks.length) finish()
        else setIdx((i) => i + 1)
      }, 600)
    } else {
      wrongThisTask.current = true
      if (!wrong.current.includes(w)) wrong.current.push(w)
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 600)
    }
  }

  return (
    <div className="cp-stage">
      <p className="cp-stage-step">造句训练 {idx + 1} / {tasks.length}</p>
      <p className="cp-quiz-ask">把正确的词填进句子里：</p>
      <div className="cp-sentence">
        <span>{task.parts[0]}</span>
        <span className="cp-sentence-blank">_____</span>
        <span>{task.parts[1]}</span>
      </div>
      <p className="cp-sentence-zh">{task.word.sentenceZh}</p>
      <div className="cp-options cp-options--inline">
        {task.options.map((opt) => (
          <button key={opt.word} type="button" className="cp-option" onClick={() => handle(opt.correct)}>
            {opt.word}
          </button>
        ))}
      </div>
      {feedback === 'right' && <p className="cp-fb cp-fb--right">很好！</p>}
      {feedback === 'wrong' && <p className="cp-fb cp-fb--wrong">不对，再想想。</p>}
    </div>
  )
}
