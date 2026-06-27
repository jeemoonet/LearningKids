import { SentenceClozeGame, type SentenceClozeConfig } from './SentenceClozeGame'
import type { GamePlugin } from '../types'

export const sentenceClozeGame: GamePlugin<SentenceClozeConfig> = {
  id: 'sentence-cloze',
  name: '选词造句',
  icon: '✍️',
  description: '从候选词中选出正确单词，完成例句填空',
  tags: ['cloze'],
  minWords: 1,
  canPlay: (ctx) => ctx.words.some((w) => Boolean(w.sentence?.includes('___'))),
  Component: SentenceClozeGame,
}

export { SentenceClozeGame }
export type { SentenceClozeConfig }
