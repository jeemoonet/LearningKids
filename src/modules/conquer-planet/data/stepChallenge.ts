import type { BattleMapNode } from './kingdomBattleMapLayout'
import { terrainIcon } from './kingdomBattleMapLayout'
import { shuffle } from '../domain/quiz'
import type { LevelIntroContent } from './levelIntro'
import { getKingdomRegionLabel, getWaypointEvent } from './sceneEvents'
import type { GameContext, LevelGameSpec } from '../games/types'
import type { PlanetSession, PlanetLevel, PlanetSoldier, PlanetWord } from '../types'

const STEP_WORD_COUNT = 3

/** 路点 / 途经格默认试炼：闪卡认词 */
export const STEP_GAME_SPEC: LevelGameSpec = {
  mode: 'fixed',
  steps: [{ gameId: 'flashcard-recognition' }],
}

/** 无 levelId 的路点格：抵达后须完成闪卡试炼 */
export function nodeRequiresStepChallenge(node: BattleMapNode): boolean {
  if (node.levelId) return false
  if (node.terrain === 'camp') return false
  return true
}

/** 抵达该格时是否须弹出试炼（路点，或已通关的关卡格） */
export function nodeNeedsArrivalChallenge(
  node: BattleMapNode,
  level: { done?: boolean } | undefined,
): boolean {
  if (level?.done) return true
  return nodeRequiresStepChallenge(node)
}

function soldierToWord(s: PlanetSoldier): PlanetWord {
  return {
    id: s.wordId,
    word: s.word,
    meaning: s.meaning,
    phonetic: s.phonetic,
    partOfSpeech: s.partOfSpeech,
    syllables: s.syllables,
    keySlots: { own: [], captured: [] },
    sentence: s.exampleEn ?? 'I like ___.',
    sentenceZh: s.exampleZh ?? `我喜欢${s.word}。`,
  }
}

/** 试炼词池：优先重点单词本，为空时回退到熟悉度 < 5 的军团词 */
export function buildStepChallengePool(session: PlanetSession): PlanetWord[] {
  const wordbook = session.wordbookPool ?? []
  if (wordbook.length > 0) return wordbook

  const seen = new Set<string>()
  const fallback: PlanetWord[] = []
  for (const soldier of session.soldiers) {
    if (soldier.familiarity >= 5) continue
    const key = soldier.word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    fallback.push(soldierToWord(soldier))
  }
  return fallback
}

/** 从试炼词池随机抽取试炼词（每次 shuffle，round 变化时重新抽题） */
export function buildStepGameContext(session: PlanetSession, round = 0): GameContext | null {
  const pool = buildStepChallengePool(session)
  if (pool.length === 0) return null

  let ordered = shuffle(pool)
  for (let i = 0; i < round; i++) {
    ordered = shuffle(ordered)
  }

  const words = ordered.slice(0, Math.min(STEP_WORD_COUNT, ordered.length))
  const wordKeys = new Set(words.map((w) => w.word.toLowerCase()))
  const distractors = pool.filter((p) => !wordKeys.has(p.word.toLowerCase()))

  return {
    words,
    distractors: distractors.length > 0 ? distractors : shuffle(pool),
  }
}

/** 试炼开始前的情境简报 */
export function buildStepChallengeIntro(
  node: BattleMapNode,
  variant: 'waypoint' | 'consolidate',
  level?: PlanetLevel,
  kingdomId = 'kingdom-1',
): LevelIntroContent {
  const scene = getWaypointEvent(node, kingdomId)
  const wordCount = STEP_WORD_COUNT

  if (variant === 'consolidate' && level) {
    return {
      icon: level.icon || '🏘️',
      title: level.name,
      location: node.label,
      body: `你再次经过${node.label}。${scene} 村民想考考你是否还记得他们——请准备好，完成 ${wordCount} 道认词试炼。`,
      note: '优先从重点单词本抽题；单词本为空时，从熟悉度不足 5 分的单词中抽取。全对才能继续前进。',
      primaryLabel: '准备好了',
    }
  }

  return {
    icon: terrainIcon(node.terrain),
    title: node.label,
    location: getKingdomRegionLabel(kingdomId),
    body: `你遇到了${node.label}上的盘查。${scene} 请准备好，完成 ${wordCount} 道认词试炼才能继续北上。`,
    note: '优先从重点单词本抽题；单词本为空时，从熟悉度不足 5 分的单词中抽取。全对才能继续前进。',
    primaryLabel: '准备好了',
  }
}
