import { apiFetch } from '../../lib/api'
import type { VocabGroup, VocabQuizOption, VocabTier, VocabTierId, VocabWord } from './types'

export async function fetchTiers(): Promise<VocabTier[]> {
  const data = await apiFetch<{ tiers: VocabTier[] }>('/vocab/tiers')
  return data.tiers
}

export async function fetchGroups(tierId: VocabTierId): Promise<{
  groups: VocabGroup[]
  hasGameGroups: boolean
}> {
  const data = await apiFetch<{ groups: VocabGroup[]; hasGameGroups?: boolean }>(
    `/vocab/groups?tierId=${encodeURIComponent(tierId)}`,
  )
  return {
    groups: data.groups,
    hasGameGroups: data.hasGameGroups ?? false,
  }
}

export async function fetchWordsByUserGroup(
  tierId: VocabTierId,
  groupIndex: number,
): Promise<VocabWord[]> {
  const data = await apiFetch<{ words: VocabWord[] }>(
    `/vocab/words?tierId=${encodeURIComponent(tierId)}&groupIndex=${groupIndex}`,
  )
  return data.words
}

export async function fetchWordsByTier(tierId: VocabTierId): Promise<VocabWord[]> {
  const data = await apiFetch<{ words: VocabWord[] }>(
    `/vocab/words?tierId=${encodeURIComponent(tierId)}`,
  )
  return data.words
}

export async function buildQuizOptions(
  word: VocabWord,
  tierId: VocabTierId,
  groupIndex: number,
): Promise<VocabQuizOption[]> {
  const data = await apiFetch<{ options: VocabQuizOption[] }>(
    `/vocab/quiz-options?wordId=${word.id}&tierId=${encodeURIComponent(tierId)}&groupIndex=${groupIndex}`,
  )
  return data.options
}

export async function updateWordCorrection(
  wordId: number,
  patch: { word?: string; meaningZh?: string },
): Promise<VocabWord> {
  const data = await apiFetch<{ word: VocabWord }>(`/vocab/words/${wordId}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  return data.word
}
