import { useEffect, useMemo, useState } from 'react'
import { GameRunner, isLevelCleared } from '../games'
import {
  buildStepChallengeIntro,
  buildStepGameContext,
  STEP_GAME_SPEC,
} from '../data/stepChallenge'
import type { BattleMapNode } from '../data/kingdomBattleMapLayout'
import type { PlanetLevel, PlanetSession } from '../types'
import type { GameResult } from '../games/types'
import { LevelIntroModal } from './LevelIntroModal'

interface MapStepChallengeProps {
  session: PlanetSession
  node: BattleMapNode
  level?: PlanetLevel
  variant?: 'waypoint' | 'consolidate'
  onComplete: () => void
  onExit: () => void
}

type Phase = 'intro' | 'play'

/** 地图路点 / 已通关关卡格试炼：先情境简报，再随机闪卡认词 */
export function MapStepChallenge({
  session,
  node,
  level,
  variant = 'waypoint',
  onComplete,
  onExit,
}: MapStepChallengeProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)

  useEffect(() => {
    setPhase('intro')
    setRound(0)
  }, [node.id, variant])

  const intro = useMemo(
    () => buildStepChallengeIntro(node, variant, level),
    [node, variant, level],
  )

  const context = useMemo(
    () => buildStepGameContext(session, round),
    [session, round],
  )

  const tagLabel = variant === 'consolidate' ? '巩固试炼' : '路途试炼'

  if (!context) {
    return (
      <div className="cp-step-challenge">
        <div className="cp-step-challenge__panel">
          <p className="cp-step-challenge__title">⚠️ 词量不足</p>
          <p className="cp-level-empty">完成招募关卡后再来挑战此处试炼。</p>
          <button type="button" className="cp-btn" onClick={onExit}>
            返回
          </button>
        </div>
      </div>
    )
  }

  const handleComplete = (results: GameResult[]) => {
    if (isLevelCleared(STEP_GAME_SPEC, results)) {
      onComplete()
      return
    }
    setRound((n) => n + 1)
    setPhase('intro')
  }

  return (
    <>
      <LevelIntroModal
        open={phase === 'intro'}
        intro={intro}
        eyebrow="试炼简报"
        onConfirm={() => setPhase('play')}
      />

      {phase === 'play' && (
        <div className="cp-step-challenge">
          <div className="cp-step-challenge__panel">
            <div className="cp-level-topbar cp-step-challenge__topbar">
              <button type="button" className="cp-back" onClick={onExit}>
                ← 返回
              </button>
              <span className="cp-level-tag">🧭 {tagLabel} · {node.label}</span>
            </div>
            <GameRunner
              key={round}
              spec={STEP_GAME_SPEC}
              context={context}
              onExit={onExit}
              onLevelComplete={handleComplete}
              fallback={
                <div className="cp-stage">
                  <p className="cp-level-empty">暂时无法生成试炼题，请稍后再试。</p>
                  <button type="button" className="cp-btn" onClick={onExit}>
                    返回
                  </button>
                </div>
              }
            />
          </div>
        </div>
      )}
    </>
  )
}
