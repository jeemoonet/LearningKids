import { apiFetch } from '../../lib/api'
import type {
  CreateBatchResponse,
  FreeVocabDrawResponse,
  FreeVocabInitStatus,
  FreeVocabKeepResponse,
  FreeVocabProgress,
  PatternInfo,
  SelectWordsResponse,
  SentencePattern,
} from './types'

const DEFAULT_TIER = 'beginner'

export async function fetchInitStatus(tierId = DEFAULT_TIER): Promise<FreeVocabInitStatus> {
  return apiFetch<FreeVocabInitStatus>(`/free-vocab/init/status?tierId=${encodeURIComponent(tierId)}`)
}

export async function drawInitWords(tierId = DEFAULT_TIER): Promise<FreeVocabDrawResponse> {
  return apiFetch<FreeVocabDrawResponse>('/free-vocab/init/draw', {
    method: 'POST',
    body: JSON.stringify({ tierId }),
  })
}

export async function keepInitWords(
  words: string[],
  tierId = DEFAULT_TIER,
): Promise<FreeVocabKeepResponse> {
  return apiFetch<FreeVocabKeepResponse>('/free-vocab/init/keep', {
    method: 'POST',
    body: JSON.stringify({ tierId, words }),
  })
}

export async function fetchPatterns(): Promise<PatternInfo[]> {
  const data = await apiFetch<{ patterns: PatternInfo[] }>('/free-vocab/patterns')
  return data.patterns
}

export async function fetchFreeVocabProgress(tierId = DEFAULT_TIER): Promise<FreeVocabProgress> {
  return apiFetch<FreeVocabProgress>(`/free-vocab/progress?tierId=${encodeURIComponent(tierId)}`)
}

export async function selectWordsForPattern(
  pattern: SentencePattern,
  options: { tierId?: string; count?: number; excludeWords?: string[] } = {},
): Promise<SelectWordsResponse> {
  return apiFetch<SelectWordsResponse>('/free-vocab/select', {
    method: 'POST',
    body: JSON.stringify({
      tierId: options.tierId ?? DEFAULT_TIER,
      pattern,
      count: options.count,
      excludeWords: options.excludeWords,
    }),
  })
}

export async function confirmBatch(
  pattern: SentencePattern,
  words: Array<{ word: string; role?: string | null }>,
  tierId = DEFAULT_TIER,
): Promise<CreateBatchResponse> {
  return apiFetch<CreateBatchResponse>('/free-vocab/batch', {
    method: 'POST',
    body: JSON.stringify({ tierId, pattern, words }),
  })
}

export async function abandonActiveBatch(): Promise<void> {
  await apiFetch('/free-vocab/batch/abandon', { method: 'POST', body: '{}' })
}
