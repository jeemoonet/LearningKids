import { apiFetch } from '../../lib/api'

export interface WordbookItem {
  wordId: number
  word: string
  meaningZh: string
  exampleEn: string
  exampleZh: string
  createdAt: number
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
