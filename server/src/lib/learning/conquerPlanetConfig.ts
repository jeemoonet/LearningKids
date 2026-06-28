import type { WhPartOfSpeech } from './wordHunter.js'

export type PlanetLevelKind = 'recruit' | 'boss' | 'review'

export interface PlanetLevelConfig {
  id: string
  kind: PlanetLevelKind
  name: string
  desc: string
  icon: string
  monsterPos?: WhPartOfSpeech
  monsterName?: string
  /** boss 收编词数（从词库随机抽取未掌握词） */
  bossRecruitCount?: number
  /** boss 优先词性（收编池筛选） */
  bossPreferPos?: WhPartOfSpeech
  seals?: number
}

export const KINGDOM_1 = {
  id: 'kingdom-1',
  name: '微光村国',
  subtitle: '邪恶军团最薄弱的边境，从这里开始壮大你的军团',
}

export interface PlanetKingdomConfig {
  id: string
  order: number
  name: string
  subtitle: string
  difficulty: string
  theme: string
  monster: {
    id: string
    name: string
    epithet: string
    partOfSpeech?: WhPartOfSpeech
  }
}

export const PLANET_KINGDOMS: PlanetKingdomConfig[] = [
  {
    id: 'kingdom-1',
    order: 1,
    name: '微光村国',
    subtitle: '邪恶军团最薄弱的边境，从这里开始壮大你的军团',
    difficulty: '★☆☆',
    theme: 'village',
    monster: { id: 'mist-golem', name: '迷雾石像', epithet: '名词守卫', partOfSpeech: 'noun' },
  },
  {
    id: 'kingdom-2',
    order: 2,
    name: '食物炊烟国',
    subtitle: '灶火永不熄灭的国度，形容词强化名词的试炼之地',
    difficulty: '★★☆',
    theme: 'food',
    monster: { id: 'stew-guardian', name: '饕餮锅灵', epithet: '食欲化形', partOfSpeech: 'noun' },
  },
  {
    id: 'kingdom-3',
    order: 3,
    name: '迷雾森林国',
    subtitle: '动词猎手潜伏于林，副词与动词的搭配之战',
    difficulty: '★★☆',
    theme: 'forest',
    monster: { id: 'forest-stalker', name: '林影追猎者', epithet: '动词之影', partOfSpeech: 'verb' },
  },
  {
    id: 'kingdom-4',
    order: 4,
    name: '时之沙漏国',
    subtitle: '时光在此倒流，不规则动词与时空时态的终极考验',
    difficulty: '★★★',
    theme: 'desert',
    monster: { id: 'hourglass-demon', name: '沙漏魔神', epithet: '时态扭曲者', partOfSpeech: 'verb' },
  },
  {
    id: 'kingdom-5',
    order: 5,
    name: '万象集市国',
    subtitle: '六族混杂的贸易枢纽，词性连线与混合战术',
    difficulty: '★★★',
    theme: 'market',
    monster: { id: 'market-serpent', name: '万舌商蛇', epithet: '词性混沌', partOfSpeech: 'other' },
  },
  {
    id: 'kingdom-6',
    order: 6,
    name: '记忆回廊国',
    subtitle: '遗忘的士兵在此徘徊，抗遗忘与防叛逃的最后防线',
    difficulty: '★★★★',
    theme: 'memory',
    monster: { id: 'echo-phantom', name: '回声魅影', epithet: '记忆吞噬者', partOfSpeech: 'adverb' },
  },
  {
    id: 'kingdom-7',
    order: 7,
    name: '暗影王座国',
    subtitle: '邪恶军团的心脏，征服卡吉姆星球的最终决战',
    difficulty: '★★★★★',
    theme: 'throne',
    monster: { id: 'shadow-crown', name: '暗影王座', epithet: '词性至尊', partOfSpeech: 'noun' },
  },
]

/** 各王国关卡（MVP 仅第一王国） */
export const KINGDOM_LEVELS: Record<string, PlanetLevelConfig[]> = {
  'kingdom-1': [
    {
      id: 'recruit-1',
      kind: 'recruit',
      name: '边境村庄',
      desc: '说出村民的名字与特点，并完成造句训练，收他们入伍',
      icon: '🏘️',
    },
    {
      id: 'recruit-2',
      kind: 'recruit',
      name: '溪畔聚落',
      desc: '低语密林深处的聚落，完成认词与造句即可招募新义勇',
      icon: '🏘️',
    },
    {
      id: 'review-1',
      kind: 'review',
      name: '回声山谷',
      desc: '走散的老兵在此徘徊，叫出他们的名字才能留住，否则会叛逃',
      icon: '🌫️',
    },
    {
      id: 'review-2',
      kind: 'review',
      name: '幽谷隘口',
      desc: '山脊尽头的幽谷，走散士兵在此徘徊，需及时复习召回',
      icon: '🌫️',
    },
    {
      id: 'boss-1',
      kind: 'boss',
      name: '迷雾王宫',
      desc: '名词怪兽盘踞王宫。派出学者(形容词)相生克制，拼写发射击破封印',
      icon: '🏯',
      monsterPos: 'noun',
      monsterName: '迷雾石像',
      bossRecruitCount: 5,
      bossPreferPos: 'noun',
      seals: 6,
    },
  ],
}

export const PLANET_LEVELS: PlanetLevelConfig[] = KINGDOM_LEVELS['kingdom-1']

export function getPlanetLevel(levelId: string): PlanetLevelConfig | undefined {
  for (const levels of Object.values(KINGDOM_LEVELS)) {
    const found = levels.find((l) => l.id === levelId)
    if (found) return found
  }
  return undefined
}

export function getKingdomLevels(kingdomId: string): PlanetLevelConfig[] {
  return KINGDOM_LEVELS[kingdomId] ?? []
}

export function getKingdom(kingdomId: string): PlanetKingdomConfig | undefined {
  return PLANET_KINGDOMS.find((k) => k.id === kingdomId)
}
