import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HighlightVerbs } from '../../lib/highlightVerbs'
import { EXAMPLE_SPEECH_RATE, speakEnglish, stopSpeaking } from '../vocab-training/speak'
import type { SentenceLevel, SentenceRole, StructurePuzzle } from './types'
import { recordSentenceResult } from './progress'

type StructurePhase = 'ready' | 'running' | 'done'

interface WordChip {
  id: string
  text: string
  textZh: string
  role: SentenceRole
}

type ChipLocation = 'bank' | string

function isPredicateChip(chip: WordChip): boolean {
  return chip.role === 'predicate'
}

function chipVerbClass(chip: WordChip): string {
  return isPredicateChip(chip) ? ' sentence-verb' : ''
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function buildWordChips(puzzle: StructurePuzzle): WordChip[] {
  return shuffleArray(
    puzzle.segments.map((segment, index) => ({
      id: `${puzzle.id}-word-${index}`,
      text: segment.text,
      textZh: segment.textZh,
      role: segment.role,
    })),
  )
}

function formatElapsedSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} 秒`
  if (seconds === 0) return `${minutes} 分`
  return `${minutes} 分 ${seconds} 秒`
}

interface SentenceStructureModeProps {
  level: SentenceLevel
  puzzles: StructurePuzzle[]
  ruleSummary: string
  autoStart?: boolean
  onBack: () => void
  onComplete: () => void
  onRegeneratePuzzles: () => Promise<StructurePuzzle[]>
}

export function SentenceStructureMode({
  level,
  puzzles,
  ruleSummary,
  autoStart = false,
  onBack,
  onComplete,
  onRegeneratePuzzles,
}: SentenceStructureModeProps) {
  void ruleSummary
  const [phase, setPhase] = useState<StructurePhase>('ready')
  const [roundPuzzles, setRoundPuzzles] = useState(puzzles)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateNotice, setRegenerateNotice] = useState('')
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [currentPuzzle, setCurrentPuzzle] = useState<StructurePuzzle | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0)
  const [puzzleComplete, setPuzzleComplete] = useState(false)
  const [wrongSlotId, setWrongSlotId] = useState<string | null>(null)
  const [wrongFeedback, setWrongFeedback] = useState<{
    chosen: string
    expected: string
    roleLabel: string
  } | null>(null)

  const [wordChips, setWordChips] = useState<WordChip[]>([])
  const [chipLocations, setChipLocations] = useState<Map<string, ChipLocation>>(() => new Map())
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(() => new Set())
  const [draggingChipId, setDraggingChipId] = useState<string | null>(null)
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null)

  const phaseRef = useRef(phase)
  const startTimeRef = useRef<number | null>(null)
  const advanceTimerRef = useRef<number | null>(null)
  const puzzleIndexRef = useRef(puzzleIndex)
  const puzzlesRef = useRef(roundPuzzles)
  const hadMistakeRef = useRef(false)

  phaseRef.current = phase
  puzzleIndexRef.current = puzzleIndex
  puzzlesRef.current = roundPuzzles

  const roundCount = roundPuzzles.length

  const chipById = useMemo(() => new Map(wordChips.map((chip) => [chip.id, chip])), [wordChips])

  const bankChips = useMemo(
    () => wordChips.filter((chip) => chipLocations.get(chip.id) === 'bank'),
    [wordChips, chipLocations],
  )

  useEffect(() => {
    setRoundPuzzles(puzzles)
    puzzlesRef.current = puzzles
  }, [puzzles])

  const resetPuzzleState = useCallback((puzzle: StructurePuzzle | null) => {
    if (!puzzle) {
      setWordChips([])
      setChipLocations(new Map())
    } else {
      const chips = buildWordChips(puzzle)
      const locations = new Map<string, ChipLocation>()
      for (const chip of chips) {
        locations.set(chip.id, 'bank')
      }
      setWordChips(chips)
      setChipLocations(locations)
    }
    setLockedSlots(new Set())
    setDraggingChipId(null)
    setDragOverSlotId(null)
    setPuzzleComplete(false)
    setWrongSlotId(null)
    setWrongFeedback(null)
    hadMistakeRef.current = false
  }, [])

  const getChipOnSlot = (slotId: string): WordChip | null => {
    for (const [chipId, location] of chipLocations.entries()) {
      if (location === slotId) return chipById.get(chipId) ?? null
    }
    return null
  }

  const finishChallenge = useCallback(() => {
    if (phaseRef.current === 'done') return
    phaseRef.current = 'done'
    if (startTimeRef.current !== null) {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
      setTotalElapsedSeconds(elapsed)
      startTimeRef.current = null
    }
    setPhase('done')
    setCurrentPuzzle(null)
    resetPuzzleState(null)
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [resetPuzzleState])

  const loadNextPuzzle = useCallback(() => {
    const nextIndex = puzzleIndexRef.current + 1
    const activePuzzles = puzzlesRef.current

    if (nextIndex >= activePuzzles.length) {
      finishChallenge()
      return
    }

    const nextPuzzle = activePuzzles[nextIndex]
    setPuzzleIndex(nextIndex)
    setCurrentPuzzle(nextPuzzle)
    resetPuzzleState(nextPuzzle)
  }, [finishChallenge, resetPuzzleState])

  const scheduleNextPuzzle = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
    }

    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      if (phaseRef.current !== 'running') return
      loadNextPuzzle()
    }, 5000)
  }, [loadNextPuzzle])

  const handleNextPuzzle = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    if (phaseRef.current !== 'running' || !puzzleComplete) return
    loadNextPuzzle()
  }, [loadNextPuzzle, puzzleComplete])

  const checkPuzzleComplete = useCallback(
    (nextLocked: Set<string>, puzzle: StructurePuzzle) => {
      if (nextLocked.size < puzzle.segments.length) return false

      setPuzzleComplete(true)
      if (!hadMistakeRef.current) {
        setCorrectCount((current) => current + 1)
      }
      scheduleNextPuzzle()
      return true
    },
    [scheduleNextPuzzle],
  )

  const placeWordOnSlot = useCallback(
    (chipId: string, slotId: string) => {
      if (puzzleComplete || !currentPuzzle || lockedSlots.has(slotId)) return

      const chip = chipById.get(chipId)
      const slot = currentPuzzle.segments.find((item) => item.id === slotId)
      if (!chip || !slot) return

      const isCorrect = chip.text.toLowerCase() === slot.text.toLowerCase()

      setChipLocations((current) => {
        const next = new Map(current)

        for (const [existingChipId, location] of next.entries()) {
          if (location === slotId && existingChipId !== chipId) {
            next.set(existingChipId, 'bank')
          }
        }

        const previousLocation = next.get(chipId)
        if (
          previousLocation &&
          previousLocation !== 'bank' &&
          previousLocation !== slotId &&
          lockedSlots.has(previousLocation)
        ) {
          return current
        }

        if (previousLocation && previousLocation !== 'bank' && previousLocation !== slotId) {
          next.set(chipId, 'bank')
        }

        next.set(chipId, slotId)
        return next
      })

      if (isCorrect) {
        setWrongSlotId(null)
        setWrongFeedback(null)
        setLockedSlots((current) => {
          const nextLocked = new Set(current)
          nextLocked.add(slotId)
          checkPuzzleComplete(nextLocked, currentPuzzle)
          return nextLocked
        })
      } else {
        hadMistakeRef.current = true
        setWrongSlotId(slotId)
        setWrongFeedback({
          chosen: chip.text,
          expected: slot.text,
          roleLabel: slot.roleLabel,
        })
        window.setTimeout(() => {
          setChipLocations((current) => {
            const next = new Map(current)
            if (next.get(chipId) === slotId) {
              next.set(chipId, 'bank')
            }
            return next
          })
          setWrongSlotId((current) => (current === slotId ? null : current))
        }, 700)
      }
    },
    [puzzleComplete, currentPuzzle, lockedSlots, chipById, checkPuzzleComplete],
  )

  const handleDragStart = (chipId: string) => (event: React.DragEvent) => {
    if (puzzleComplete) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', chipId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingChipId(chipId)
  }

  const handleDragEnd = () => {
    setDraggingChipId(null)
    setDragOverSlotId(null)
  }

  const handleSlotDragOver = (slotId: string) => (event: React.DragEvent) => {
    if (puzzleComplete || lockedSlots.has(slotId)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverSlotId(slotId)
  }

  const handleSlotDragLeave = () => {
    setDragOverSlotId(null)
  }

  const handleSlotDrop = (slotId: string) => (event: React.DragEvent) => {
    if (puzzleComplete || lockedSlots.has(slotId)) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    placeWordOnSlot(chipId, slotId)
    setDraggingChipId(null)
    setDragOverSlotId(null)
  }

  const handleBankDragOver = (event: React.DragEvent) => {
    if (puzzleComplete) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleBankDrop = (event: React.DragEvent) => {
    if (puzzleComplete) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    const location = chipLocations.get(chipId)
    if (location && location !== 'bank' && lockedSlots.has(location)) return

    setChipLocations((current) => {
      const next = new Map(current)
      next.set(chipId, 'bank')
      return next
    })
    setDraggingChipId(null)
  }

  const handleStart = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    const activePuzzles = puzzlesRef.current
    const firstPuzzle = activePuzzles[0] ?? null
    setCorrectCount(0)
    setPuzzleIndex(0)
    puzzleIndexRef.current = 0
    startTimeRef.current = Date.now()
    setTotalElapsedSeconds(0)
    phaseRef.current = 'running'
    setPhase('running')
    setCurrentPuzzle(firstPuzzle)
    resetPuzzleState(firstPuzzle)
  }

  const autoStartedRef = useRef(false)
  useLayoutEffect(() => {
    if (!autoStart || autoStartedRef.current || puzzles.length === 0) return
    autoStartedRef.current = true
    handleStart()
  }, [autoStart, puzzles.length])

  const regenerateAndRestart = async (autoStart: boolean) => {
    setRegenerating(true)
    setRegenerateNotice('')
    try {
      const nextPuzzles = await onRegeneratePuzzles()
      if (nextPuzzles.length === 0) {
        setRegenerateNotice('暂无可用句子，请稍后再试')
        return
      }
      setRoundPuzzles(nextPuzzles)
      puzzlesRef.current = nextPuzzles
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      startTimeRef.current = null
      setTotalElapsedSeconds(0)
      setPuzzleIndex(0)
      puzzleIndexRef.current = 0
      setCorrectCount(0)
      setCurrentPuzzle(null)
      resetPuzzleState(null)
      if (autoStart) {
        handleStart()
      } else {
        setPhase('ready')
        phaseRef.current = 'ready'
        setRegenerateNotice('已换一批新句子，点击「开始还原」开始练习')
      }
    } catch {
      setRegenerateNotice('换题失败，请稍后再试')
    } finally {
      setRegenerating(false)
    }
  }

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
    if (!puzzleComplete || !currentPuzzle) return
    speakEnglish(currentPuzzle.sentence, EXAMPLE_SPEECH_RATE)
    return () => {
      stopSpeaking()
    }
  }, [puzzleComplete, currentPuzzle])

  useEffect(() => {
    if (phase !== 'done') return
    recordSentenceResult(level.id, correctCount, roundCount)
  }, [phase, level.id, correctCount, roundCount])

  const currentNumber = puzzleIndex + 1
  const passed = correctCount >= roundCount
  const filledCount = lockedSlots.size
  const totalSlots = currentPuzzle?.segments.length ?? 0

  return (
    <section className="sentence-structure-pc">
      <div className="sentence-challenge-playhead">
        <button type="button" className="prep-spirit-detail-back-link" onClick={onBack}>
          {autoStart ? '← 返回介绍' : '← 返回关卡'}
        </button>
      </div>

      {!autoStart && phase === 'ready' && (
        <div className="sentence-structure-intro">
          <h2>句子还原 · {level.scene}</h2>
          <p>共 {roundCount} 句。将拆开的单词或词组拖入句子空白处，拼回完整英文句。</p>
          <ul className="sentence-structure-rules">
            <li>动词以红色显示；拖拽词块完成拼句</li>
            <li>放错位置会说明原因，需拖入正确词块才能继续</li>
            <li>每句拼完后自动朗读一遍英文</li>
          </ul>
          {regenerateNotice && (
            <p className="sentence-structure-regenerate-notice" role="status">
              {regenerateNotice}
            </p>
          )}
          <div className="sentence-structure-intro-actions">
            <button
              type="button"
              className="sentence-structure-start-button"
              onClick={handleStart}
              disabled={regenerating}
            >
              开始还原
            </button>
            <button
              type="button"
              className="sentence-structure-secondary-button"
              onClick={() => void regenerateAndRestart(false)}
              disabled={regenerating}
            >
              {regenerating ? '正在出题…' : '换一批句子'}
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="sentence-structure-result">
          <p className="sentence-structure-result-label">
            {passed ? '全部一次拼对，恭喜通关！' : '继续加油'}
          </p>
          <p className="sentence-structure-score" aria-live="polite">
            <span className="sentence-structure-score-value">{correctCount}</span>
            <span className="sentence-structure-score-total">/ {roundCount}</span>
          </p>
          <p className="sentence-structure-result-note">一次拼对的句子数</p>
          <p className="sentence-structure-result-elapsed">
            总用时 <span>{formatElapsedSeconds(totalElapsedSeconds)}</span>
          </p>
          <div className="sentence-structure-result-actions">
            <button
              type="button"
              className="sentence-structure-start-button"
              onClick={() => void regenerateAndRestart(true)}
              disabled={regenerating}
            >
              {regenerating ? '正在出题…' : '再练一轮'}
            </button>
            <button
              type="button"
              className="sentence-structure-secondary-button"
              onClick={onComplete}
            >
              返回关卡列表
            </button>
          </div>
        </div>
      )}

      {phase === 'running' && currentPuzzle && (
        <div className="sentence-structure-board">
          <div className="sentence-structure-hud">
            <div className="sentence-structure-stat">
              <span className="sentence-structure-stat-label">进度</span>
              <span className="sentence-structure-stat-value">
                {currentNumber}/{roundCount}
              </span>
            </div>
            <div className="sentence-structure-stat">
              <span className="sentence-structure-stat-label">已填入</span>
              <span className="sentence-structure-stat-value">
                {filledCount}/{totalSlots}
              </span>
            </div>
            <div className="sentence-structure-stat">
              <span className="sentence-structure-stat-label">一次拼对</span>
              <span className="sentence-structure-stat-value">{correctCount}</span>
            </div>
          </div>

          <div className="sentence-structure-sentence-panel">
            <p className="sentence-structure-hint-text">
              将词块拖入上方空白处。拼完后会自动朗读句子。
            </p>

            {wrongFeedback && (
              <div className="sentence-structure-wrong-feedback" role="alert">
                <p>
                  <strong>放错位置：</strong>
                  「{wrongFeedback.chosen}」不能放在此处。
                </p>
                <p>
                  该槽位需要<strong>{wrongFeedback.roleLabel}</strong>「{wrongFeedback.expected}」。
                  {currentPuzzle.hint ? ` ${currentPuzzle.hint}` : ''}
                </p>
              </div>
            )}

            <div className="sentence-structure-stack">
              <div className="sentence-structure-canvas">
                {puzzleComplete && (
                  <div className="sentence-structure-restored" role="status">
                    <div className="sentence-structure-restored-main">
                      <span className="sentence-structure-restored-label">拼对了！</span>
                      <div className="sentence-structure-restored-body">
                        <span className="sentence-structure-restored-text">
                          <HighlightVerbs
                            text={currentPuzzle.sentence}
                            verbs={currentPuzzle.segments
                              .filter((segment) => segment.role === 'predicate')
                              .map((segment) => segment.text)}
                          />
                        </span>
                        <span className="sentence-structure-restored-zh">{currentPuzzle.sentenceZh}</span>
                      </div>
                    </div>
                    <div className="sentence-structure-restored-actions">
                      <button
                        type="button"
                        className="sentence-structure-next-button"
                        onClick={handleNextPuzzle}
                      >
                        {currentNumber >= roundCount ? '查看结果' : '下一个'}
                      </button>
                      <span className="sentence-structure-restored-hint">5 秒后自动继续</span>
                    </div>
                  </div>
                )}

                <div className="sentence-structure-workspace">
                  <div className="sentence-structure-sentence-line">
                    {currentPuzzle.segments.map((segment, index) => {
                      const assigned = getChipOnSlot(segment.id)
                      const isLocked = lockedSlots.has(segment.id)
                      const isWrong = wrongSlotId === segment.id

                      return (
                        <div
                          key={segment.id}
                          className={`sentence-structure-slot-wrap${index > 0 ? ' has-gap' : ''}`}
                        >
                          <div
                            className={[
                              'sentence-structure-word-slot',
                              dragOverSlotId === segment.id ? 'is-drag-over' : '',
                              assigned ? 'is-filled' : '',
                              isLocked ? 'is-correct' : '',
                              isWrong ? 'is-wrong' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onDragOver={handleSlotDragOver(segment.id)}
                            onDragLeave={handleSlotDragLeave}
                            onDrop={handleSlotDrop(segment.id)}
                            onClick={() => {
                              if (puzzleComplete || isLocked || !assigned) return
                              setChipLocations((current) => {
                                const next = new Map(current)
                                next.set(assigned.id, 'bank')
                                return next
                              })
                            }}
                          >
                            {assigned ? (
                              <span
                                className={`sentence-structure-word-chip sentence-structure-word-chip--placed${chipVerbClass(assigned)}${isLocked ? ' is-locked' : ''}`}
                              >
                                {assigned.text}
                              </span>
                            ) : (
                              <span className="sentence-structure-slot-placeholder">______</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div
                className={`sentence-structure-word-bank${draggingChipId ? ' is-receiving' : ''}`}
                onDragOver={handleBankDragOver}
                onDrop={handleBankDrop}
              >
                <div className="sentence-structure-bank-header">
                  <span className="sentence-structure-bank-title">Word Bank</span>
                  <span className="sentence-structure-bank-desc">拖入上方空白处</span>
                </div>
                <div className="sentence-structure-bank-chips">
                  {bankChips.map((chip) => (
                    <span
                      key={chip.id}
                      className={`sentence-structure-word-chip sentence-structure-word-chip--bank${chipVerbClass(chip)}${draggingChipId === chip.id ? ' is-dragging' : ''}`}
                      draggable={!puzzleComplete}
                      onDragStart={handleDragStart(chip.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {chip.text}
                    </span>
                  ))}
                  {bankChips.length === 0 && !puzzleComplete && (
                    <span className="sentence-structure-bank-empty">All words placed</span>
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
