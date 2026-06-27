import type { PlanetLevelKind } from '../types'
import type { LevelGameSpec } from './types'

/**
 * 关卡类型 → 默认游戏编排（保留现有 kind 语义）。
 * 关卡可在自身配置中覆盖此默认值；未覆盖时回退到这里。
 * 详见 doc/2.产品设计/DOC-PROD-006-征服星球过关游戏插件设计.md
 */
export const DEFAULT_LEVEL_GAME: Record<PlanetLevelKind, LevelGameSpec> = {
  recruit: {
    mode: 'sequence',
    steps: [
      { gameId: 'flashcard-recognition' },
      { gameId: 'sentence-cloze', config: { tasks: 3 } },
    ],
  },
  review: {
    mode: 'fixed',
    steps: [{ gameId: 'flashcard-recognition' }],
  },
  boss: {
    mode: 'fixed',
    steps: [{ gameId: 'enemy-duel' }],
  },
}

export function getLevelGameSpec(kind: PlanetLevelKind): LevelGameSpec {
  return DEFAULT_LEVEL_GAME[kind]
}
