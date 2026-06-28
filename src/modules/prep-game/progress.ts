import type { PrepLevelProgress, PrepProgressMap } from './types'
import { learningApi } from '../learning/api'
import { emitPlayerStatsDirty } from '../learning/playerStatsEvents'

const STORAGE_KEY = 'learningkids:prep-game-progress'

export function loadPrepProgress(): PrepProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PrepProgressMap
  } catch {
    return {}
  }
}

export function savePrepProgress(map: PrepProgressMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function recordPrepResult(
  levelId: string,
  correctCount: number,
  totalQuestions: number,
): PrepLevelProgress {
  const map = loadPrepProgress()
  const previous = map[levelId]
  const passed = correctCount >= totalQuestions
  const next: PrepLevelProgress = {
    bestScore: Math.max(previous?.bestScore ?? 0, correctCount),
    totalQuestions,
    passed: (previous?.passed ?? false) || passed,
    lastPlayedAt: Date.now(),
  }
  map[levelId] = next
  savePrepProgress(map)
  void learningApi
    .submitGrammarResult({
      module: 'prep',
      skillId: levelId,
      correctCount,
      totalQuestions,
    })
    .then((res) => {
      if (res.magicGained > 0 || res.levelUp) emitPlayerStatsDirty()
    })
    .catch(() => undefined)
  return next
}

/** 三个精灵家族及关卡均可随时进入，无需解锁 */
export function isLevelUnlocked(_levelId: string, _levels: Array<{ id: string; track: string }>): boolean {
  return true
}
