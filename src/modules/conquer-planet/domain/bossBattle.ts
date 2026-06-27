import type {
  LevelConfig,
  WordEntry,
  WordMastery,
} from '../../word-hunter/domain/battle/battleTypes'
import type { BossLevelPayload, PlanetWord } from '../types'
import { toWordEntry } from '../types'

const MONSTER_ASSET_MAP: Record<string, string> = {
  'mist-golem': 'mist',
  'stew-guardian': 'mist',
  'forest-stalker': 'mist',
  'hourglass-demon': 'mist',
  'market-serpent': 'mist',
  'echo-phantom': 'mist',
  'shadow-crown': 'mist',
}

function planetWordToEntry(w: PlanetWord): WordEntry {
  return toWordEntry(w)
}

export function mapMonsterAsset(monsterId: string): string {
  return MONSTER_ASSET_MAP[monsterId] ?? 'mist'
}

export interface BossBattleSession {
  level: LevelConfig
  words: WordEntry[]
  ownedWordIds: string[]
  wordMastery: Record<string, WordMastery>
}

/** 将征服星球 BOSS 关卡数据转换为 Word Hunter 战斗引擎所需结构 */
export function buildBossBattleSession(
  payload: BossLevelPayload,
  monsterId: string,
): BossBattleSession {
  const { level, army, rewardPreview, distractorPool } = payload

  const wordMap = new Map<string, WordEntry>()
  for (const w of [...army, ...rewardPreview, ...distractorPool]) {
    if (!wordMap.has(w.id)) wordMap.set(w.id, planetWordToEntry(w))
  }

  const ownedWordIds = army.map((w) => w.id)
  const themeWordIds = rewardPreview.map((w) => w.id)
  const now = new Date().toISOString()
  const wordMastery: Record<string, WordMastery> = {}

  for (const id of ownedWordIds) {
    wordMastery[id] = {
      wordId: id,
      familiarity: 50,
      learnedVia: 'starter',
      firstLearnedAt: now,
    }
  }

  const levelConfig: LevelConfig = {
    id: 1,
    name: level.name,
    monsterName: level.monsterName ?? '迷雾怪兽',
    monsterAsset: mapMonsterAsset(monsterId),
    backgroundAsset: 'level-01-mist',
    monsterPartOfSpeech: level.monsterPos ?? 'noun',
    themeWordIds,
    timerSeconds: 10,
    skills: [],
    attackPoolWeights: { theme: 0.7, learned: 0.3 },
  }

  return {
    level: levelConfig,
    words: [...wordMap.values()],
    ownedWordIds,
    wordMastery,
  }
}
