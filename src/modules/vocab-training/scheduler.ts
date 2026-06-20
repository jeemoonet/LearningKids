import { isFreeAccessScene, parseGroupTheme } from './groupCover'
import type { VocabProgress, VocabTierId, VocabWord } from './types'
import {
  loadCompletedGroups as loadCompletedFromServer,
  loadProgressMap as loadFromServer,
  markGroupCompletedOnServer,
  upsertProgress,
} from './progressApi'

export function familiarityLabel(level: number): string {
  const labels = ['', '不熟悉', '一般', '熟悉', '较熟', '非常熟悉']
  return labels[level] ?? '不熟悉'
}

export const MAX_FLASHCARD_SELF_MARK = 3

export const FLASHCARD_MARK_OPTIONS = [
  { level: 1, label: '不熟悉' },
  { level: 2, label: '一般' },
  { level: 3, label: '熟悉' },
] as const

export const FULLY_MASTERED_LEVEL = 5

export const INIT_CHUNK_SIZE = 20

/** 每组词性目标：名词 40%、动词 30%、其他 30% */
export const INIT_GROUP_POS_RATIO = {
  noun: 0.4,
  verb: 0.3,
  other: 0.3,
} as const

function studySort(
  words: VocabWord[],
  progressMap: Map<string, VocabProgress>,
): VocabWord[] {
  return [...words].sort((a, b) => {
    const fa = progressMap.get(a.word)?.familiarity ?? 1
    const fb = progressMap.get(b.word)?.familiarity ?? 1
    if (fa !== fb) return fa - fb
    return a.sortOrder - b.sortOrder
  })
}

function posTargetsForGroupSize(groupSize: number): Record<'noun' | 'verb' | 'other', number> {
  const noun = Math.round(groupSize * INIT_GROUP_POS_RATIO.noun)
  const verb = Math.round(groupSize * INIT_GROUP_POS_RATIO.verb)
  return { noun, verb, other: groupSize - noun - verb }
}

export function buildStudyChunks(
  words: VocabWord[],
  progressMap: Map<string, VocabProgress>,
  chunkSize = INIT_CHUNK_SIZE,
): VocabWord[][] {
  const needStudy = words.filter((word) => !isFullyMastered(progressMap.get(word.word)))
  const targets = posTargetsForGroupSize(chunkSize)

  const pools: Record<'noun' | 'verb' | 'other', VocabWord[]> = {
    noun: studySort(needStudy.filter((word) => word.pos === 'noun'), progressMap),
    verb: studySort(needStudy.filter((word) => word.pos === 'verb'), progressMap),
    other: studySort(
      needStudy.filter((word) => word.pos !== 'noun' && word.pos !== 'verb'),
      progressMap,
    ),
  }

  const chunks: VocabWord[][] = []
  const posOrder: Array<'noun' | 'verb' | 'other'> = ['noun', 'verb', 'other']

  const hasRemaining = () => posOrder.some((pos) => pools[pos].length > 0)

  while (hasRemaining()) {
    const chunk: VocabWord[] = []
    let deficit = 0

    for (const pos of posOrder) {
      const takeCount = Math.min(targets[pos], pools[pos].length)
      chunk.push(...pools[pos].splice(0, takeCount))
      deficit += targets[pos] - takeCount
    }

    while (deficit > 0 && hasRemaining()) {
      for (const pos of posOrder) {
        if (deficit <= 0 || pools[pos].length === 0) continue
        chunk.push(pools[pos].shift()!)
        deficit -= 1
      }
    }

    if (chunk.length > 0) chunks.push(chunk)
  }

  return chunks
}

export function isInitMarked(progress: VocabProgress | undefined): boolean {
  return (progress?.selfMarked ?? 0) > 0
}

export function isFullyMastered(progress: VocabProgress | undefined): boolean {
  return (progress?.familiarity ?? 1) >= FULLY_MASTERED_LEVEL
}

export function markFullyMastered(progress: VocabProgress, seenCount: number): VocabProgress {
  return {
    ...progress,
    familiarity: FULLY_MASTERED_LEVEL,
    selfMarked: FULLY_MASTERED_LEVEL,
    consecutiveCorrect: Math.max(progress.consecutiveCorrect, FULLY_MASTERED_LEVEL),
    lastSeen: seenCount,
    nextDue: Number.MAX_SAFE_INTEGER,
  }
}

export function reviewInterval(familiarity: number): number {
  switch (familiarity) {
    case 1:
      return 1
    case 2:
      return 2
    case 3:
      return 4
    case 4:
      return 8
    case 5:
      return 16
    default:
      return 1
  }
}

