import type { SentenceLevelProgress, SentenceProgressMap } from './types'
import { learningApi } from '../learning/api'
import { emitPlayerStatsDirty } from '../learning/playerStatsEvents'

const STORAGE_KEY = 'learningkids:sentence-game-progress'

export function loadSentenceProgress(): SentenceProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SentenceProgressMap
  } catch {
    return {}
  }
}

export function saveSentenceProgress(map: SentenceProgressMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function recordSentenceResult(
  levelId: string,
  correctCount: number,
  totalQuestions: number,
): SentenceLevelProgress {
  const map = loadSentenceProgress()
  const previous = map[levelId]
  const passed = correctCount >= totalQuestions
  const next: SentenceLevelProgress = {
    bestScore: Math.max(previous?.bestScore ?? 0, correctCount),
    totalQuestions,
    passed: (previous?.passed ?? false) || passed,
    lastPlayedAt: Date.now(),
  }
  map[levelId] = next
  saveSentenceProgress(map)
  void learningApi
    .submitGrammarResult({
      module: 'sentence',
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

export function isSentenceLevelUnlocked(
  levelId: string,
  levels: Array<{ id: string; track: string }>,
): boolean {
  if (levelId === 'boss') {
    const required = levels.filter((level) => level.track !== 'boss')
    const map = loadSentenceProgress()
    const passedCount = required.filter((level) => map[level.id]?.passed).length
    return passedCount >= 4
  }

  const current = levels.find((level) => level.id === levelId)
  if (!current) return false

  const sameTrack = levels.filter((level) => level.track === current.track && level.track !== 'boss')
  const trackIndex = sameTrack.findIndex((level) => level.id === levelId)
  if (trackIndex <= 0) return true

  const previous = sameTrack[trackIndex - 1]
  return loadSentenceProgress()[previous.id]?.passed ?? false
}
