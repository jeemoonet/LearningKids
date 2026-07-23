import { apiDownload, apiFetch } from '../../lib/api'

export interface WordbookItem {
  wordId: number
  word: string
  meaningZh: string
  exampleEn: string
  exampleZh: string
  createdAt: number
}

export interface WordbookExportWord {
  word: string
  posLabel?: string
  meaningZh: string
  exampleEn?: string
}

export async function fetchWordbook(): Promise<WordbookItem[]> {
  const data = await apiFetch<{ items: WordbookItem[] }>('/wordbook')
  return data.items
}

export async function fetchWordbookIds(): Promise<Set<number>> {
  const data = await apiFetch<{ wordIds: number[] }>('/wordbook/ids')
  return new Set(data.wordIds)
}

export async function addToWordbook(wordId: number): Promise<void> {
  await apiFetch('/wordbook', {
    method: 'POST',
    body: JSON.stringify({ wordId }),
  })
}

export async function removeFromWordbook(wordId: number): Promise<void> {
  await apiFetch(`/wordbook/${wordId}`, { method: 'DELETE' })
}

export async function exportWordbookPdf(params: {
  title: string
  words: WordbookExportWord[]
}): Promise<{ blob: Blob; filename: string }> {
  return apiDownload('/wordbook/export', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}
