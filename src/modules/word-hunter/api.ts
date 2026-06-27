import { apiFetch } from '../../lib/api'
import type { WordHunterSession } from './types'

export interface BattlePassageWordInput {
  word: string
  meaning: string
  pos?: string
  squad: 'recent' | 'recommended'
}

export interface BattlePassageResult {
  passageEn: string
  passageZh: string
  answers: string[]
}

export function fetchWordHunterSession(sectionId: string) {
  return apiFetch<{ session: WordHunterSession }>(`/courseware/section/${sectionId}/word-hunter`)
}

export interface BattlePassageMeta {
  provider: 'qwen' | 'deepseek'
  providerLabel: string
  attemptIndex: number
}

export interface FetchBattlePassageOptions {
  extraAllowedWords?: string[]
  refreshKey?: string
  singleAttempt?: boolean
  retryHint?: string
  attemptIndex?: number
}

/** 请求 AI 实时生成战前短文完形填空 */
export function fetchBattlePassage(
  sectionId: string,
  words: BattlePassageWordInput[],
  options?: FetchBattlePassageOptions,
) {
  return apiFetch<{
    passage: BattlePassageResult
    meta?: BattlePassageMeta
    clientAttempt?: number
  }>(`/courseware/section/${sectionId}/word-hunter/passage`, {
    method: 'POST',
    body: JSON.stringify({
      words,
      extraAllowedWords: options?.extraAllowedWords,
      refreshKey: options?.refreshKey,
      singleAttempt: options?.singleAttempt,
      retryHint: options?.retryHint,
      attemptIndex: options?.attemptIndex,
    }),
  })
}

export function completeWordHunter(sectionId: string) {
  return apiFetch<{ updated: number }>(`/courseware/section/${sectionId}/word-hunter/complete`, {
    method: 'POST',
  })
}
