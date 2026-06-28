import { registerGame } from './registry'
import type { AnyGamePlugin } from './types'
import { flashcardGame } from './flashcard'
import { sentenceClozeGame } from './sentence-cloze'
import { spellFillGame } from './spell-fill'
import { wordMatchGame } from './word-match'
import { advVerbPairGame } from './adv-verb-pair'
import { enemyDuelGame } from './enemy-duel'

let installed = false

const BUILTIN_GAMES: AnyGamePlugin[] = [
  flashcardGame,
  sentenceClozeGame,
  spellFillGame,
  wordMatchGame,
  enemyDuelGame,
  advVerbPairGame,
]

/** 安装内置游戏插件（幂等，可在模块入口处调用一次） */
export function installGames(): void {
  if (installed) return
  installed = true
  for (const game of BUILTIN_GAMES) registerGame(game)
}

export * from './types'
export { getGame, listGames, hasGame, registerGame } from './registry'
export {
  resolveGameSteps,
  isLevelCleared,
  collectCorrectWords,
  collectWrongWords,
} from './selectGames'
export { GameRunner } from './GameRunner'
export { settleLevel } from './settlement'
export type { SettlementKind, SettlementOutcome } from './settlement'
export { DEFAULT_LEVEL_GAME, getLevelGameSpec } from './levelGameDefaults'
export { flashcardGame } from './flashcard'
export { sentenceClozeGame } from './sentence-cloze'
export { spellFillGame } from './spell-fill'
export { wordMatchGame } from './word-match'
export { enemyDuelGame } from './enemy-duel'
export { advVerbPairGame } from './adv-verb-pair'
export type { EnemyDuelMeta } from './enemy-duel'
