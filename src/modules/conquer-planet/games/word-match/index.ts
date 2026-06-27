import { WordMatchGame, type WordMatchConfig } from './WordMatchGame'
import type { GamePlugin } from '../types'

export const wordMatchGame: GamePlugin<WordMatchConfig> = {
  id: 'word-match',
  name: '词义连线',
  icon: '🔗',
  description: '把单词和对应的中文意思配对连线',
  tags: ['matching'],
  minWords: 2,
  canPlay: (ctx) => ctx.words.length >= 2,
  Component: WordMatchGame,
}

export { WordMatchGame }
export type { WordMatchConfig }
