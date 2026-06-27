import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buildArmyInspectExercise,
  type ArmyInspectChip,
  type ArmyInspectExercise,
} from '../data/armyInspectCloze'
import type { PlanetSession } from '../types'

type ChipLocation = 'bank' | string

interface ArmyInspectModalProps {
  open: boolean
  session: PlanetSession
  onClose: () => void
}

export function ArmyInspectModal({ open, session, onClose }: ArmyInspectModalProps) {
  const [round, setRound] = useState(0)
  const [exercise, setExercise] = useState<ArmyInspectExercise | null>(null)
  const [chipLocations, setChipLocations] = useState<Map<string, ChipLocation>>(() => new Map())
  const [draggingChipId, setDraggingChipId] = useState<string | null>(null)
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null)
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [blankCorrect, setBlankCorrect] = useState<Map<string, boolean>>(() => new Map())

  const regenerate = useCallback(
    (nextRound: number) => {
      const next = buildArmyInspectExercise(session, nextRound)
      setExercise(next)
      setRound(nextRound)
      setSubmitted(false)
      setBlankCorrect(new Map())
      setActiveBlankId(null)
      setDraggingChipId(null)
      setDragOverBlankId(null)

      const locations = new Map<string, ChipLocation>()
      if (next) {
        for (const chip of next.wordBank) {
          locations.set(chip.id, 'bank')
        }
      }
      setChipLocations(locations)
    },
    [session],
  )

  useEffect(() => {
    if (!open) return
    regenerate(0)
  }, [open, regenerate])

  const chipById = useMemo(() => {
    const map = new Map<string, ArmyInspectChip>()
    if (!exercise) return map
    for (const chip of exercise.wordBank) {
      map.set(chip.id, chip)
    }
    return map
  }, [exercise])

  const blankById = useMemo(() => {
    const map = new Map(exercise?.blanks.map((blank) => [blank.id, blank]) ?? [])
    return map
  }, [exercise])

  const bankChips = useMemo(() => {
    if (!exercise) return []
    return exercise.wordBank.filter((chip) => chipLocations.get(chip.id) === 'bank')
  }, [exercise, chipLocations])

  const filledCount = useMemo(() => {
    if (!exercise) return 0
    return exercise.blanks.filter((blank) => {
      for (const [chipId, location] of chipLocations.entries()) {
        if (location === blank.id && chipById.has(chipId)) return true
      }
      return false
    }).length
  }, [exercise, chipLocations, chipById])

  const getChipInBlank = (blankId: string): ArmyInspectChip | null => {
    for (const [chipId, location] of chipLocations.entries()) {
      if (location === blankId) {
        return chipById.get(chipId) ?? null
      }
    }
    return null
  }

  const getFirstEmptyBlankId = (): string | null => {
    if (!exercise) return null
    for (const blank of exercise.blanks) {
      if (!getChipInBlank(blank.id)) return blank.id
    }
    return null
  }

  const getNextEmptyBlankIdAfter = (filledBlankId: string): string | null => {
    if (!exercise) return null
    const startIdx = exercise.blanks.findIndex((blank) => blank.id === filledBlankId)
    if (startIdx < 0) return getFirstEmptyBlankId()
    for (let i = startIdx + 1; i < exercise.blanks.length; i += 1) {
      if (!getChipInBlank(exercise.blanks[i].id)) return exercise.blanks[i].id
    }
    return null
  }

  const assignChipToBlank = (chipId: string, blankId: string) => {
    if (submitted) return

    setChipLocations((current) => {
      const next = new Map(current)

      for (const [existingChipId, location] of next.entries()) {
        if (location === blankId && existingChipId !== chipId) {
          next.set(existingChipId, 'bank')
        }
      }

      next.set(chipId, blankId)
      return next
    })
  }

  const returnChipToBank = (chipId: string) => {
    if (submitted) return
    let clearedBlankId: string | null = null
    setChipLocations((current) => {
      const next = new Map(current)
      const location = next.get(chipId)
      if (location && location !== 'bank') clearedBlankId = location
      next.set(chipId, 'bank')
      return next
    })
    setActiveBlankId(clearedBlankId)
  }

  const handleBankChipClick = (chipId: string) => {
    if (submitted) return
    const targetBlankId = getFirstEmptyBlankId()
    if (!targetBlankId) return
    assignChipToBlank(chipId, targetBlankId)
    setActiveBlankId(getNextEmptyBlankIdAfter(targetBlankId))
  }

  const handleBlankChipClick = (chipId: string) => {
    if (submitted) return
    returnChipToBank(chipId)
  }

  const handleBlankClick = (blankId: string) => {
    if (submitted) return
    const chip = getChipInBlank(blankId)
    if (chip) {
      returnChipToBank(chip.id)
      return
    }
    setActiveBlankId(blankId)
  }

  const handleDragStart = (chipId: string) => (event: React.DragEvent) => {
    if (submitted) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', chipId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingChipId(chipId)
  }

  const handleDragEnd = () => {
    setDraggingChipId(null)
    setDragOverBlankId(null)
  }

  const handleBlankDragOver = (blankId: string) => (event: React.DragEvent) => {
    if (submitted) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverBlankId(blankId)
  }

  const handleBlankDrop = (blankId: string) => (event: React.DragEvent) => {
    if (submitted) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    assignChipToBlank(chipId, blankId)
    setActiveBlankId(getNextEmptyBlankIdAfter(blankId))
    setDraggingChipId(null)
    setDragOverBlankId(null)
  }

  const handleBankDragOver = (event: React.DragEvent) => {
    if (submitted) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleBankDrop = (event: React.DragEvent) => {
    if (submitted) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    returnChipToBank(chipId)
    setDraggingChipId(null)
  }

  const handleSubmit = () => {
    if (!exercise || submitted || filledCount < exercise.blanks.length) return

    const feedback = new Map<string, boolean>()
    for (const blank of exercise.blanks) {
      const chip = getChipInBlank(blank.id)
      feedback.set(blank.id, chip?.wordKey === blank.wordKey)
    }
    setBlankCorrect(feedback)
    setSubmitted(true)
  }

  if (!open) return null

  const modal = (
    <div className="cp-army-inspect-overlay" role="presentation" onClick={onClose}>
      <div
        className="cp-army-inspect"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-army-inspect-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cp-army-inspect__head">
          <div>
            <p className="cp-army-inspect__eyebrow">军团操练</p>
            <h2 id="cp-army-inspect-title" className="cp-army-inspect__title">
              视察军队
            </h2>
          </div>
          <button type="button" className="cp-army-inspect__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {!exercise ? (
          <div className="cp-army-inspect__empty">
            <p className="cp-level-empty">词量不足，完成招募后再来视察军队。</p>
            <button type="button" className="cp-btn" onClick={onClose}>
              返回
            </button>
          </div>
        ) : (
          <>
            <div className="cp-army-inspect__meta">
              <span className="cp-army-inspect__badge">
                完形填空 · {filledCount}/{exercise.blanks.length}
              </span>
              <p className="cp-army-inspect__hint">
                {submitted
                  ? '绿色为正确，红色为错误；错误空白旁已标注正确答案'
                  : '拖拽到指定空白，或点击备选项依次填入下一个空白；点击已填词可移除'}
              </p>
            </div>

            <div className="cp-army-inspect__passage">
              <p className="cp-army-inspect__passage-text">
                {exercise.passageSegments.map((segment, index) => {
                  if (segment.type === 'text') {
                    return <span key={`text-${index}`}>{segment.text}</span>
                  }

                  const blankId = segment.blankId!
                  const blank = blankById.get(blankId)
                  const chip = getChipInBlank(blankId)
                  const correct = blankCorrect.get(blankId)
                  const showFeedback = submitted && correct !== undefined
                  const className = [
                    'cp-army-inspect-blank',
                    dragOverBlankId === blankId ? 'is-drag-over' : '',
                    activeBlankId === blankId && !submitted ? 'is-active' : '',
                    chip ? 'is-filled' : '',
                    showFeedback && correct ? 'is-correct' : '',
                    showFeedback && !correct ? 'is-wrong' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <span
                      key={blankId}
                      className={className}
                      onClick={() => handleBlankClick(blankId)}
                      onDragOver={handleBlankDragOver(blankId)}
                      onDragLeave={() => setDragOverBlankId(null)}
                      onDrop={handleBlankDrop(blankId)}
                    >
                      {chip ? (
                        <>
                          <span
                            className={[
                              'cp-army-inspect-chip',
                              'cp-army-inspect-chip--in-blank',
                              draggingChipId === chip.id ? 'is-dragging' : '',
                              showFeedback && correct ? 'is-correct' : '',
                              showFeedback && !correct ? 'is-wrong' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            draggable={!submitted}
                            onDragStart={handleDragStart(chip.id)}
                            onDragEnd={handleDragEnd}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleBlankChipClick(chip.id)
                            }}
                          >
                            {chip.label}
                          </span>
                          {showFeedback && !correct && blank && (
                            <span className="cp-army-inspect-blank-answer">
                              ✗ 应为 {blank.displayForm}
                            </span>
                          )}
                          {showFeedback && correct && (
                            <span className="cp-army-inspect-blank-mark" aria-hidden="true">
                              ✓
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="cp-army-inspect-blank-placeholder" aria-hidden="true">
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </span>
                      )}
                    </span>
                  )
                })}
              </p>
              {exercise.passageZh && (
                <p className="cp-army-inspect__passage-zh">{exercise.passageZh}</p>
              )}
            </div>

            <div
              className={`cp-army-inspect-bank${draggingChipId ? ' is-receiving' : ''}`}
              onDragOver={handleBankDragOver}
              onDrop={handleBankDrop}
            >
              <span className="cp-army-inspect-bank__label">备选项</span>
              <div className="cp-army-inspect-bank__chips">
                {bankChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={`cp-army-inspect-chip${draggingChipId === chip.id ? ' is-dragging' : ''}`}
                    draggable={!submitted}
                    onDragStart={handleDragStart(chip.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleBankChipClick(chip.id)}
                    disabled={submitted}
                  >
                    {chip.label}
                  </button>
                ))}
                {bankChips.length === 0 && !submitted && (
                  <span className="cp-army-inspect-bank__empty">所有单词已填入短文</span>
                )}
              </div>
            </div>

            <div className="cp-army-inspect__actions">
              {!submitted ? (
                <>
                  <button
                    type="button"
                    className="cp-btn cp-btn--ghost"
                    onClick={() => regenerate(round + 1)}
                  >
                    换一篇
                  </button>
                  <button
                    type="button"
                    className="cp-btn"
                    disabled={filledCount < exercise.blanks.length}
                    onClick={handleSubmit}
                  >
                    检查答案
                  </button>
                </>
              ) : (
                <>
                  <p className="cp-army-inspect__result">
                    {(() => {
                      const wrongCount = [...blankCorrect.values()].filter((v) => !v).length
                      if (wrongCount === 0) return '全部正确，军团状态良好！'
                      return `${wrongCount} 处填错，请查看标红空白与正确答案。`
                    })()}
                  </p>
                  <button type="button" className="cp-btn cp-btn--ghost" onClick={() => regenerate(round + 1)}>
                    再来一篇
                  </button>
                  <button type="button" className="cp-btn" onClick={onClose}>
                    完成视察
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
