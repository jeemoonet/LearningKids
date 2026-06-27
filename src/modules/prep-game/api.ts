import { apiFetch } from '../../lib/api'
import type { PrepLevel, PrepQuestion } from './types'

export async function fetchPrepLevels(): Promise<PrepLevel[]> {
  const data = await apiFetch<{ levels: PrepLevel[] }>('/prep-game/levels')
  return data.levels
}

export async function fetchPrepQuestions(
  levelId: string,
  count?: number,
): Promise<{
  levelId: string
  ruleSummary: string
  questions: PrepQuestion[]
}> {
  const params = new URLSearchParams({ levelId })
  if (count && count > 0) params.set('count', String(count))
  return apiFetch(`/prep-game/questions?${params.toString()}`)
}
