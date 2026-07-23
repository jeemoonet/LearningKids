import { ReadingComprehensionGame, type ReadingComprehensionConfig } from './ReadingComprehensionGame'
import type { GamePlugin } from '../types'

const MIN_WORDS = 5

export const readingComprehensionGame: GamePlugin<ReadingComprehensionConfig> = {
  id: 'reading-comprehension',
  name: '阅读短文',
  icon: '📖',
  description: '用本关单词生成短文，完成 3 道选择题',
  tags: ['recognition', 'cloze'],
  minWords: 1,
  canPlay: (ctx) => {
    const seen = new Set<string>()
    for (const item of [...ctx.words, ...ctx.distractors]) {
      seen.add(item.word.toLowerCase())
    }
    return seen.size >= MIN_WORDS
  },
  Component: ReadingComprehensionGame,
}

export { ReadingComprehensionGame }
export type { ReadingComprehensionConfig }
