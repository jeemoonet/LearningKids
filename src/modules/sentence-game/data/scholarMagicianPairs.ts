export type ScholarMagicianRole = 'scholar' | 'magician'

export type PairPattern = 'adj-noun' | 'verb-adv'

export interface PairWord {
  text: string
  role: ScholarMagicianRole | 'noun' | 'verb'
  roleLabel: string
}

export interface ScholarMagicianPair {
  id: string
  pattern: PairPattern
  words: [PairWord, PairWord]
  phraseZh: string
}

const POOLS: Record<string, ScholarMagicianPair[]> = {
  'adj-adv-1': [
    {
      id: 'sm-1-01',
      pattern: 'adj-noun',
      words: [
        { text: 'beautiful', role: 'scholar', roleLabel: '学者' },
        { text: 'day', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '美好的一天',
    },
    {
      id: 'sm-1-02',
      pattern: 'verb-adv',
      words: [
        { text: 'run', role: 'verb', roleLabel: '动词' },
        { text: 'quickly', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '快速地跑',
    },
    {
      id: 'sm-1-03',
      pattern: 'adj-noun',
      words: [
        { text: 'happy', role: 'scholar', roleLabel: '学者' },
        { text: 'child', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '快乐的孩子',
    },
    {
      id: 'sm-1-04',
      pattern: 'verb-adv',
      words: [
        { text: 'speak', role: 'verb', roleLabel: '动词' },
        { text: 'loudly', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '大声说话',
    },
    {
      id: 'sm-1-05',
      pattern: 'adj-noun',
      words: [
        { text: 'quiet', role: 'scholar', roleLabel: '学者' },
        { text: 'room', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '安静的房间',
    },
    {
      id: 'sm-1-06',
      pattern: 'verb-adv',
      words: [
        { text: 'walk', role: 'verb', roleLabel: '动词' },
        { text: 'slowly', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '慢慢地走',
    },
    {
      id: 'sm-1-07',
      pattern: 'adj-noun',
      words: [
        { text: 'delicious', role: 'scholar', roleLabel: '学者' },
        { text: 'soup', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '美味的汤',
    },
    {
      id: 'sm-1-08',
      pattern: 'verb-adv',
      words: [
        { text: 'drive', role: 'verb', roleLabel: '动词' },
        { text: 'carefully', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '小心地开车',
    },
    {
      id: 'sm-1-09',
      pattern: 'adj-noun',
      words: [
        { text: 'warm', role: 'scholar', roleLabel: '学者' },
        { text: 'weather', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '暖和的天气',
    },
    {
      id: 'sm-1-10',
      pattern: 'verb-adv',
      words: [
        { text: 'dance', role: 'verb', roleLabel: '动词' },
        { text: 'gracefully', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '优雅地跳舞',
    },
    {
      id: 'sm-1-11',
      pattern: 'adj-noun',
      words: [
        { text: 'interesting', role: 'scholar', roleLabel: '学者' },
        { text: 'story', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '有趣的故事',
    },
    {
      id: 'sm-1-12',
      pattern: 'verb-adv',
      words: [
        { text: 'write', role: 'verb', roleLabel: '动词' },
        { text: 'carefully', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '认真地写',
    },
  ],
  'adj-adv-2': [
    {
      id: 'sm-2-01',
      pattern: 'adj-noun',
      words: [
        { text: 'taller', role: 'scholar', roleLabel: '学者' },
        { text: 'boy', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '更高的男孩（比较级）',
    },
    {
      id: 'sm-2-02',
      pattern: 'verb-adv',
      words: [
        { text: 'run', role: 'verb', roleLabel: '动词' },
        { text: 'faster', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '跑得更快（比较级）',
    },
    {
      id: 'sm-2-03',
      pattern: 'adj-noun',
      words: [
        { text: 'best', role: 'scholar', roleLabel: '学者' },
        { text: 'student', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '最优秀的学生（最高级）',
    },
    {
      id: 'sm-2-04',
      pattern: 'verb-adv',
      words: [
        { text: 'answer', role: 'verb', roleLabel: '动词' },
        { text: 'most carefully', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '回答得最仔细（最高级）',
    },
    {
      id: 'sm-2-05',
      pattern: 'adj-noun',
      words: [
        { text: 'colder', role: 'scholar', roleLabel: '学者' },
        { text: 'winter', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '更冷的冬天',
    },
    {
      id: 'sm-2-06',
      pattern: 'verb-adv',
      words: [
        { text: 'work', role: 'verb', roleLabel: '动词' },
        { text: 'harder', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '更努力地工作',
    },
    {
      id: 'sm-2-07',
      pattern: 'adj-noun',
      words: [
        { text: 'longest', role: 'scholar', roleLabel: '学者' },
        { text: 'river', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '最长的河流',
    },
    {
      id: 'sm-2-08',
      pattern: 'verb-adv',
      words: [
        { text: 'sing', role: 'verb', roleLabel: '动词' },
        { text: 'most beautifully', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '唱得最美',
    },
    {
      id: 'sm-2-09',
      pattern: 'adj-noun',
      words: [
        { text: 'heavier', role: 'scholar', roleLabel: '学者' },
        { text: 'box', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '更重的箱子',
    },
    {
      id: 'sm-2-10',
      pattern: 'verb-adv',
      words: [
        { text: 'drive', role: 'verb', roleLabel: '动词' },
        { text: 'more slowly', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '开得更慢',
    },
    {
      id: 'sm-2-11',
      pattern: 'adj-noun',
      words: [
        { text: 'most interesting', role: 'scholar', roleLabel: '学者' },
        { text: 'book', role: 'noun', roleLabel: '名词' },
      ],
      phraseZh: '最有趣的书',
    },
    {
      id: 'sm-2-12',
      pattern: 'verb-adv',
      words: [
        { text: 'jump', role: 'verb', roleLabel: '动词' },
        { text: 'highest', role: 'magician', roleLabel: '魔法师' },
      ],
      phraseZh: '跳得最高',
    },
  ],
  'adj-adv-3': [],
}

POOLS['adj-adv-3'] = [...POOLS['adj-adv-1'], ...POOLS['adj-adv-2']]

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function buildScholarMagicianSession(
  levelId: string,
  count = 6,
  excludeIds: string[] = [],
): ScholarMagicianPair[] {
  const pool = POOLS[levelId] ?? POOLS['adj-adv-1']
  const exclude = new Set(excludeIds)
  let available = shuffle(pool.filter((item) => !exclude.has(item.id)))

  if (available.length < count) {
    const seen = new Set(available.map((item) => item.id))
    const rest = shuffle(pool.filter((item) => !seen.has(item.id)))
    available = [...available, ...rest]
    if (available.length < count) {
      available = shuffle(pool)
    }
  }

  const picked: ScholarMagicianPair[] = []
  const used = new Set<string>()
  for (const item of available) {
    if (picked.length >= count) break
    if (used.has(item.id)) continue
    used.add(item.id)
    picked.push(item)
  }

  return picked.slice(0, count)
}

export interface VerbAdvCollocation {
  verb: string
  adv: string
  phraseZh: string
}

/** 从学者魔法师词库提取全部动词+副词固定搭配 */
export function listVerbAdvCollocations(): VerbAdvCollocation[] {
  const seen = new Set<string>()
  const items: VerbAdvCollocation[] = []

  for (const pool of Object.values(POOLS)) {
    for (const pair of pool) {
      if (pair.pattern !== 'verb-adv') continue
      const verb = pair.words.find((w) => w.role === 'verb')?.text
      const adv = pair.words.find((w) => w.role === 'magician')?.text
      if (!verb || !adv) continue
      const key = `${verb.toLowerCase()}|${adv.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ verb, adv, phraseZh: pair.phraseZh })
    }
  }
  return items
}

export function patternLabel(pattern: PairPattern): string {
  return pattern === 'adj-noun' ? '学者 + 名词' : '动词 + 魔法师'
}
