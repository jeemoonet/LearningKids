import { useMemo, useRef, useState, type ReactNode } from 'react'
import { getGame } from './registry'
import { resolveGameSteps } from './selectGames'
import type { GameContext, GameResult, LevelGameSpec } from './types'

interface GameRunnerProps {
  spec: LevelGameSpec
  context: GameContext
  /** 全部步骤完成后回调，关卡侧据此结算奖励 */
  onLevelComplete: (results: GameResult[]) => void
  /** 玩家中途退出 */
  onExit: () => void
  /** 无可运行游戏时的兜底 UI（数据不足 / 未注册） */
  fallback?: ReactNode
}

/**
 * 运行容器：玩法与奖励的解耦层。
 * 根据 LevelGameSpec 选游戏 → 依次渲染插件 → 收集结果 → 交给关卡结算。
 */
export function GameRunner({ spec, context, onLevelComplete, onExit, fallback }: GameRunnerProps) {
  const steps = useMemo(() => resolveGameSteps(spec, context), [spec, context])
  const [idx, setIdx] = useState(0)
  const resultsRef = useRef<GameResult[]>([])

  if (steps.length === 0) {
    return <>{fallback ?? null}</>
  }

  const step = steps[idx]
  const plugin = step ? getGame(step.gameId) : undefined
  if (!plugin) {
    return <>{fallback ?? null}</>
  }

  const handleComplete = (result: GameResult) => {
    resultsRef.current = [...resultsRef.current, result]
    if (idx + 1 < steps.length) {
      setIdx((i) => i + 1)
    } else {
      onLevelComplete(resultsRef.current)
    }
  }

  const Game = plugin.Component
  return (
    <Game
      key={`${step.gameId}-${idx}`}
      context={context}
      config={step.config}
      onComplete={handleComplete}
      onExit={onExit}
    />
  )
}
