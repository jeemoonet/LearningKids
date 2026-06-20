import { apiFetch } from '../lib/api'
import { adminApiFetch } from './adminApiFetch'
import type { VocabPos, VocabTierId, VocabWord } from '../modules/vocab-training/types'

export interface GameSettingItem {
  id: string
  label: string
  description: string
  available: boolean
}

export interface AdminTierGroup {
  groupIndex: number
  title: string
  groupSize: number
  passageEn: string
  passageZh: string
  wordCount: number
  words: VocabWord[]
}

export interface AdminTierGroupsResponse {
  tier: {
    id: VocabTierId
    label: string
    wordCount: number
  }
  groupSize: number
  groups: AdminTierGroup[]
  stats: {
    totalWords: number
    assignedWords: number
    unassignedWords: number
    groupCount: number
  }
}

export async function fetchGameSettings(): Promise<GameSettingItem[]> {
  const data = await adminApiFetch<{ settings: GameSettingItem[] }>('/admin/game-settings')
  return data.settings
}

export async function fetchAdminTierGroups(tierId: VocabTierId): Promise<AdminTierGroupsResponse> {
  return adminApiFetch<AdminTierGroupsResponse>(`/admin/vocab/tier-groups?tierId=${encodeURIComponent(tierId)}`)
}

export async function autoGroupTier(
  tierId: VocabTierId,
  groupSize: number,
): Promise<{ groupCount: number; wordCount: number }> {
  return adminApiFetch('/admin/vocab/auto-group', {
    method: 'POST',
    body: JSON.stringify({ tierId, groupSize }),
  })
}

export async function themeGroupTier(
  tierId: VocabTierId,
): Promise<{ groupCount: number; wordCount: number; groups: Array<{ title: string; wordCount: number }> }> {
  return adminApiFetch('/admin/vocab/theme-group', {
    method: 'POST',
    body: JSON.stringify({ tierId }),
  })
}

export async function clearTierGroups(tierId: VocabTierId): Promise<void> {
  await adminApiFetch(`/admin/vocab/tier-groups?tierId=${encodeURIComponent(tierId)}`, {
    method: 'DELETE',
  })
}

export interface AdminWordPatch {
  meaningZh?: string
  exampleEn?: string
  exampleZh?: string
  pos?: VocabPos
}

export async function updateAdminWord(
  wordId: number,
  patch: AdminWordPatch,
): Promise<VocabWord> {
  const data = await adminApiFetch<{ word: VocabWord }>(`/admin/vocab/words/${wordId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return data.word
}

export async function regenerateAdminWord(wordId: number): Promise<VocabWord> {
  const data = await adminApiFetch<{ word: VocabWord }>(`/admin/vocab/words/${wordId}/regenerate`, {
    method: 'POST',
  })
  return data.word
}

export interface AdminPassageResult {
  passageEn: string
  passageZh: string
  source: 'curated' | 'llm' | 'fallback'
}

export async function regenerateAdminPassage(
  tierId: VocabTierId,
  groupIndex: number,
): Promise<AdminPassageResult> {
  return adminApiFetch<AdminPassageResult>(
    `/admin/vocab/theme-passages/${encodeURIComponent(tierId)}/${groupIndex}/regenerate`,
    { method: 'POST' },
  )
}

export async function fetchTiersForAdmin() {
  const data = await apiFetch<{
    tiers: Array<{
      id: VocabTierId
      label: string
      wordCount: number
      groupCount: number
      groupSize: number
    }>
  }>('/vocab/tiers')
  return data.tiers
}
