import { apiFetch } from '../lib/api'
import { adminApiFetch, adminApiDownload } from './adminApiFetch'
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

export interface AdminWordsResponse {
  words: VocabWord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function fetchAdminWords(params: {
  q?: string
  tierId?: string
  libraryId?: string
  page?: number
  limit?: number
}): Promise<AdminWordsResponse> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.libraryId) search.set('libraryId', params.libraryId)
  else if (params.tierId) search.set('tierId', params.tierId)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  const qs = search.toString()
  return adminApiFetch<AdminWordsResponse>(`/admin/words${qs ? `?${qs}` : ''}`)
}

export async function exportAdminWords(params: {
  q?: string
  tierId?: string
  libraryId?: string
  title?: string
}): Promise<{ blob: Blob; filename: string }> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.libraryId) search.set('libraryId', params.libraryId)
  else if (params.tierId) search.set('tierId', params.tierId)
  if (params.title) search.set('title', params.title)
  const qs = search.toString()
  return adminApiDownload(`/admin/words/export${qs ? `?${qs}` : ''}`)
}

export interface AdminLibraryOption {
  id: string
  name: string
  wordCount: number
}

export async function fetchAdminLibraryOptions(): Promise<AdminLibraryOption[]> {
  const data = await adminApiFetch<{ libraries: AdminLibraryOption[] }>('/admin/libraries')
  return data.libraries
}

export interface KingdomMapPosition {
  x: number
  y: number
  region: string
}

export interface BattleMapNodeConfig {
  id: string
  x: number
  y: number
  label: string
  terrain: string
  levelId?: string
}

export interface BattleMapLayoutConfig {
  kingdomId: string
  spineBeforeFork: string[]
  spineAfterFork: string[]
  fork: {
    nodeId: string
    branches: Array<{
      id: string
      label: string
      hint: string
      nodeIds: string[]
    }>
    mergeNodeId: string
  }
  nodes: Record<string, BattleMapNodeConfig>
}

export interface AdminKingdom {
  id: string
  order: number
  name: string
  subtitle: string
  difficulty: string
  theme: string
  mapPosition: KingdomMapPosition
  hasBattleMap: boolean
  battleMapLayout: BattleMapLayoutConfig | null
  hasOverride: boolean
  updatedAt: number | null
}

export async function fetchAdminKingdoms(): Promise<AdminKingdom[]> {
  const data = await adminApiFetch<{ kingdoms: AdminKingdom[] }>('/admin/planet/kingdoms')
  return data.kingdoms
}

export async function updateAdminKingdom(
  kingdomId: string,
  patch: {
    name?: string
    subtitle?: string
    mapX?: number
    mapY?: number
    mapRegion?: string
    battleMapLayout?: BattleMapLayoutConfig | null
  },
): Promise<AdminKingdom> {
  const data = await adminApiFetch<{ kingdom: AdminKingdom }>(`/admin/planet/kingdoms/${kingdomId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return data.kingdom
}

export async function resetAdminKingdomOverride(kingdomId: string): Promise<AdminKingdom> {
  const data = await adminApiFetch<{ kingdom: AdminKingdom }>(
    `/admin/planet/kingdoms/${kingdomId}/override`,
    { method: 'DELETE' },
  )
  return data.kingdom
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

export async function deleteAdminWord(wordId: number): Promise<void> {
  await adminApiFetch(`/admin/vocab/words/${wordId}`, { method: 'DELETE' })
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
