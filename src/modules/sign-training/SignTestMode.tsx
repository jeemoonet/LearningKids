import { useCallback, useEffect, useRef, useState } from 'react'
import { MathText } from '../../components/MathText'
import { SIGN_TEST_QUESTION_SECONDS, SIGN_TEST_ROUND_COUNT } from '../../constants'
import type { SignChoiceQuestion } from './signChoiceGenerator'
import { generateSignChoiceQuestions } from './signChoiceGenerator'

type TestPhase = 'ready' | 'running' | 'done'

const OPTION_LABELS = ['A', 'B', 'C'] as const

function formatElapsedSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} 秒`
  if (seconds === 0) return `${minutes} 分`
  return `${minutes} 分 ${seconds} 秒`
}

export interface SignTestModeConfig {
  title: string
  roundCount?: number
  questionSeconds?: number
  generateQuestions?: (count: number) => SignChoiceQuestion[]
  rules: string[]
  promptClassName?: string
  sectionClassName?: string
}

const DEFAULT_CONFIG: Required<
  Pick<SignTestModeConfig, 'roundCount' | 'questionSeconds' | 'generateQuestions'>
> = {
  roundCount: SIGN_TEST_ROUND_COUNT,
  questionSeconds: SIGN_TEST_QUESTION_SECONDS,
  generateQuestions: generateSignChoiceQuestions,
}

export function SignTestMode({
  title,
  roundCount = DEFAULT_CONFIG.roundCount,
  questionSeconds = DEFAULT_CONFIG.questionSeconds,
  generateQuestions = DEFAULT_CONFIG.generateQuestions,
  rules,
  promptClassName = '',
  sectionClassName = '',
}: SignTestModeConfig) {
  const [phase, setPhase] = useState<TestPhase>('ready')
  const [questionLeft, setQuestionLeft] = useState(questionSeconds)
  const [questions, setQuestions] = useState<SignChoiceQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<SignChoiceQuestion | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0)

  const phaseRef = useRef(phase)
  const startTimeRef = useRef<number | null>(null)
  const lockedRef = useRef(locked)
  const advanceTimerRef = useRef<number | null>(null)
  const questionsRef = useRef(questions)
  const questionIndexRef = useRef(questionIndex)
  const questionSecondsRef = useRef(questionSeconds)

  phaseRef.current = phase
  lockedRef.current = locked
  questionsRef.current = questions
  questionIndexRef.current = questionIndex
  questionSecondsRef.current = questionSeconds

  const finishTest = useCallback(() => {
    if (phaseRef.current === 'done') return
    lockedRef.current = true
    phaseRef.current = 'done'
    if (startTimeRef.current !== null) {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
      setTotalElapsedSeconds(elapsed)
      startTimeRef.current = null
    }
    setPhase('done')
    setLocked(true)
    setCurrentQuestion(null)
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  const loadNextQuestion = useCallback(() => {
    const nextIndex = questionIndexRef.current + 1
    const roundQuestions = questionsRef.current

    if (nextIndex >= roundQuestions.length) {
      finishTest()
      return
    }

    lockedRef.current = false
    setQuestionIndex(nextIndex)
    setCurrentQuestion(roundQuestions[nextIndex])
    setQuestionLeft(questionSecondsRef.current)
    setLocked(false)
    setRevealedIndex(null)
  }, [finishTest])

  const scheduleNextQuestion = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
    }

    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      if (phaseRef.current !== 'running') return
      loadNextQuestion()
    }, 450)
  }, [loadNextQuestion])

  const recordAnswer = useCallback(
    (selectedIndex: number | null, timedOut: boolean) => {
      if (!currentQuestion || lockedRef.current || phaseRef.current !== 'running') return

      lockedRef.current = true
      setLocked(true)
      const correct =
        !timedOut && selectedIndex !== null && selectedIndex === currentQuestion.correctIndex
      setRevealedIndex(selectedIndex ?? currentQuestion.correctIndex)

      const nextAnsweredCount = answeredCount + 1
      setAnsweredCount(nextAnsweredCount)
      if (correct) {
        setCorrectCount((current) => current + 1)
      }

      if (nextAnsweredCount >= roundCount) {
        if (advanceTimerRef.current !== null) {
          window.clearTimeout(advanceTimerRef.current)
        }
        advanceTimerRef.current = window.setTimeout(() => {
          advanceTimerRef.current = null
          finishTest()
        }, 450)
      } else {
        scheduleNextQuestion()
      }
    },
    [currentQuestion, answeredCount, roundCount, scheduleNextQuestion, finishTest],
  )

  const handleStart = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    const roundQuestions = generateQuestions(roundCount)
    setQuestions(roundQuestions)
    questionsRef.current = roundQuestions
    setCorrectCount(0)
    setAnsweredCount(0)
    setQuestionIndex(0)
    questionIndexRef.current = 0
    startTimeRef.current = Date.now()
    setTotalElapsedSeconds(0)
    phaseRef.current = 'running'
    lockedRef.current = false
    setPhase('running')
    setLocked(false)
    setRevealedIndex(null)
    setCurrentQuestion(roundQuestions[0] ?? null)
    setQuestionLeft(questionSeconds)
  }

  const handleRestart = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    startTimeRef.current = null
    setTotalElapsedSeconds(0)
    setPhase('ready')
    phaseRef.current = 'ready'
    lockedRef.current = false
    setQuestions([])
    questionsRef.current = []
    setQuestionIndex(0)
    questionIndexRef.current = 0
    setCorrectCount(0)
    setAnsweredCount(0)
    setQuestionLeft(questionSeconds)
    setCurrentQuestion(null)
    setLocked(false)
    setRevealedIndex(null)
  }

  const handleSelect = (index: number) => {
    if (locked || phase !== 'running' || !currentQuestion) return
    recordAnswer(index, false)
  }

  useEffect(() => {
    if (phase !== 'running' || locked || !currentQuestion) return

    const timer = window.setInterval(() => {
      setQuestionLeft((current) => {
        if (current <= 1) {
          recordAnswer(null, true)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [phase, locked, currentQuestion, recordAnswer])

  useEffect(
    () => () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
      }
    },
    [],
  )

  const currentNumber = questionIndex + 1
  const urgentThreshold = questionSeconds <= 10 ? 3 : 5

  return (
    <section className={`sign-test${sectionClassName ? ` ${sectionClassName}` : ''}`}>
      {phase === 'ready' && (
        <div className="sign-test-intro">
          <h2>{title}</h2>
          <p>
            每轮 {roundCount} 题，每题 {questionSeconds} 秒
          </p>
          <ul className="sign-test-rules">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <button type="button" className="sign-test-start-button" onClick={handleStart}>
            开始测试
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="sign-test-result sign-test-result-simple">
          <p className="sign-test-result-label">本轮得分</p>
          <p className="sign-test-score-highlight" aria-live="polite">
            <span className="sign-test-score-value">{correctCount}</span>
            <span className="sign-test-score-total">/ {roundCount}</span>
          </p>
          <p className="sign-test-result-elapsed">
            总用时{' '}
            <span className="sign-test-result-elapsed-value">
              {formatElapsedSeconds(totalElapsedSeconds)}
            </span>
          </p>
          <button type="button" className="sign-test-start-button" onClick={handleRestart}>
            再测一轮
          </button>
        </div>
      )}

      {phase === 'running' && (
        <>
          <div className="sign-test-hud sign-test-hud-round">
            <div className="sign-test-timer sign-test-timer-round">
              <span className="sign-test-timer-label">进度</span>
              <span className="sign-test-timer-value">
                {currentNumber}/{roundCount}
              </span>
            </div>
            <div className="sign-test-timer sign-test-timer-question">
              <span className="sign-test-timer-label">本题</span>
              <span
                className={`sign-test-timer-value${questionLeft <= urgentThreshold ? ' is-urgent' : ''}`}
              >
                {questionLeft}s
              </span>
            </div>
            <div className="sign-test-progress">正确 {correctCount}</div>
          </div>

          {currentQuestion && (
            <div className="sign-test-question-panel">
              <p className="sign-test-prompt-label">化简各式</p>
              <p className={`sign-test-prompt${promptClassName ? ` ${promptClassName}` : ''}`}>
                <MathText text={currentQuestion.prompt} />
              </p>

              <div className="sign-test-options">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = revealedIndex === index
                  const isCorrectOption = index === currentQuestion.correctIndex
                  let stateClass = ''

                  if (locked) {
                    if (isCorrectOption) stateClass = ' is-correct'
                    else if (isSelected) stateClass = ' is-wrong'
                  }

                  return (
                    <button
                      key={`${currentQuestion.id}-${index}`}
                      type="button"
                      className={`sign-test-option${stateClass}`}
                      onClick={() => handleSelect(index)}
                      disabled={locked}
                    >
                      <span className="sign-test-option-label">{OPTION_LABELS[index]}</span>
                      <span className="sign-test-option-text">
                        <MathText text={option} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
