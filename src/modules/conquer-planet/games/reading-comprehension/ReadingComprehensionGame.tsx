import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generateWordlistReading } from '../../api'
import {
  ReadingPassagePanel,
  ReadingQuizPanel,
  type ReadingPassageData,
} from '../../../learning/components/ReadingPassageQuiz'
import type { GameProps, GameWord } from '../types'
import '../../../learning/readingPassage.css'

export interface ReadingComprehensionConfig {
  /** 至少答对几题才算通过，默认 2 */
  passScore?: number
}

const MIN_WORDS = 5

function buildWordPayload(words: GameWord[]) {
  return words.map((item) => ({
    word: item.word,
    meaning: item.meaning,
    pos: item.partOfSpeech,
    exampleEn: item.sentence,
    exampleZh: item.sentenceZh,
  }))
}

function buildReadingPool(words: GameWord[], distractors: GameWord[]): GameWord[] {
  const seen = new Set<string>()
  const pool: GameWord[] = []
  for (const item of [...words, ...distractors]) {
    const key = item.word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    pool.push(item)
  }
  return pool
}

/** 阅读短文：用本关词表生成短文 + 3 道选择题，答对 passScore 题通过 */
export function ReadingComprehensionGame({
  context,
  config,
  onComplete,
}: GameProps<ReadingComprehensionConfig>) {
  const passScore = config?.passScore ?? 2
  const wordPool = useMemo(
    () => buildReadingPool(context.words, context.distractors),
    [context.words, context.distractors],
  )

  const [reading, setReading] = useState<ReadingPassageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showZh, setShowZh] = useState(false)
  const requestSeqRef = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeqRef.current
    setLoading(true)
    setError('')
    setReading(null)
    setShowZh(false)
    try {
      const { reading: nextReading } = await generateWordlistReading(buildWordPayload(wordPool))
      if (seq !== requestSeqRef.current) return
      setReading(nextReading)
    } catch (err) {
      if (seq !== requestSeqRef.current) return
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试')
    } finally {
      if (seq === requestSeqRef.current) setLoading(false)
    }
  }, [wordPool])

  useEffect(() => {
    if (wordPool.length < MIN_WORDS) return
    void load()
  }, [load, wordPool.length])

  if (wordPool.length < MIN_WORDS) {
    return (
      <div className="cp-stage">
        <p className="cp-level-empty">词量不足，无法生成阅读短文（至少需要 {MIN_WORDS} 个单词）。</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="cp-stage">
        <p className="cp-stage-step">📖 阅读短文</p>
        <p className="cp-stage-text">正在根据本关单词生成阅读材料…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cp-stage">
        <p className="cp-stage-step">📖 阅读短文</p>
        <div className="lw-wordlist-reading__error">
          <p>{error}</p>
          <button type="button" className="cp-btn" onClick={() => void load()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!reading) return null

  return (
    <div className="cp-stage lw-wordlist-reading__body">
      <p className="cp-stage-step">📖 阅读短文 · 答对至少 {passScore} / {reading.questions.length} 题</p>
      {reading.source === 'fallback' ? (
        <p className="lw-wordlist-reading__notice">AI 暂不可用，已使用例句拼接生成备用短文。</p>
      ) : null}
      <ReadingPassagePanel
        reading={reading}
        showZh={showZh}
        onToggleZh={() => setShowZh((value) => !value)}
      />
      <ReadingQuizPanel
        key={reading.passageEn}
        questions={reading.questions}
        passScore={passScore}
        onComplete={({ score, passed }) => {
          if (!passed) return
          onComplete({
            cleared: true,
            correctWords: reading.usedWords,
            wrongWords: [],
            score: score / reading.questions.length,
            stats: { correctCount: score, totalQuestions: reading.questions.length },
          })
        }}
      />
    </div>
  )
}
