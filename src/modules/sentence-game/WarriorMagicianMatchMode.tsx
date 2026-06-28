import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { learningApi } from '../learning/api'
import {
  buildWarriorMagicianSession,
  formatPairMeaning,
  WARRIOR_MATCH_META,
  type MatchCard,
  type WarriorMagicianSession,
} from './data/warriorMagicianMatch'
import { recordSentenceResult } from './progress'

type Phase = 'loading' | 'ready' | 'play' | 'done'

interface LineSegment {
  warriorId: string
  rightId: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface WarriorMagicianMatchModeProps {
  autoStart?: boolean
  onBack: () => void
  onComplete: () => void
}

export function WarriorMagicianMatchMode({ autoStart = false, onBack, onComplete }: WarriorMagicianMatchModeProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<WarriorMagicianSession | null>(null)
  const [loadError, setLoadError] = useState('')
  const [selectedWarrior, setSelectedWarrior] = useState<string | null>(null)
  const [connections, setConnections] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionSeed, setSessionSeed] = useState(() => Date.now())
  const [lines, setLines] = useState<LineSegment[]>([])
  const [boardSize, setBoardSize] = useState({ width: 1, height: 1 })
  const [pickHint, setPickHint] = useState(false)

  const boardRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const selectedWarriorRef = useRef<string | null>(null)

  useEffect(() => {
    selectedWarriorRef.current = selectedWarrior
  }, [selectedWarrior])

  const loadSession = useCallback(async (seed: number) => {
    setPhase('loading')
    setLoadError('')
    try {
      const { words } = await learningApi.listKnownWords()
      const next = buildWarriorMagicianSession(words, seed)
      setSession(next)
      setConnections({})
      setSelectedWarrior(null)
      selectedWarriorRef.current = null
      setChecked(false)
      setCorrectCount(0)
      setLines([])
      setPhase('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载单词库失败')
      setPhase('ready')
    }
  }, [])

  useEffect(() => {
    void loadSession(sessionSeed)
  }, [loadSession, sessionSeed])

  useEffect(() => {
    if (!autoStart || phase !== 'ready' || !session) return
    setPhase('play')
  }, [autoStart, phase, session])

  const recomputeLines = useCallback(() => {
    const board = boardRef.current
    if (!board) {
      setLines([])
      return
    }

    const boardRect = board.getBoundingClientRect()
    setBoardSize({ width: Math.max(1, boardRect.width), height: Math.max(1, boardRect.height) })

    const next: LineSegment[] = []
    for (const [warriorId, rightId] of Object.entries(connections)) {
      const leftEl = leftRefs.current[warriorId]
      const rightEl = rightRefs.current[rightId]
      if (!leftEl || !rightEl) continue

      const leftRect = leftEl.getBoundingClientRect()
      const rightRect = rightEl.getBoundingClientRect()

      next.push({
        warriorId,
        rightId,
        x1: leftRect.right - boardRect.left,
        y1: leftRect.top + leftRect.height / 2 - boardRect.top,
        x2: rightRect.left - boardRect.left,
        y2: rightRect.top + rightRect.height / 2 - boardRect.top,
      })
    }
    setLines(next)
  }, [connections])

  useLayoutEffect(() => {
    if (phase !== 'play') return
    recomputeLines()
  }, [phase, recomputeLines, session, connections])

