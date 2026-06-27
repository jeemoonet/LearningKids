import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SENTENCE_CHALLENGE_QUESTION_SECONDS,
  SENTENCE_EXAM_QUESTION_SECONDS,
} from '../../constants'
import { HighlightVerbs } from '../../lib/highlightVerbs'
import { EXAMPLE_SPEECH_RATE, speakEnglish, stopSpeaking } from '../vocab-training/speak'
import type { SentenceLevel, SentenceQuestion } from './types'
import { getFilledSentence, getWrongAnswerReason } from './sentenceGameUi'
import { recordSentenceResult } from './progress'

type ChallengePhase = 'ready' | 'running' | 'done'
type QuestionPhase = 'answering' | 'retry' | 'advancing'

const BLANK_ID = 'sentence-blank'

const ROLE_COLORS: Record<string, string> = {
  主语: 'role-subject',
  谓语: 'role-predicate',
  宾语: 'role-object',
  定语: 'role-attributive',
  状语: 'role-adverbial',
  补语: 'role-complement',
}

interface OptionChip {
  id: string
  label: string
}

type ChipLocation = 'bank' | typeof BLANK_ID

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function buildChips(question: SentenceQuestion): OptionChip[] {
  return shuffleArray(
    question.options.map((label, index) => ({
      id: `${question.id}-chip-${index}`,
      label,
    })),
  )
}

function splitSentence(sentence: string): { before: string; after: string } {
  const marker = '______'
  const index = sentence.indexOf(marker)
  if (index < 0) return { before: sentence, after: '' }
  return {
    before: sentence.slice(0, index),
    after: sentence.slice(index + marker.length),
  }
}

function isCorrectLabel(label: string, answer: string): boolean {
  return label.toLowerCase() === answer.toLowerCase()
}

function questionDrawKey(question: SentenceQuestion): string {
  return `${question.sentence}|${question.answer}`
}

function formatElapsedSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} 秒`
  if (seconds === 0) return `${minutes} 分`
  return `${minutes} 分 ${seconds} 秒`
}

interface SentenceChallengeModeProps {
  level: SentenceLevel
  questions: SentenceQuestion[]
  ruleSummary: string
  isBoss?: boolean
  onBack: () => void
  onComplete: () => void
  onRegenerateQuestions: (excludeKeys?: string[]) => Promise<SentenceQuestion[]>
}

export function SentenceChallengeMode({
  level,
  questions,
  ruleSummary,
  isBoss = false,
  onBack,
  onComplete,
  onRegenerateQuestions,
}: SentenceChallengeModeProps) {
  const [phase, setPhase] = useState<ChallengePhase>('ready')
  const [roundQuestions, setRoundQuestions] = useState(questions)
  const [regenerating, setRegenerating] = useState(false)
  const questionSeconds = isBoss ? SENTENCE_EXAM_QUESTION_SECONDS : SENTENCE_CHALLENGE_QUESTION_SECONDS
  const roundCount = roundQuestions.length
  const [questionLeft, setQuestionLeft] = useState(questionSeconds)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<SentenceQuestion | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [questionPhase, setQuestionPhase] = useState<QuestionPhase>('answering')
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [firstAttemptCorrect, setFirstAttemptCorrect] = useState<boolean | null>(null)

  const [chips, setChips] = useState<OptionChip[]>([])
  const [chipLocations, setChipLocations] = useState<Map<string, ChipLocation>>(() => new Map())
  const [draggingChipId, setDraggingChipId] = useState<string | null>(null)
  const [dragOverBlank, setDragOverBlank] = useState(false)
  const [lastWrongLabel, setLastWrongLabel] = useState<string | null>(null)

  const phaseRef = useRef(phase)
  const startTimeRef = useRef<number | null>(null)
  const questionPhaseRef = useRef(questionPhase)
  const currentQuestionRef = useRef(currentQuestion)
  const advanceTimerRef = useRef<number | null>(null)
  const questionIndexRef = useRef(questionIndex)
  const questionSecondsRef = useRef(questionSeconds)
  const questionsRef = useRef(roundQuestions)
  const answeredCountRef = useRef(answeredCount)

  phaseRef.current = phase
  questionPhaseRef.current = questionPhase
  currentQuestionRef.current = currentQuestion
  questionIndexRef.current = questionIndex
  questionSecondsRef.current = questionSeconds
  questionsRef.current = roundQuestions
  answeredCountRef.current = answeredCount

  const chipById = useMemo(() => new Map(chips.map((chip) => [chip.id, chip])), [chips])

  const bankChips = useMemo(
    () => chips.filter((chip) => chipLocations.get(chip.id) === 'bank'),
    [chips, chipLocations],
  )

  const filledChip = useMemo(() => {
    for (const [chipId, location] of chipLocations.entries()) {
      if (location === BLANK_ID) return chipById.get(chipId) ?? null
    }
    return null
  }, [chipLocations, chipById])

  const sentenceParts = useMemo(
    () => (currentQuestion ? splitSentence(currentQuestion.sentence) : { before: '', after: '' }),
    [currentQuestion],
  )

  const canDrag = questionPhase === 'answering' || questionPhase === 'retry'

  const filledIsCorrect = useMemo(() => {
    if (!currentQuestion || !filledChip) return false
    return isCorrectLabel(filledChip.label, currentQuestion.answer)
  }, [currentQuestion, filledChip])

  useEffect(() => {
    setRoundQuestions(questions)
    questionsRef.current = questions
  }, [questions])

  const resetQuestionState = useCallback((question: SentenceQuestion | null) => {
    if (!question) {
      setChips([])
      setChipLocations(new Map())
    } else {
      const nextChips = buildChips(question)
      const nextLocations = new Map<string, ChipLocation>()
      for (const chip of nextChips) {
        nextLocations.set(chip.id, 'bank')
      }
      setChips(nextChips)
      setChipLocations(nextLocations)
    }
    setDraggingChipId(null)
    setDragOverBlank(false)
    setLastWrongLabel(null)
    setQuestionPhase('answering')
    questionPhaseRef.current = 'answering'
    setFirstAttemptCorrect(null)
    setShowHint(false)
  }, [])

  const finishChallenge = useCallback(() => {
    if (phaseRef.current === 'done') return
    phaseRef.current = 'done'
    if (startTimeRef.current !== null) {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
      setTotalElapsedSeconds(elapsed)
      startTimeRef.current = null
    }
    setPhase('done')
    setCurrentQuestion(null)
    resetQuestionState(null)
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [resetQuestionState])

  const loadNextQuestion = useCallback(() => {
    const nextIndex = questionIndexRef.current + 1
    const activeQuestions = questionsRef.current

    if (nextIndex >= activeQuestions.length) {
      finishChallenge()
      return
    }

    const nextQuestion = activeQuestions[nextIndex]
    setQuestionIndex(nextIndex)
    setCurrentQuestion(nextQuestion)
    setQuestionLeft(questionSecondsRef.current)
    resetQuestionState(nextQuestion)
  }, [finishChallenge, resetQuestionState])

  const scheduleNextQuestion = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
    }

    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      if (phaseRef.current !== 'running') return
      loadNextQuestion()
    }, 1400)
  }, [loadNextQuestion])

  const proceedAfterQuestion = useCallback(() => {
    const question = currentQuestionRef.current
    if (question) {
      speakEnglish(getFilledSentence(question), EXAMPLE_SPEECH_RATE)
    }

    setQuestionPhase('advancing')
    questionPhaseRef.current = 'advancing'

    const totalAnswered = answeredCountRef.current
    if (totalAnswered >= roundCount) {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
      }
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null
        finishChallenge()
      }, 1400)
    } else {
      scheduleNextQuestion()
    }
  }, [roundCount, scheduleNextQuestion, finishChallenge])

  const scoreFirstAttempt = useCallback((correct: boolean) => {
    setFirstAttemptCorrect(correct)
    setShowHint(true)
    setAnsweredCount((current) => {
      const next = current + 1
      answeredCountRef.current = next
      return next
    })
    if (correct) {
      setCorrectCount((current) => current + 1)
    }
  }, [])

  const evaluatePlacement = useCallback(
    (chipLabel: string) => {
      const question = currentQuestionRef.current
      if (!question || phaseRef.current !== 'running') return

      const activePhase = questionPhaseRef.current
      if (activePhase === 'advancing') return

      const correct = isCorrectLabel(chipLabel, question.answer)

      if (activePhase === 'answering') {
        scoreFirstAttempt(correct)
        if (correct) {
          proceedAfterQuestion()
        } else {
          setLastWrongLabel(chipLabel)
          setQuestionPhase('retry')
          questionPhaseRef.current = 'retry'
        }
        return
      }

      if (activePhase === 'retry' && correct) {
        proceedAfterQuestion()
      } else if (activePhase === 'retry' && !correct) {
        setLastWrongLabel(chipLabel)
      }
    },
    [scoreFirstAttempt, proceedAfterQuestion],
  )

  const placeChipInBlank = useCallback(
    (chipId: string) => {
      if (questionPhaseRef.current === 'advancing' || !chipById.has(chipId)) return

      const chip = chipById.get(chipId)
      if (!chip) return

      setChipLocations((current) => {
        const next = new Map(current)

        for (const [existingChipId, location] of next.entries()) {
          if (location === BLANK_ID && existingChipId !== chipId) {
            next.set(existingChipId, 'bank')
          }
        }

        next.set(chipId, BLANK_ID)
        return next
      })

      evaluatePlacement(chip.label)
    },
    [chipById, evaluatePlacement],
  )

  const returnChipToBank = (chipId: string) => {
    if (!canDrag) return
    setChipLocations((current) => {
      const next = new Map(current)
      next.set(chipId, 'bank')
      return next
    })
  }

  const handleTimeout = useCallback(() => {
    if (
      !currentQuestionRef.current ||
      phaseRef.current !== 'running' ||
      questionPhaseRef.current !== 'answering'
    ) {
      return
    }

    scoreFirstAttempt(false)
    setQuestionPhase('retry')
    questionPhaseRef.current = 'retry'
  }, [scoreFirstAttempt])

  const handleDragStart = (chipId: string) => (event: React.DragEvent) => {
    if (!canDrag) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', chipId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingChipId(chipId)
  }

  const handleDragEnd = () => {
    setDraggingChipId(null)
    setDragOverBlank(false)
  }

  const handleBlankDragOver = (event: React.DragEvent) => {
    if (!canDrag) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverBlank(true)
  }

  const handleBlankDragLeave = () => {
    setDragOverBlank(false)
  }

  const handleBlankDrop = (event: React.DragEvent) => {
    if (!canDrag) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    placeChipInBlank(chipId)
    setDraggingChipId(null)
    setDragOverBlank(false)
  }

  const handleBankDragOver = (event: React.DragEvent) => {
    if (!canDrag) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleBankDrop = (event: React.DragEvent) => {
    if (!canDrag) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    returnChipToBank(chipId)
    setDraggingChipId(null)
  }

  const handleStart = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    const activeQuestions = questionsRef.current
    const firstQuestion = activeQuestions[0] ?? null
    setCorrectCount(0)
    setAnsweredCount(0)
    answeredCountRef.current = 0
    setQuestionIndex(0)
    questionIndexRef.current = 0
    startTimeRef.current = Date.now()
    setTotalElapsedSeconds(0)
    phaseRef.current = 'running'
    setPhase('running')
    setCurrentQuestion(firstQuestion)
    setQuestionLeft(questionSeconds)
    resetQuestionState(firstQuestion)
  }

  const regenerateAndRestart = async (autoStart: boolean) => {
    setRegenerating(true)
    try {
      const excludeKeys = roundQuestions.map(questionDrawKey)
      const nextQuestions = await onRegenerateQuestions(excludeKeys)
      if (nextQuestions.length === 0) return
      setRoundQuestions(nextQuestions)
      questionsRef.current = nextQuestions
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      startTimeRef.current = null
      setTotalElapsedSeconds(0)
      setQuestionIndex(0)
      questionIndexRef.current = 0
      setCorrectCount(0)
      setAnsweredCount(0)
      answeredCountRef.current = 0
      setQuestionLeft(questionSeconds)
      setCurrentQuestion(null)
      resetQuestionState(null)
      if (autoStart) {
        handleStart()
      } else {
        setPhase('ready')
        phaseRef.current = 'ready'
      }
    } finally {
      setRegenerating(false)
    }
  }

  useEffect(() => {
    if (phase !== 'running' || questionPhase !== 'answering' || !currentQuestion) return

    const timer = window.setInterval(() => {
      setQuestionLeft((current) => {
        if (current <= 1) {
          handleTimeout()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [phase, questionPhase, currentQuestion, handleTimeout])

  useEffect(
    () => () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
      }
      stopSpeaking()
    },
    [],
  )

  useEffect(() => {
    if (phase !== 'done') return
    recordSentenceResult(level.id, correctCount, roundCount)
  }, [phase, level.id, correctCount, roundCount])

  const currentNumber = questionIndex + 1
  const urgentThreshold = questionSeconds <= 20 ? 5 : 8
  const passed = correctCount >= roundCount
  const roleClass = currentQuestion
    ? ROLE_COLORS[currentQuestion.roleLabel] ?? 'role-default'
    : 'role-default'

  const blankShowsCorrect =
    firstAttemptCorrect === true || (questionPhase === 'retry' && filledIsCorrect)
  const blankShowsWrong = firstAttemptCorrect === false && !filledIsCorrect

  const blankStateClass = [
    'sentence-cloze-blank',
    dragOverBlank ? 'is-drag-over' : '',
    filledChip ? 'is-filled' : '',
    blankShowsCorrect ? 'is-correct' : '',
    blankShowsWrong ? 'is-wrong' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const getChipStateClass = (chip: OptionChip): string => {
    if (!currentQuestion || !showHint) return ''
    const isCorrectAnswer = isCorrectLabel(chip.label, currentQuestion.answer)
    const isSelected = filledChip?.id === chip.id
    if (isCorrectAnswer && (questionPhase === 'retry' || firstAttemptCorrect === true)) {
      return ' is-correct'
    }
    if (isSelected && firstAttemptCorrect === false && !filledIsCorrect) return ' is-wrong'
    return ''
  }

  const dragHint =
    questionPhase === 'advancing'
      ? '句子已完成，正在朗读并进入下一题…'
      : questionPhase === 'retry'
        ? '本题已记为错误，请拖入正确答案后继续'
        : '将词语拖入句中空白处'

  return (
    <section className="sentence-challenge sentence-challenge-pc">
      <div className="sentence-challenge-toolbar">
        <button type="button" className="module-back-button" onClick={onBack}>
          ← 返回关卡
        </button>
        <div className="sentence-challenge-level">
          <strong>{isBoss ? '综合闯关' : level.scene}</strong>
          <span>{ruleSummary}</span>
        </div>
      </div>

      {phase === 'ready' && (
        <div className="sentence-challenge-intro">
          <h2>{isBoss ? '综合闯关' : level.title}</h2>
          <p>
            共 {roundCount} 题，每题 {questionSeconds} 秒。把词拖入句子空白处，松手后立即判定。
          </p>
          <ul className="sentence-challenge-rules">
            <li>动词以红色显示；每题标注空格成分（主谓宾定状补）</li>
            <li>拖拽词语完成填空</li>
            <li>句子完成后自动朗读一遍</li>
            <li>答错会说明原因，需拖入正确答案才能继续（该题仍记作错误）</li>
          </ul>
          <div className="sentence-challenge-intro-actions">
            <button
              type="button"
              className="sentence-challenge-start-button"
              onClick={handleStart}
              disabled={regenerating}
            >
              开始练习
            </button>
            <button
              type="button"
              className="sentence-challenge-secondary-button"
              onClick={() => void regenerateAndRestart(false)}
              disabled={regenerating}
            >
              {regenerating ? '正在出题…' : '换一批题目'}
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="sentence-challenge-result">
          <p className="sentence-challenge-result-label">{passed ? '恭喜通关！' : '继续加油'}</p>
          <p className="sentence-challenge-score" aria-live="polite">
            <span className="sentence-challenge-score-value">{correctCount}</span>
            <span className="sentence-challenge-score-total">/ {roundCount}</span>
          </p>
          <p className="sentence-challenge-result-elapsed">
            总用时 <span>{formatElapsedSeconds(totalElapsedSeconds)}</span>
          </p>
          <div className="sentence-challenge-result-actions">
            <button
              type="button"
              className="sentence-challenge-start-button"
              onClick={() => void regenerateAndRestart(true)}
              disabled={regenerating}
            >
              {regenerating ? '正在出题…' : '再练一轮'}
            </button>
            <button
              type="button"
              className="sentence-challenge-secondary-button"
              onClick={onComplete}
            >
              返回关卡列表
            </button>
          </div>
        </div>
      )}

      {phase === 'running' && currentQuestion && (
        <div className="sentence-challenge-board">
          <div className="sentence-challenge-hud">
            <div className="sentence-challenge-stat">
              <span className="sentence-challenge-stat-label">进度</span>
              <span className="sentence-challenge-stat-value">
                {currentNumber}/{roundCount}
              </span>
            </div>
            <div className="sentence-challenge-stat">
              <span className="sentence-challenge-stat-label">本题</span>
              <span
                className={`sentence-challenge-stat-value${
                  questionPhase === 'answering' && questionLeft <= urgentThreshold ? ' is-urgent' : ''
                }`}
              >
                {questionPhase === 'retry' ? '订正中' : `${questionLeft}s`}
              </span>
            </div>
            <div className="sentence-challenge-stat">
              <span className="sentence-challenge-stat-label">正确</span>
              <span className="sentence-challenge-stat-value">{correctCount}</span>
            </div>
          </div>

          <div className="sentence-challenge-sentence-panel">
            <div className="sentence-challenge-role-row">
              <span className="sentence-challenge-prompt-label">空格成分</span>
              <span className={`sentence-role-badge ${roleClass}`}>{currentQuestion.roleLabel}</span>
            </div>

            <p
              className={`sentence-challenge-drag-hint${
                questionPhase === 'retry'
                  ? ' is-retry'
                  : questionPhase === 'advancing'
                    ? ' is-advancing'
                    : ''
              }`}
            >
              {dragHint}
            </p>

            <div className="sentence-challenge-content-stack">
              <div className="sentence-challenge-canvas">
                <div className="sentence-challenge-workspace">
                  <p className="sentence-challenge-sentence sentence-challenge-sentence--cloze">
                    <HighlightVerbs text={sentenceParts.before} verbs={currentQuestion.verbs} />
                    <span
                      className={blankStateClass}
                      onDragOver={handleBlankDragOver}
                      onDragLeave={handleBlankDragLeave}
                      onDrop={handleBlankDrop}
                    >
                      {filledChip ? (
                        <span
                          className={`sentence-cloze-chip sentence-cloze-chip--in-blank${currentQuestion.role === 'predicate' ? ' sentence-verb' : ''}${draggingChipId === filledChip.id ? ' is-dragging' : ''}${getChipStateClass(filledChip)}`}
                          draggable={canDrag}
                          onDragStart={handleDragStart(filledChip.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => canDrag && returnChipToBank(filledChip.id)}
                        >
                          {filledChip.label}
                        </span>
                      ) : (
                        <span className="sentence-cloze-blank-placeholder" aria-hidden="true">
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </span>
                      )}
                    </span>
                    <HighlightVerbs text={sentenceParts.after} verbs={currentQuestion.verbs} />
                  </p>
                  <p className="sentence-challenge-sentence-zh">{currentQuestion.sentenceZh}</p>
                </div>

                {showHint && (
                  <div className="sentence-challenge-hint" role="status">
                    <p>
                      <strong>
                        {firstAttemptCorrect
                          ? '回答正确！'
                          : questionPhase === 'retry' && filledIsCorrect
                            ? '已拖入正确答案，即将进入下一题…'
                            : '回答错误，本题仍记作错误。'}
                        {!firstAttemptCorrect && ` 答案：${currentQuestion.answer}`}
                      </strong>
                    </p>
                    {!firstAttemptCorrect && lastWrongLabel && (
                      <p className="sentence-challenge-wrong-reason">
                        <strong>错误原因：</strong>
                        {getWrongAnswerReason(currentQuestion, lastWrongLabel)}
                      </p>
                    )}
                    {!firstAttemptCorrect && (
                      <>
                        <p className="sentence-challenge-structure">
                          <strong>句子结构：</strong>
                          {currentQuestion.structureNote}
                        </p>
                        <p>{currentQuestion.hint}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div
                className={`sentence-cloze-bank${draggingChipId ? ' is-receiving' : ''}`}
                onDragOver={handleBankDragOver}
                onDrop={handleBankDrop}
              >
                <span className="sentence-cloze-bank-label">词库</span>
                <div className="sentence-cloze-bank-chips">
                  {bankChips.map((chip) => (
                    <span
                      key={chip.id}
                      className={`sentence-cloze-chip${draggingChipId === chip.id ? ' is-dragging' : ''}${getChipStateClass(chip)}`}
                      draggable={canDrag}
                      onDragStart={handleDragStart(chip.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {chip.label}
                    </span>
                  ))}
                  {bankChips.length === 0 && canDrag && (
                    <span className="sentence-cloze-bank-empty">词语已填入句子</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
