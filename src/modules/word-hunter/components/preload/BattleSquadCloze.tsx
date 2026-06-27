import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  BattleBlank,
  BattlePassageExercise,
  BattleSquadChip,
} from '../../domain/passage/battlePassage'

type ChipLocation = 'squad' | string

interface BattleSquadClozeProps {
  exercise: BattlePassageExercise
  onReadyChange: (ready: boolean) => void
  layout?: 'default' | 'battle-prep'
  onStart?: () => void
  startDisabled?: boolean
}

export function BattleSquadCloze({
  exercise,
  onReadyChange,
  layout = 'default',
  onStart,
  startDisabled = false,
}: BattleSquadClozeProps) {
  const [chipLocations, setChipLocations] = useState<Map<string, ChipLocation>>(() => new Map())
  const [draggingChipId, setDraggingChipId] = useState<string | null>(null)
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [blankFeedback, setBlankFeedback] = useState<Map<string, boolean>>(() => new Map())

  const allChips = useMemo(
    () => [...exercise.recentSquad, ...exercise.recommendedSquad],
    [exercise.recentSquad, exercise.recommendedSquad],
  )

  const chipById = useMemo(() => new Map(allChips.map((chip) => [chip.id, chip])), [allChips])
  const blankById = useMemo(() => new Map(exercise.blanks.map((blank) => [blank.id, blank])), [exercise.blanks])

  const resetState = useCallback(() => {
    const next = new Map<string, ChipLocation>()
    for (const chip of allChips) next.set(chip.id, 'squad')
    setChipLocations(next)
    setDraggingChipId(null)
    setDragOverBlankId(null)
    setVerified(false)
    setBlankFeedback(new Map())
    onReadyChange(false)
  }, [allChips, onReadyChange])

  useEffect(() => {
    resetState()
  }, [resetState])

  const getChipInBlank = (blankId: string): BattleSquadChip | null => {
    for (const [chipId, location] of chipLocations.entries()) {
      if (location === blankId) return chipById.get(chipId) ?? null
    }
    return null
  }

  const squadChips = (squad: BattleSquadChip['squad']) =>
    (squad === 'recent' ? exercise.recentSquad : exercise.recommendedSquad).filter(
      (chip) => chipLocations.get(chip.id) === 'squad',
    )

  const filledCount = exercise.blanks.filter((blank) => getChipInBlank(blank.id)).length

  const assignChipToBlank = (chipId: string, blankId: string) => {
    if (verified) return
    const chip = chipById.get(chipId)
    const blank = blankById.get(blankId)
    if (!chip || !blank || chip.squad !== blank.squad) return

    setChipLocations((current) => {
      const next = new Map(current)
      for (const [existingChipId, location] of next.entries()) {
        if (location === blankId && existingChipId !== chipId) next.set(existingChipId, 'squad')
      }
      next.set(chipId, blankId)
      return next
    })
    setVerified(false)
    setBlankFeedback(new Map())
    onReadyChange(false)
  }

  const returnChipToSquad = (chipId: string) => {
    if (verified) return
    setChipLocations((current) => {
      const next = new Map(current)
      next.set(chipId, 'squad')
      return next
    })
    setVerified(false)
    setBlankFeedback(new Map())
    onReadyChange(false)
  }

  const handleDragStart = (chipId: string) => (event: React.DragEvent) => {
    if (verified) {
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

  const handleBlankDragOver = (blank: BattleBlank) => (event: React.DragEvent) => {
    if (verified) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverBlankId(blank.id)
  }

  const handleBlankDrop = (blankId: string) => (event: React.DragEvent) => {
    if (verified) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId) return
    assignChipToBlank(chipId, blankId)
    setDraggingChipId(null)
    setDragOverBlankId(null)
  }

  const handleSquadDragOver = (event: React.DragEvent) => {
    if (verified) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleSquadDrop = (event: React.DragEvent) => {
    if (verified) return
    event.preventDefault()
    const chipId = event.dataTransfer.getData('text/plain')
    if (!chipId || !chipById.has(chipId)) return
    returnChipToSquad(chipId)
    setDraggingChipId(null)
  }

  const handleVerify = () => {
    if (filledCount < exercise.blanks.length) return
    const feedback = new Map<string, boolean>()
    let allCorrect = true
    for (const blank of exercise.blanks) {
      const chip = getChipInBlank(blank.id)
      const correct = chip?.wordKey === blank.wordKey
      feedback.set(blank.id, Boolean(correct))
      if (!correct) allCorrect = false
    }
    setBlankFeedback(feedback)
    setVerified(allCorrect)
    onReadyChange(allCorrect)
  }

  const renderBlank = (blankId: string) => {
    const blank = blankById.get(blankId)
    if (!blank) return null
    const chip = getChipInBlank(blankId)
    const correct = blankFeedback.get(blankId)
    const className = [
      'wh-cloze-blank',
      dragOverBlankId === blankId ? 'is-drag-over' : '',
      chip ? 'is-filled' : '',
      correct === true ? 'is-correct' : '',
      correct === false ? 'is-wrong' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span
        key={blankId}
        className={className}
        onDragOver={handleBlankDragOver(blank)}
        onDragLeave={() => setDragOverBlankId(null)}
        onDrop={handleBlankDrop(blankId)}
      >
        {chip ? (
          <span
            className={`wh-cloze-chip wh-cloze-chip--in-blank${draggingChipId === chip.id ? ' is-dragging' : ''}`}
            draggable={!verified}
            onDragStart={handleDragStart(chip.id)}
            onDragEnd={handleDragEnd}
            onClick={() => returnChipToSquad(chip.id)}
          >
            {chip.label}
          </span>
        ) : (
          <span className="wh-cloze-blank-placeholder" aria-hidden="true">
            ______
          </span>
        )}
      </span>
    )
  }

  const renderSquadRow = (
    title: string,
    squad: BattleSquadChip['squad'],
    tagClass: string,
  ) => {
    const chips = squadChips(squad)
    return (
      <div
        className={`wh-squad-row wh-squad-row--${squad}${draggingChipId ? ' is-receiving' : ''}`}
        onDragOver={handleSquadDragOver}
        onDrop={handleSquadDrop}
      >
        <div className="wh-squad-row-head">
          <span className={`wh-tag ${tagClass}`}>{title}</span>
          <span className="wh-squad-row-count">{chips.length} 待列队</span>
        </div>
        <div className="wh-squad-row-chips">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className={`wh-cloze-chip wh-cloze-chip--squad${draggingChipId === chip.id ? ' is-dragging' : ''}`}
              draggable={!verified}
              onDragStart={handleDragStart(chip.id)}
              onDragEnd={handleDragEnd}
            >
              {chip.label}
            </span>
          ))}
          {chips.length === 0 && <span className="wh-squad-row-empty">已全部填入短文</span>}
        </div>
      </div>
    )
  }

  const passageBlock = (
    <div className="wh-cloze-passage">
      <p className="wh-cloze-passage-text">
        {exercise.passageSegments.map((segment, index) =>
          segment.type === 'text' ? (
            <span key={`text-${index}`}>{segment.text}</span>
          ) : (
            renderBlank(segment.blankId!)
          ),
        )}
      </p>
      {exercise.passageZh && <p className="wh-cloze-passage-zh">{exercise.passageZh}</p>}
    </div>
  )

  const squadBlock = (
    <>
      <div className="wh-squad-formations">
        {renderSquadRow('编队一 · 最近学习', 'recent', 'wh-tag--recent')}
        {renderSquadRow('编队二 · 本节推荐', 'recommended', 'wh-tag--recommended')}
      </div>

      <div className="wh-cloze-actions">
        {!verified && (
          <button
            type="button"
            className="wh-btn-secondary"
            disabled={filledCount < exercise.blanks.length}
            onClick={handleVerify}
          >
            确认列队 ({filledCount}/{exercise.blanks.length})
          </button>
        )}
        {verified &&
          (onStart ? (
            <button
              type="button"
              className="wh-btn-primary wh-btn-full wh-btn-preload-start"
              disabled={startDisabled}
              onClick={onStart}
            >
              开始战斗
            </button>
          ) : (
            <p className="wh-cloze-ready">列队完成，可以开战！</p>
          ))}
      </div>
    </>
  )

  if (layout === 'battle-prep') {
    return (
      <div className="wh-cloze-layout wh-cloze-layout--battle-prep">
        <div className="wh-cloze-passage-zone">{passageBlock}</div>
        <div className="wh-cloze-squad-zone">{squadBlock}</div>
      </div>
    )
  }

  return (
    <div className="wh-cloze-layout">
      {passageBlock}
      {squadBlock}
    </div>
  )
}
