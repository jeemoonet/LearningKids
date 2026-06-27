import { SpellFillGame, type SpellFillConfig } from './SpellFillGame'
import type { GamePlugin } from '../types'

export const spellFillGame: GamePlugin<SpellFillConfig> = {
  id: 'spell-fill',
  name: '拼写挖空',
  icon: '🔤',
  description: '补全单词中缺失的 2-3 个字母',
  tags: ['spelling'],
  minWords: 1,
  canPlay: (ctx) => ctx.words.length >= 1,
  Component: SpellFillGame,
}

export { SpellFillGame }
export type { SpellFillConfig }
