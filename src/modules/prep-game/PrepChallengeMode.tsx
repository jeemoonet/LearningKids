import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HighlightVerbs } from '../../lib/highlightVerbs'
import type { PrepLevel, PrepQuestion } from './types'
import { recordPrepResult } from './progress'

type ChallengePhase = 'running' | 'done'
type QuestionPhase = 'answering' | 'retry' | 'advancing'

const BLANK_ID = 'prep-blank'

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

function buildChips(question: PrepQuestion): OptionChip[] {
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

function formatElapsedSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} 秒`
  if (seconds === 0) return `${minutes} 分`
  return `${minutes} 分 ${seconds} 秒`
}

interface PrepChallengeModeProps {
  level: PrepLevel
  questions: PrepQuestion[]
  onBack: () => void
  onComplete: () => void
  onRegenerateQuestions: () => Promise<PrepQuestion[]>
}

export function PrepChallengeMode({
  level,
  questions,
  onBack,
  onComplete,
  onRegenerateQuestions,
}: PrepChallengeModeProps) {
  const [phase, setPhase] = useState<ChallengePhase>('running')
  const [roundQuestions, setRoundQuestions] = useState(questions)
  const [regenerating, setRegenerating] = useState(false)
  const roundCount = roundQuestions.length
  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<PrepQuestion | null>(null)
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

  const phaseRef = useRef(phase)
  const startTimeRef = useRef<number | null>(null)
  const questionPhaseRef = useRef(questionPhase)
  const currentQuestionRef = useRef(currentQuestion)
  const advanceTimerRef = useRef<number | null>(null)
  const questionIndexRef = useRef(questionIndex)
  const questionsRef = useRef(roundQuestions)
  const answeredCountRef = useRef(answeredCount)

  phaseRef.current = phase
  questionPhaseRef.current = questionPhase
  currentQuestionRef.current = currentQuestion
  questionIndexRef.current = questionIndex
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
  const canConfirm = filledChip !== null && questionPhase !== 'advancing'

  const filledIsCorrect = useMemo(() => {
    if (!currentQuestion || !filledChip) return false
    return isCorrectLabel(filledChip.label, currentQuestion.answer)
  }, [currentQuestion, filledChip])

  useEffect(() => {
    setRoundQuestions(questions)
    questionsRef.current = questions
  }, [questions])

  const resetQuestionState = useCallback((question: PrepQuestion | null) => {
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

  const handleConfirm = useCallback(() => {
    const question = currentQuestionRef.current
    if (!question || phaseRef.current !== 'running' || !filledChip) return

    const activePhase = questionPhaseRef.current
    if (activePhase === 'advancing') return

    const correct = isCorrectLabel(filledChip.label, question.answer)

    if (activePhase === 'answering') {
      scoreFirstAttempt(correct)
      if (correct) {
        proceedAfterQuestion()
      } else {
        setQuestionPhase('retry')
        questionPhaseRef.current = 'retry'
      }
      return
    }

    if (activePhase === 'retry' && correct) {
      proceedAfterQuestion()
    }
  }, [filledChip, scoreFirstAttempt, proceedAfterQuestion])

  const placeChipInBlank = useCallback(
    (chipId: string) => {
      if (questionPhaseRef.current === 'advancing' || !chipById.has(chipId)) return

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
    },
    [chipById],
  )

  const returnChipToBank = (chipId: string) => {
    if (!canDrag) return
    setChipLocations((current) => {
      const next = new Map(current)
      next.set(chipId, 'bank')
      return next
    })
  }

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
    resetQuestionState(firstQuestion)
  }

  const regenerateAndRestart = async (autoStart: boolean) => {
    setRegenerating(true)
    try {
      const nextQuestions = await onRegenerateQuestions()
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
      setCurrentQuestion(null)
      resetQuestionState(null)
      if (autoStart) {
        handleStart()
      } else {
        phaseRef.current = 'running'
        setPhase('running')
        handleStart()
      }
    } finally {
      setRegenerating(false)
    }
  }

  const handleRestart = () => {
    void regenerateAndRestart(false)
  }

  const handlePracticeAgain = () => {
    void regenerateAndRestart(true)
  }

  useEffect(() => {
    handleStart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- 进入闯关后直接开始，不再展示介绍白框

  useEffect(
    () => () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (phase !== 'done') return
    recordPrepResult(level.id, correctCount, roundCount)
  }, [phase, level.id, correctCount, roundCount])

  const currentNumber = questionIndex + 1
  const passed = correctCount >= roundCount

  const blankShowsCorrect =
    firstAttemptCorrect === true || (questionPhase === 'retry' && filledIsCorrect && showHint)
  const blankShowsWrong = showHint && firstAttemptCorrect === false && filledChip && !filledIsCorrect

  const blankStateClass = [
    'prep-cloze-blank',
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
      ? '回答正确，正在进入下一题…'
      : questionPhase === 'retry'
        ? '本题已记为错误，请拖入正确精灵并点击确定后继续'
        : '将精灵拖入句中空白处，点击确定后判定'

  return (
    <section className="prep-challenge prep-challenge-pc">
      <div className="prep-challenge-toolbar">
        <button type="button" className="module-back-button prep-challenge-back-link" onClick={onBack}>
          ← 返回介绍
        </button>
        <p className="prep-challenge-toolbar-meta">
          <strong>{level.title}</strong>
          <span>{level.scene}</span>
        </p>
      </div>

      {phase === 'done' && (
        <div className="prep-challenge-result">
          <p className="prep-challenge-result-label">{passed ? '恭喜通关！' : '继续加油'}</p>
          <p className="prep-challenge-score" aria-live="polite">
            <span className="prep-challenge-score-value">{correctCount}</span>
            <span className="prep-challenge-score-total">/ {roundCount}</span>
          </p>
          <p className="prep-challenge-result-elapsed">
            总用时 <span>{formatElapsedSeconds(totalElapsedSeconds)}</span>
          </p>
          <div className="prep-challenge-result-actions">
            <button
              type="button"
              className="prep-challenge-start-button"
              onClick={handlePracticeAgain}
              disabled={regenerating}
            >
              {regenerating ? '正在出题…' : '再练一轮（新题）'}
            </button>
            <button
              type="button"
              className="prep-challenge-secondary-button"
              onClick={handleRestart}
              disabled={regenerating}
            >
              换一批题目
            </button>
            <button type="button" className="prep-challenge-secondary-button" onClick={onComplete}>
              返回介绍
            </button>
          </div>
        </div>
      )}

      {phase === 'running' && currentQuestion && (
        <div className="prep-challenge-board">
          <header className="prep-challenge-board-head">
            <div className="prep-challenge-hud prep-challenge-hud--compact">
              <span className="prep-challenge-pill">
                第 <strong>{currentNumber}</strong> / {roundCount} 题
              </span>
              <span className="prep-challenge-pill">
                正确 <strong>{correctCount}</strong>
              </span>
            </div>
            <p
              className={`prep-challenge-drag-hint${
                questionPhase === 'retry'
                  ? ' is-retry'
                  : questionPhase === 'advancing'
                    ? ' is-advancing'
                    : ''
              }`}
            >
              {dragHint}
            </p>
          </header>

          <div className="prep-challenge-stage">
            <div className="prep-challenge-workspace">
              <p className="prep-challenge-sentence prep-challenge-sentence--cloze">
                <HighlightVerbs text={sentenceParts.before} verbs={currentQuestion.verbs} />
                <span
                  className={blankStateClass}
                  onDragOver={handleBlankDragOver}
                  onDragLeave={handleBlankDragLeave}
                  onDrop={handleBlankDrop}
                >
                  {filledChip ? (
                    <span
                      className={`prep-cloze-chip prep-cloze-chip--in-blank${draggingChipId === filledChip.id ? ' is-dragging' : ''}${getChipStateClass(filledChip)}`}
                      draggable={canDrag}
                      onDragStart={handleDragStart(filledChip.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => canDrag && returnChipToBank(filledChip.id)}
                    >
                      {filledChip.label}
                    </span>
                  ) : (
                    <span className="prep-cloze-blank-placeholder" aria-hidden="true">
                      拖入精灵
                    </span>
                  )}
                </span>
                <HighlightVerbs text={sentenceParts.after} verbs={currentQuestion.verbs} />
              </p>
              <p className="prep-challenge-sentence-zh">{currentQuestion.sentenceZh}</p>
            </div>

            {showHint && (
              <div className="prep-challenge-hint" role="status">
                <p>
                  <strong>
                    {firstAttemptCorrect
                      ? '回答正确！'
                      : questionPhase === 'retry' && filledIsCorrect
                        ? '已拖入正确精灵，即将进入下一题…'
                        : '回答错误，本题仍记作错误。'}
                    {!firstAttemptCorrect && ` 答案：${currentQuestion.answer}`}
                  </strong>
                </p>
                {!firstAttemptCorrect && <p>{currentQuestion.hint}</p>}
              </div>
            )}
          </div>

          <footer className="prep-challenge-dock">
            <span className="prep-challenge-dock-label">选择精灵</span>
            <div
              className={`prep-challenge-options${draggingChipId ? ' is-receiving' : ''}`}
              onDragOver={handleBankDragOver}
              onDrop={handleBankDrop}
            >
              {bankChips.map((chip) => (
                <span
                  key={chip.id}
                  className={`prep-cloze-chip prep-challenge-option${draggingChipId === chip.id ? ' is-dragging' : ''}${getChipStateClass(chip)}`}
                  draggable={canDrag}
                  onDragStart={handleDragStart(chip.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => canDrag && placeChipInBlank(chip.id)}
                >
                  {chip.label}
                </span>
              ))}
              {bankChips.length === 0 && canDrag && (
                <span className="prep-challenge-options-empty">精灵已填入句子</span>
              )}
            </div>

            {questionPhase !== 'advancing' && (
              <button
                type="button"
                className="prep-cloze-submit prep-cloze-submit--dock"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                确定
              </button>
            )}
          </footer>
        </div>
      )}
    </section>
  )
}