  useEffect(() => {
    if (phase !== 'play') return undefined
    const board = boardRef.current
    if (!board) return undefined

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(recomputeLines)
    })
    observer.observe(board)
    window.addEventListener('resize', recomputeLines)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recomputeLines)
    }
  }, [phase, recomputeLines])

  const lineStatus = useMemo(() => {
    if (!checked || !session) return {}
    const map: Record<string, 'correct' | 'wrong'> = {}
    for (const [warriorId, rightId] of Object.entries(connections)) {
      const target = session.rightSide.find((item) => item.id === rightId)
      const isCorrect =
        target?.role === 'magician' && session.correctPairs[warriorId] === rightId
      map[warriorId] = isCorrect ? 'correct' : 'wrong'
    }
    return map
  }, [checked, connections, session])

  const warriorWordMap = useMemo(() => {
    if (!session) return {}
    return Object.fromEntries(session.warriors.map((item) => [item.id, item.word]))
  }, [session])

  const rightCardMap = useMemo(() => {
    if (!session) return {} as Record<string, MatchCard>
    return Object.fromEntries(session.rightSide.map((item) => [item.id, item]))
  }, [session])

  const warriorCardMap = useMemo(() => {
    if (!session) return {} as Record<string, MatchCard>
    return Object.fromEntries(session.warriors.map((item) => [item.id, item]))
  }, [session])

  const getPairMeaning = (warriorId: string, rightId: string): string | null => {
    const verb = warriorCardMap[warriorId]
    const modifier = rightCardMap[rightId]
    if (!verb || !modifier) return null
    return formatPairMeaning(verb, modifier, session?.pairPhrases)
  }

  const handleWarriorClick = (warriorId: string) => {
    if (checked || phase !== 'play') return
    setPickHint(false)
    setSelectedWarrior((prev) => (prev === warriorId ? null : warriorId))
  }

  const connectWarriorToOption = (rightId: string) => {
    if (checked || phase !== 'play') return

    const warriorId = selectedWarriorRef.current
    if (!warriorId) {
      setPickHint(true)
      window.setTimeout(() => setPickHint(false), 1600)
      return
    }

    setConnections((prev) => {
      const next = { ...prev }
      for (const [wid, rid] of Object.entries(next)) {
        if (rid === rightId && wid !== warriorId) delete next[wid]
      }
      next[warriorId] = rightId
      return next
    })
    setSelectedWarrior(null)
    selectedWarriorRef.current = null
    requestAnimationFrame(recomputeLines)
  }

  const handleClearWarrior = (warriorId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (checked || phase !== 'play') return
    setConnections((prev) => {
      const next = { ...prev }
      delete next[warriorId]
      return next
    })
    if (selectedWarrior === warriorId) {
      setSelectedWarrior(null)
      selectedWarriorRef.current = null
    }
    requestAnimationFrame(recomputeLines)
  }

  const handleStart = () => setPhase('play')

  const handleCheck = () => {
    if (!session || checked) return
    const allConnected = session.warriors.every((w) => connections[w.id])
    if (!allConnected) return

    let correct = 0
    for (const warrior of session.warriors) {
      const rightId = connections[warrior.id]
      const target = session.rightSide.find((item) => item.id === rightId)
      if (target?.role === 'magician' && session.correctPairs[warrior.id] === rightId) {
        correct += 1
      }
    }
    setCorrectCount(correct)
    setChecked(true)

    if (correct >= session.warriors.length) {
      recordSentenceResult(WARRIOR_MATCH_META.id, correct, session.warriors.length)
    }
  }

  const handleRetry = () => {
    setSessionSeed(Date.now())
  }

  const passed = checked && session != null && correctCount >= session.warriors.length
  const connectedCount = session ? session.warriors.filter((w) => connections[w.id]).length : 0

  return (
    <section className="sentence-challenge sentence-challenge-pc wm-match-mode">
      <div className="sentence-challenge-playhead">
        <button type="button" className="prep-spirit-detail-back-link" onClick={onBack}>
          {autoStart ? '← 返回介绍' : '← 返回关卡'}
        </button>
      </div>

      {phase === 'loading' && <p className="sentence-status">正在从你的单词库生成配对…</p>}
      {loadError && <p className="sentence-status sentence-status-error">{loadError}</p>}

      {!autoStart && phase === 'ready' && session && (
        <div className="sentence-challenge-intro">
          <h2>{WARRIOR_MATCH_META.title}</h2>
          <p>
            左侧 {session.warriors.length} 个动词，右侧 {session.rightSide.length} 个备选词。
            请为每个动词找出合适的修饰词并完成连线。
          </p>
          <ul className="sentence-challenge-rules">
            <li>先点左侧动词，再点右侧词语完成连线</li>
            <li>双击已连线的动词可取消连线</li>
            <li>连线后会在左侧动词下方显示组合含义</li>
            <li>词组来自你已掌握的单词库</li>
          </ul>
          <div className="sentence-challenge-intro-actions">
            <button type="button" className="sentence-challenge-start-button" onClick={handleStart}>
              开始连线
            </button>
            <button type="button" className="sentence-challenge-secondary-button" onClick={handleRetry}>
              换一批词
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && session && (
        <div className="sentence-challenge-board wm-match-board">
          {checked && (
            <div className="sentence-challenge-hud">
              <div className="sentence-challenge-stat">
                <span className="sentence-challenge-stat-label">正确</span>
                <span className="sentence-challenge-stat-value">
                  {correctCount}/{session.warriors.length}
                </span>
              </div>
            </div>
          )}

          <p className={`wm-match-hint${pickHint ? ' is-alert' : ''}`}>
            {checked
              ? passed
                ? '全部配对正确！'
                : '红色连线表示配对有误，请再试一次。'
              : selectedWarrior
                ? `已选中「${warriorWordMap[selectedWarrior]}」，请点击右侧词语完成连线`
                : `已连线 ${connectedCount}/${session.warriors.length} · 先点左侧动词，再点右侧词语`}
          </p>

          <div className="wm-match-center">
            <div className="wm-match-stage" ref={boardRef}>
              <div className="wm-match-col wm-match-col--left">
                <p className="wm-match-col-label">动词</p>
                {session.warriors.map((card) => {
                  const linkedRightId = connections[card.id]
                  const status = lineStatus[card.id]
                  const pairMeaning = linkedRightId ? getPairMeaning(card.id, linkedRightId) : null
                  return (
                    <button
                      key={card.id}
                      type="button"
                      ref={(el) => { leftRefs.current[card.id] = el }}
                      className={[
                        'wm-card wm-card--warrior',
                        selectedWarrior === card.id ? 'is-selected' : '',
                        linkedRightId ? 'is-connected' : '',
                        status === 'correct' ? 'is-correct' : '',
                        status === 'wrong' ? 'is-wrong' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleWarriorClick(card.id)}
                      onDoubleClick={(event) => handleClearWarrior(card.id, event)}
                    >
                      <span className="wm-card-word">{card.word}</span>
                      {pairMeaning && (
                        <span className="wm-card-combo">{pairMeaning}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="wm-match-bridge" aria-hidden="true" />

              <div className="wm-match-col wm-match-col--right">
                <p className="wm-match-col-label">备选词</p>
                {session.rightSide.map((card) => {
                  const linkedWarriorId = Object.entries(connections).find(([, rid]) => rid === card.id)?.[0]
                  const status = linkedWarriorId ? lineStatus[linkedWarriorId] : undefined
                  return (
                    <button
                      key={card.id}
                      type="button"
                      ref={(el) => { rightRefs.current[card.id] = el }}
                      className={[
                        'wm-card wm-card--option',
                        selectedWarrior ? 'is-targetable' : '',
                        linkedWarriorId ? 'is-connected' : '',
                        status === 'correct' ? 'is-correct' : '',
                        status === 'wrong' ? 'is-wrong' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => connectWarriorToOption(card.id)}
                    >
                      <span className="wm-card-word">{card.word}</span>
                    </button>
                  )
                })}
              </div>

              <svg
                className="wm-match-lines"
                width={boardSize.width}
                height={boardSize.height}
                viewBox={`0 0 ${boardSize.width} ${boardSize.height}`}
                aria-hidden="true"
              >
                {lines.map((line) => {
                  const status = lineStatus[line.warriorId]
                  return (
                    <line
                      key={`${line.warriorId}-${line.rightId}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      className={`wm-match-line${status ? ` wm-match-line--${status}` : ''}`}
                    />
                  )
                })}
              </svg>
            </div>
          </div>

          <div className="wm-match-actions">
            {!checked && (
              <button
                type="button"
                className="sentence-challenge-start-button"
                onClick={handleCheck}
                disabled={connectedCount < session.warriors.length}
              >
                核对答案
              </button>
            )}
            {checked && (
              <>
                <button type="button" className="sentence-challenge-start-button" onClick={handleRetry}>
                  {passed ? '再练一轮' : '换一批词'}
                </button>
                {passed && (
                  <button type="button" className="sentence-challenge-secondary-button" onClick={onComplete}>
                    返回关卡列表
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
