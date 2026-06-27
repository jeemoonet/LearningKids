import { apiFetch } from '../../lib/api'
import type { SentenceLevel, SentenceQuestion, StructurePuzzle } from './types'

export async function fetchSentenceLevels(): Promise<SentenceLevel[]> {
  const data = await apiFetch<{ levels: SentenceLevel[] }>('/sentence-game/levels')
  return data.levels
}

export async function fetchSentenceQuestions(
  levelId: string,
  count?: number,
  excludeKeys?: string[],
): Promise<{
  levelId: string
  ruleSummary: string
  questions: SentenceQuestion[]
}> {
  const params = new URLSearchParams({ levelId, _: String(Date.now()) })
  if (count && count > 0) params.set('count', String(count))
  if (excludeKeys && excludeKeys.length > 0) {
    params.set('exclude', JSON.stringify(excludeKeys))
  }
  return apiFetch(`/sentence-game/questions?${params.toString()}`, { cache: 'no-store' })
}

export async function fetchStructurePuzzles(
  levelId: string,
  count?: number,
): Promise<{
  levelId: string
  ruleSummary: string
  puzzles: StructurePuzzle[]
}> {
  const params = new URLSearchParams({ levelId, _: String(Date.now()) })
  if (count && count > 0) params.set('count', String(count))
  return apiFetch(`/sentence-game/structure-puzzles?${params.toString()}`, { cache: 'no-store' })
}
