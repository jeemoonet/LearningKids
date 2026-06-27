import { FlashcardGame, type FlashcardConfig } from './FlashcardGame'
import type { GamePlugin } from '../types'

export const flashcardGame: GamePlugin<FlashcardConfig> = {
  id: 'flashcard-recognition',
  name: '闪卡认词',
  icon: '🃏',
  description: '出现单词，四选一选释义',
  tags: ['recognition'],
  minWords: 1,
  minDistractors: 3,
  canPlay: (ctx) => ctx.words.length >= 1 && ctx.words.length + ctx.distractors.length >= 4,
  Component: FlashcardGame,
}

export { FlashcardGame }
export type { FlashcardConfig }