export function computeNextDue(familiarity: number, seenCount: number): number {
  return seenCount + reviewInterval(familiarity)
}

export function applySelfMark(progress: VocabProgress, mark: number, seenCount: number): VocabProgress {
  const familiarity = Math.min(MAX_FLASHCARD_SELF_MARK, Math.max(1, mark))
  return {
    ...progress,
    familiarity,
    selfMarked: familiarity,
    consecutiveCorrect: familiarity >= 4 ? progress.consecutiveCorrect : 0,
    lastSeen: seenCount,
    nextDue: computeNextDue(familiarity, seenCount),
  }
}

export function applyQuizResult(
  progress: VocabProgress,
  correct: boolean,
  seenCount: number,
): VocabProgress {
  const now = Date.now()
  const examCount = progress.examCount + 1
  const examErrorCount = correct ? progress.examErrorCount : progress.examErrorCount + 1

  if (!correct) {
    return {
      ...progress,
      examCount,
      examErrorCount,
      lastExamAt: now,
      consecutiveCorrect: 0,
      familiarity: Math.max(1, progress.familiarity - 2),
      lastSeen: seenCount,
      nextDue: seenCount + 1,
    }
  }

  const familiarity = progress.familiarity + 1
  const consecutiveCorrect = progress.consecutiveCorrect + 1

  return {
    ...progress,
    examCount,
    examErrorCount,
    lastExamAt: now,
    consecutiveCorrect,
    familiarity,
    lastSeen: seenCount,
    nextDue: computeNextDue(Math.min(familiarity, FULLY_MASTERED_LEVEL), seenCount),
  }
}

export function isGroupCompleted(
  words: VocabWord[],
  progressMap: Map<string, VocabProgress>,
): boolean {
  if (words.length === 0) return false
  const mastered = words.filter((word) => (progressMap.get(word.word)?.familiarity ?? 1) >= 4).length
  return mastered / words.length >= 0.8
}

export function pickStudyWords(
  words: VocabWord[],
  progressMap: Map<string, VocabProgress>,
  seenCount: number,
  limit = 20,
): VocabWord[] {
  const activeWords = words.filter((word) => !isFullyMastered(progressMap.get(word.word)))
  if (activeWords.length === 0) return []

  const scored = activeWords.map((word) => {
    const progress = progressMap.get(word.word)
    const familiarity = progress?.familiarity ?? 1
    const nextDue = progress?.nextDue ?? 0
    const overdue = Math.max(0, seenCount - nextDue)
    const score = overdue * 10 + (6 - familiarity) * 3 + (progress?.consecutiveCorrect ?? 0) * -0.5
    return { word, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, Math.min(limit, activeWords.length)).map((item) => item.word)
}

export async function loadProgressMap(): Promise<Map<string, VocabProgress>> {
  return loadFromServer()
}

export async function saveSingleProgress(progress: VocabProgress): Promise<void> {
  await upsertProgress(progress)
}

export function ensureProgress(
  progressMap: Map<string, VocabProgress>,
  word: string,
): VocabProgress {
  const existing = progressMap.get(word)
  if (existing) return existing
  const created: VocabProgress = {
    word,
    familiarity: 1,
    examCount: 0,
    examErrorCount: 0,
    lastExamAt: null,
    consecutiveCorrect: 0,
    selfMarked: 0,
    lastSeen: 0,
    nextDue: 0,
  }
  progressMap.set(word, created)
  return created
}

export function groupProgressSummary(
  words: VocabWord[],
  progressMap: Map<string, VocabProgress>,
): { mastered: number; total: number; percent: number } {
  const total = words.length
  const mastered = words.filter((word) => (progressMap.get(word.word)?.familiarity ?? 1) >= 4).length
  return {
    mastered,
    total,
    percent: total === 0 ? 0 : Math.round((mastered / total) * 100),
  }
}

export async function loadCompletedGroups(): Promise<Set<string>> {
  return loadCompletedFromServer()
}

export async function markGroupCompleted(tierId: VocabTierId, groupIndex: number): Promise<void> {
  await markGroupCompletedOnServer(tierId, groupIndex)
}

export function isGroupUnlocked(
  tierId: VocabTierId,
  groupIndex: number,
  completedGroups: Set<string>,
  groupTitle?: string,
): boolean {
  if (groupTitle && isFreeAccessScene(parseGroupTheme(groupTitle))) return true
  if (groupIndex <= 1) return true
  return completedGroups.has(`${tierId}:${groupIndex - 1}`)
}

export function tierLabel(tierId: VocabTierId): string {
  const map: Record<VocabTierId, string> = {
    beginner: '初级组',
    intermediate: '中级组',
    advanced: '高级组',
  }
  return map[tierId]
}
