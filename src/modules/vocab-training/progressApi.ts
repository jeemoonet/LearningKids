import { apiFetch } from '../../lib/api'
import type { VocabProgress } from './types'

const LEGACY_PROGRESS_KEY = 'vocab-user-progress-v1'
const LEGACY_DB_KEY = 'vocab-user-db-v1'

export async function loadProgressMap(): Promise<Map<string, VocabProgress>> {
  const data = await apiFetch<{ progress: VocabProgress[] }>('/progress')
  return new Map(data.progress.map((item) => [item.word, item]))
}

export async function upsertProgress(progress: VocabProgress): Promise<void> {
  await apiFetch(`/progress/${encodeURIComponent(progress.word)}`, {
    method: 'PUT',
    body: JSON.stringify(progress),
  })
}

export async function batchUpsertProgress(progressList: VocabProgress[]): Promise<number> {
  const data = await apiFetch<{ updated: number }>('/progress/batch', {
    method: 'POST',
    body: JSON.stringify({ progress: progressList }),
  })
  return data.updated
}

export async function loadCompletedGroups(): Promise<Set<string>> {
  const data = await apiFetch<{ completed: string[] }>('/progress/groups')
  return new Set(data.completed)
}

export async function markGroupCompletedOnServer(tierId: string, groupIndex: number): Promise<void> {
  await apiFetch('/progress/groups', {
    method: 'POST',
    body: JSON.stringify({ tierId, groupIndex }),
  })
}

function readLegacyProgressItems(): VocabProgress[] {
  const rawDb = localStorage.getItem(LEGACY_DB_KEY)
  if (rawDb) {
    try {
      // 旧版 sql.js 二进制库无法在此解析，跳过
    } catch {
      // ignore
    }
  }

  const raw = localStorage.getItem(LEGACY_PROGRESS_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as VocabProgress[]
  } catch {
    return []
  }
}

export async function importLocalProgressIfNeeded(): Promise<number> {
  const items = readLegacyProgressItems()
  if (items.length === 0) return 0

  const data = await apiFetch<{ imported: number }>('/progress/import-local', {
    method: 'POST',
    body: JSON.stringify({ progress: items }),
  })

  localStorage.removeItem(LEGACY_PROGRESS_KEY)
  localStorage.removeItem(LEGACY_DB_KEY)
  return data.imported
}
