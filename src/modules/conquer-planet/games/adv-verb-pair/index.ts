import type { GameContext, GamePlugin } from '../types'
import { AdvVerbPairGame, type AdvVerbPairConfig } from './AdvVerbPairGame'

export const advVerbPairGame: GamePlugin<AdvVerbPairConfig> = {
  id: 'adv-verb-pair',
  name: '副词动词搭配',
  icon: '🎩',
  description: '为动词选择合适副词，如 run → quickly',
  tags: ['matching', 'recognition'],
  minWords: 1,
  minDistractors: 2,
  canPlay: (ctx: GameContext) => {
    const pairs = ctx.meta?.pairs
    return Array.isArray(pairs) && pairs.length >= 1
  },
  Component: AdvVerbPairGame,
}

export { AdvVerbPairGame }
export type { AdvVerbPair, AdvVerbPairConfig } from './AdvVerbPairGame'
