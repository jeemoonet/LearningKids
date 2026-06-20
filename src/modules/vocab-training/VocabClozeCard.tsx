import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ClozeExercise, ClozeWordChip } from './clozeGenerator'
import type { VocabWord } from './types'
import { VocabTranslateButton } from './VocabTranslateButton'

type ChipLocation = 'bank' | string

interface VocabClozeCardProps {
  exercise: ClozeExercise
  words: VocabWord[]
  variantCount?: number
  onRefresh?: () => void
  onComplete: (results: Array<{ wordKey: string; correct: boolean }>) => void
}

interface BlankFeedback {
  correct: boolean
}

export function VocabClozeCard({
  exercise,
  words,
  variantCount = 1,
  onRefresh,
  onComplete,
}: VocabClozeCardProps) {
  const [chipLocations, setChipLocations] = useState<Map<string, ChipLocation>>(() => new Map())
  const [draggingChipId, setDraggingChipId] = useState<string | null>(null)
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [blankFeedback, setBlankFeedback] = useState<Map<string, BlankFeedback>>(() => new Map())
  const [showZh, setShowZh] = useState(false)

  const chipById = useMemo(() => {
    const map = new Map<string, ClozeWordChip>()
    for (const chip of exercise.wordBank) {
      map.set(chip.id, chip)
    }
    return map
  }, [exercise.wordBank])

  const blankById = useMemo(() => {
    const map = new Map(exercise.blanks.map((blank) => [blank.id, blank]))
    return map
  }, [exercise.blanks])

  const bankChips = useMemo(
    () => exercise.wordBank.filter((chip) => chipLocations.get(chip.id) === 'bank'),
    [exercise.wordBank, chipLocations],
  )

  const filledCount = useMemo(() => {
    return exercise.blanks.filter((blank) => {
      for (const [chipId, location] of chipLocations.entries()) {
        if (location === blank.id && chipById.has(chipId)) return true
      }
      return false
    }).length
  }, [exercise.blanks, chipLocations, chipById])

  const resetState = useCallback(() => {
    const next = new Map<string, ChipLocation>()
    for (const chip of exercise.wordBank) {
      next.set(chip.id, 'bank')
    }
    setChipLocations(next)
    setDraggingChipId(null)
    setDragOverBlankId(null)
    setSubmitted(false)
    setBlankFeedback(new Map())
    setShowZh(false)
  }, [exercise])

  useEffect(() => {
    resetState()
  }, [resetState])

  const getChipInBlank = (blankId: string): ClozeWordChip | null => {
    for (const [chipId, location] of chipLocations.entries()) {
      if (location === blankId) {
        return chipById.get(chipId) ?? null
      }
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

      const previousLocation = next.get(chipId)
      if (previousLocation && previousLocation !== 'bank' && previousLocation !== blankId) {
        next.set(chipId, 'bank')
      }

      next.set(chipId, blankId)
      return next
    })
  }

  const returnChipToBank = (chipId: string) => {
    if (submitted) return
    setChipLocations((current) => {
      const next = new Map(current)
      next.set(chipId, 'bank')
      return next
    })
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

  const handleBlankDragLeave = () => {
    setDragOverBlankId(null)
  }

  const handleBlankDrop = (blankId: string) => (event: React.DragEvent) => {
    if (submitted) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    assignChipToBlank(chipId, blankId)
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
    if (submitted || filledCount < exercise.blanks.length) return

    const feedback = new Map<string, BlankFeedback>()
    const results: Array<{ wordKey: string; correct: boolean }> = []

    for (const blank of exercise.blanks) {
      const chip = getChipInBlank(blank.id)
      const correct = chip?.wordKey === blank.wordKey
      feedback.set(blank.id, { correct })
      results.push({ wordKey: blank.wordKey, correct })
    }

    setBlankFeedback(feedback)
    setSubmitted(true)
    window.setTimeout(() => onComplete(results), 900)
  }

  const hasZh = Boolean(exercise.passageZh?.trim())

  return (
    <div className="vocab-cloze-card">
      <div className="vocab-cloze-head">
        <div className="vocab-cloze-head-left">
          <span className="vocab-card-badge">
            完形填空 · {filledCount}/{exercise.blanks.length}
          </span>
          {onRefresh && (
            <button
              type="button"
              className="vocab-cloze-refresh icon-button"
              onClick={onRefresh}
              disabled={submitted}
              aria-label="换一篇短文"
              title={
                variantCount > 1
                  ? `换一篇短文（共 ${variantCount} 种）`
                  : '换一篇短文（重新打乱单词顺序）'
              }
            >
              <svg
                className="vocab-cloze-refresh-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 0 1-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                />
              </svg>
            </button>
          )}
        </div>
        <p className="vocab-cloze-hint">将下方单词拖入短文中对应的空白处</p>
      </div>

      <div className="vocab-cloze-passage">
        <p className="vocab-passage-en vocab-cloze-passage-text">
          {exercise.passageSegments.map((segment, index) => {
            if (segment.type === 'text') {
              return <span key={`text-${index}`}>{segment.text}</span>
            }

            const blankId = segment.blankId!
            const blank = blankById.get(blankId)
            const chip = getChipInBlank(blankId)
            const feedback = blankFeedback.get(blankId)
            const className = [
              'vocab-cloze-blank',
              dragOverBlankId === blankId ? 'is-drag-over' : '',
              chip ? 'is-filled' : '',
              feedback?.correct === true ? 'is-correct' : '',
              feedback?.correct === false ? 'is-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <span
                key={blankId}
                className={className}
                onDragOver={handleBlankDragOver(blankId)}
                onDragLeave={handleBlankDragLeave}
                onDrop={handleBlankDrop(blankId)}
                title={submitted && blank ? `正确答案：${blank.displayForm}` : undefined}
              >
                {chip ? (
                  <span
                    className={`vocab-cloze-chip vocab-cloze-chip--in-blank${draggingChipId === chip.id ? ' is-dragging' : ''}`}
                    draggable={!submitted}
                    onDragStart={handleDragStart(chip.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {chip.label}
                  </span>
                ) : (
                  <span className="vocab-cloze-blank-placeholder" aria-hidden="true">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                )}
              </span>
            )
          })}
          {hasZh && (
            <VocabTranslateButton
              show={showZh}
              onToggle={() => setShowZh((value) => !value)}
              className="vocab-translate-button-inline"
            />
          )}
        </p>
        {showZh && hasZh && <p className="vocab-passage-zh">{exercise.passageZh}</p>}
      </div>

      <div
        className={`vocab-cloze-bank${draggingChipId ? ' is-receiving' : ''}`}
        onDragOver={handleBankDragOver}
        onDrop={handleBankDrop}
      >
        <span className="vocab-cloze-bank-label">单词区</span>
        <div className="vocab-cloze-bank-chips">
          {bankChips.map((chip) => (
            <span
              key={chip.id}
              className={`vocab-cloze-chip${draggingChipId === chip.id ? ' is-dragging' : ''}`}
              draggable={!submitted}
              onDragStart={handleDragStart(chip.id)}
              onDragEnd={handleDragEnd}
            >
              {chip.label}
            </span>
          ))}
          {bankChips.length === 0 && !submitted && (
            <span className="vocab-cloze-bank-empty">所有单词已填入短文</span>
          )}
        </div>
      </div>

      <div className="vocab-cloze-actions">
        {!submitted && (
          <button
            type="button"
            className="vocab-cloze-submit"
            disabled={filledCount < exercise.blanks.length}
            onClick={handleSubmit}
          >
            检查答案
          </button>
        )}
        {submitted && <p className="vocab-cloze-checking">正在记录结果…</p>}
      </div>

      {words.length > 0 && (
        <p className="vocab-cloze-footnote">
          本组共 {words.length} 个单词，短文中有 {exercise.blanks.length} 处挖空
          {exercise.blanks.length < words.length ? '（部分单词未出现在短文中）' : ''}
        </p>
      )}
    </div>
  )
}
