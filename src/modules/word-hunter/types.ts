import type { LevelConfig, WordEntry, WordMastery } from './domain/battle/battleTypes'

export interface WordHunterSession {
  sectionId: string
  sectionSeq: number
  level: LevelConfig
  words: WordEntry[]
  ownedWordIds: string[]
  wordMastery: Record<string, WordMastery>
}
