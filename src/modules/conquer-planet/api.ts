import { apiFetch } from '../../lib/api'
import type {
  BossLevelPayload,
  ForestLevelPayload,
  PlanetSession,
  RecruitLevelPayload,
  ReviewLevelPayload,
} from './types'

export function fetchPlanetSession() {
  return apiFetch<{ session: PlanetSession }>('/conquer-planet/session')
}

import type { PlanetMapConfig } from './planetMapConfig'

export function fetchPlanetConfig() {
  return apiFetch<PlanetMapConfig>('/conquer-planet/config')
}

export function fetchRecruitLevel(levelId: string) {
  return apiFetch<RecruitLevelPayload>(`/conquer-planet/levels/${levelId}/recruit`)
}

export function completeRecruitLevel(levelId: string, words: string[]) {
  return apiFetch<{ added: number; session: PlanetSession }>(
    `/conquer-planet/levels/${levelId}/recruit`,
    { method: 'POST', body: JSON.stringify({ words }) },
  )
}

export function fetchBossLevel(levelId: string) {
  return apiFetch<BossLevelPayload>(`/conquer-planet/levels/${levelId}/boss`)
}

export function completeBossLevel(levelId: string, words?: string[]) {
  return apiFetch<{ added: number; session: PlanetSession }>(
    `/conquer-planet/levels/${levelId}/boss`,
    { method: 'POST', body: JSON.stringify({ words }) },
  )
}

export function fetchReviewLevel(levelId: string) {
  return apiFetch<ReviewLevelPayload>(`/conquer-planet/levels/${levelId}/review`)
}

export function submitPlanetReview(word: string, correct: boolean) {
  return apiFetch<{ deserted: boolean; session: PlanetSession }>('/conquer-planet/review', {
    method: 'POST',
    body: JSON.stringify({ word, correct }),
  })
}

export function submitBossMicroGain(word: string) {
  return apiFetch<{ gained: boolean; familiarity: number; session: PlanetSession }>(
    '/conquer-planet/boss-micro-gain',
    { method: 'POST', body: JSON.stringify({ word }) },
  )
}

export function setPlanetWordFamiliarity(word: string, familiarity: number) {
  return apiFetch<{ familiarity: number; session: PlanetSession }>('/conquer-planet/familiarity', {
    method: 'POST',
    body: JSON.stringify({ word, familiarity }),
  })
}

export function importTargetWords(limit = 30, familiarity = 2) {
  return apiFetch<{ imported: number; session: PlanetSession }>('/conquer-planet/import-target', {
    method: 'POST',
    body: JSON.stringify({ limit, familiarity }),
  })
}

export function completeReviewLevel(levelId: string) {
  return apiFetch<{ session: PlanetSession }>(
    `/conquer-planet/levels/${levelId}/review-complete`,
    { method: 'POST' },
  )
}

export function fetchForestLevel(levelId: string) {
  return apiFetch<ForestLevelPayload>(`/conquer-planet/levels/${levelId}/forest`)
}

export function completeForestLevel(levelId: string) {
  return apiFetch<{ session: PlanetSession }>(
    `/conquer-planet/levels/${levelId}/forest-complete`,
    { method: 'POST' },
  )
}

export function resetKingdomProgress(kingdomId: string) {
  return apiFetch<{ session: PlanetSession }>(
    `/conquer-planet/kingdoms/${kingdomId}/reset`,
    { method: 'POST' },
  )
}

export function aiNameMapNodes(
  kingdomName: string,
  nodes: Array<{ id: string; terrain: string; x: number; y: number; currentLabel?: string }>,
) {
  return apiFetch<{ nodes: Record<string, { label: string; terrain: string }> }>(
    '/conquer-planet/map-nodes/ai-name',
    { method: 'POST', body: JSON.stringify({ kingdomName, nodes }) },
  )
}

export function aiNameSingleMapNode(
  kingdomName: string,
  node: { id: string; terrain: string; x: number; y: number; currentLabel?: string },
) {
  return apiFetch<{ nodes: Record<string, { label: string; terrain: string }> }>(
    '/conquer-planet/map-nodes/ai-name',
    { method: 'POST', body: JSON.stringify({ kingdomName, node }) },
  )
}
