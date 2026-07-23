import { useEffect, useMemo, useState } from 'react'
import { VocabTranslateButton } from '../../vocab-training/VocabTranslateButton'
import { splitPassageByWords } from '../../vocab-training/passageAudio'
import { speakEnglish, EXAMPLE_SPEECH_RATE } from '../../vocab-training/speak'
import '../readingPassage.css'

export interface ReadingQuestionOption {
  id: number
  label: string
  isCorrect: boolean
}

export interface ReadingQuestion {
  id: number
  stem: string
  options: ReadingQuestionOption[]
}

export interface ReadingPassageData {
  passageEn: string
  passageZh: string
  wordCount: number
  usedWords: string[]
  questions: ReadingQuestion[]
  source: 'llm' | 'fallback'
}

export function ReadingPassagePanel({
  reading,
  showZh,
  onToggleZh,
}: {
  reading: ReadingPassageData
  showZh: boolean
  onToggleZh: () => void
}) {
  const segments = useMemo(
    () => splitPassageByWords(reading.passageEn, reading.usedWords),
    [reading.passageEn, reading.usedWords],
  )

  return (
    <div className="lw-wordlist-reading__passage">
      <div className="lw-wordlist-reading__passage-head">
        <span className="lw-wordlist-reading__passage-meta">
          约 {reading.wordCount} 词 · 使用 {reading.usedWords.length} 个单词
        </span>
        <div className="lw-wordlist-reading__passage-actions">
          {reading.passageZh.trim() ? (
            <VocabTranslateButton show={showZh} onToggle={onToggleZh} />
          ) : null}
          <button
            type="button"
            className="lw-wordlist-reading__speak"
            onClick={() => speakEnglish(reading.passageEn, EXAMPLE_SPEECH_RATE)}
            aria-label="朗读短文"
          >
            🔊
          </button>
        </div>
      </div>
      <p className="lw-wordlist-reading__passage-en">
        {segments.map((segment, index) =>
          segment.highlight ? (
            <mark key={index} className="lw-wordlist-reading__highlight">
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
      {showZh && reading.passageZh.trim() ? (
        <p className="lw-wordlist-reading__passage-zh">{reading.passageZh}</p>
      ) : null}
    </div>
  )
}

export function ReadingQuizPanel({
  questions,
  passScore,
  onComplete,
}: {
  questions: ReadingQuestion[]
  /** 设定后须达到该分数才算通过；未设定则答完即回调 */
  passScore?: number
  onComplete: (result: { score: number; passed: boolean }) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [round, setRound] = useState(0)

  const question = questions[index]
  const picked = question ? (answers[question.id] ?? null) : null

  const score = useMemo(() => {
    return questions.reduce((total, item) => {
      const pickedId = answers[item.id]
      if (pickedId == null) return total
      const option = item.options.find((opt) => opt.id === pickedId)
      return total + (option?.isCorrect ? 1 : 0)
    }, 0)
  }, [answers, questions])

  const allAnswered = questions.every((item) => answers[item.id] != null)
  const passed = passScore == null ? true : score >= passScore

  useEffect(() => {
    if (!allAnswered) return
    if (passScore == null || passed) {
      onComplete({ score, passed: true })
    }
  }, [allAnswered, onComplete, passScore, passed, score])

  const pick = (optId: number, isCorrect: boolean) => {
    if (!question || allAnswered) return
    setAnswers((prev) => ({ ...prev, [question.id]: optId }))

    if (isCorrect && index < questions.length - 1) {
      window.setTimeout(() => {
        setIndex((value) => Math.min(questions.length - 1, value + 1))
      }, 2000)
    }
  }

  const retry = () => {
    setAnswers({})
    setIndex(0)
    setRound((value) => value + 1)
  }

  const goPrev = () => setIndex((value) => Math.max(0, value - 1))
  const goNext = () => setIndex((value) => Math.min(questions.length - 1, value + 1))

  if (!question) return null

  return (
    <div className="lw-wordlist-reading__quiz" key={round}>
      <div className="lw-wordlist-reading__quiz-nav">
        <button
          type="button"
          className="lw-wordlist-reading__quiz-nav-btn"
          onClick={goPrev}
          disabled={index === 0 || allAnswered}
          aria-label="上一题"
        >
          ↑ 上一题
        </button>
        <span className="lw-wordlist-reading__quiz-counter">
          Question {index + 1} / {questions.length}
        </span>
        <button
          type="button"
          className="lw-wordlist-reading__quiz-nav-btn"
          onClick={goNext}
          disabled={index >= questions.length - 1 || allAnswered}
          aria-label="下一题"
        >
          下一题 ↓
        </button>
      </div>
      <h3 className="lw-wordlist-reading__quiz-stem">{question.stem}</h3>
      <div className="lw-wordlist-reading__quiz-options">
        {question.options.map((opt) => {
          const state =
            picked === null
              ? ''
              : opt.isCorrect
                ? ' is-correct'
                : picked === opt.id
                  ? ' is-wrong'
                  : ''
          return (
            <button
              key={opt.id}
              type="button"
              className={`lw-wordlist-reading__quiz-option${state}`}
              onClick={() => pick(opt.id, opt.isCorrect)}
              disabled={allAnswered}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {allAnswered ? (
        <p className="lw-wordlist-reading__quiz-result">
          得分：{score} / {questions.length}
          {passScore != null ? `（需答对至少 ${passScore} 题）` : ''}
        </p>
      ) : null}
      {allAnswered && passScore != null && !passed ? (
        <div className="lw-wordlist-reading__quiz-fail">
          <p className="lw-wordlist-reading__quiz-fail-msg">
            还差 {passScore - score} 题，请再试一次。
          </p>
          <button type="button" className="cp-btn" onClick={retry}>
            重新答题
          </button>
        </div>
      ) : null}
    </div>
  )
}
