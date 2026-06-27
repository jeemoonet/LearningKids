import { EnemyDuelGame, type EnemyDuelMeta } from './EnemyDuelGame'
import type { GameContext, GamePlugin } from '../types'

function hasBossPayload(ctx: GameContext): boolean {
  return Boolean((ctx.meta as Partial<EnemyDuelMeta> | undefined)?.bossPayload)
}

export const enemyDuelGame: GamePlugin = {
  id: 'enemy-duel',
  name: '敌人对决',
  icon: '⚔️',
  description: 'Word Hunter 回合制战斗：拼写发射 + 认词闪避 + 词性克制',
  tags: ['battle'],
  minWords: 0,
  canPlay: hasBossPayload,
  Component: EnemyDuelGame,
}

export { EnemyDuelGame }
export type { EnemyDuelMeta }
