import { getGame } from './registry'
import type { GameContext, GameResult, GameStep, LevelGameSpec } from './types'

/** 按权重无放回抽取 count 个步骤 */
function weightedPick(pool: GameStep[], count: number): GameStep[] {
  const picks: GameStep[] = []
  const remaining = [...pool]
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const total = remaining.reduce((sum, step) => sum + (step.weight ?? 1), 0)
    let r = Math.random() * total
    let idx = 0
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].weight ?? 1
      if (r <= 0) {
        idx = j
        break
      }
    }
    picks.push(remaining[idx])
    remaining.splice(idx, 1)
  }
  return picks
}

/**
 * 解析关卡的游戏步骤序列：
 * - random 模式按权重抽取；fixed / sequence 取 steps。
 * - 过滤掉「未注册」或「数据不足（canPlay=false）」的游戏，避免进到玩不了的关。
 */
export function resolveGameSteps(spec: LevelGameSpec, ctx: GameContext): GameStep[] {
  const candidates =
    spec.mode === 'random'
      ? weightedPick(spec.pool ?? [], spec.randomCount ?? 1)
      : spec.steps ?? []

  return candidates.filter((step) => {
    const plugin = getGame(step.gameId)
    return plugin ? plugin.canPlay(ctx) : false
  })
}

/** 多步关卡的整体通关判定 */
export function isLevelCleared(spec: LevelGameSpec, results: GameResult[]): boolean {
  if (results.length === 0) return false
  return spec.passRule === 'any'
    ? results.some((r) => r.cleared)
    : results.every((r) => r.cleared)
}

/** 汇总所有步骤中答对的词（去重） */
export function collectCorrectWords(results: GameResult[]): string[] {
  return [...new Set(results.flatMap((r) => r.correctWords))]
}

/** 汇总所有步骤中答错的词（去重） */
export function collectWrongWords(results: GameResult[]): string[] {
  return [...new Set(results.flatMap((r) => r.wrongWords))]
}
