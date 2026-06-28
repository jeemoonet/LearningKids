import type { KnownWord } from '../../learning/api'
import { listVerbAdvCollocations, type VerbAdvCollocation } from './scholarMagicianPairs'

export type MatchSideRole = 'warrior' | 'magician' | 'scholar'

export interface MatchCard {
  id: string
  word: string
  role: MatchSideRole
  meaningZh?: string
}

export interface WarriorMagicianSession {
  warriors: MatchCard[]
  rightSide: MatchCard[]
  /** 武士 id → 正确魔法师 id */
  correctPairs: Record<string, string>
  /** 预设搭配的中文释义，key 为 verb|adv（小写） */
  pairPhrases: Record<string, string>
}

const WARRIOR_COUNT = 6
const SCHOLAR_COUNT = 4

const EXTRA_COLLOCATIONS: VerbAdvCollocation[] = [
  { verb: 'read', adv: 'quietly', phraseZh: '安静地读' },
  { verb: 'eat', adv: 'slowly', phraseZh: '慢慢地吃' },
  { verb: 'play', adv: 'happily', phraseZh: '快乐地玩' },
  { verb: 'jump', adv: 'high', phraseZh: '高高地跳' },
  { verb: 'listen', adv: 'carefully', phraseZh: '仔细地听' },
  { verb: 'study', adv: 'hard', phraseZh: '努力地学习' },
]

const FALLBACK_ADJECTIVES = [
  'beautiful',
  'happy',
  'quiet',
  'delicious',
  'warm',
  'interesting',
  'tall',
  'brave',
  'clever',
  'friendly',
  'cold',
  'bright',
]

const FALLBACK_MEANINGS: Record<string, string> = {
  run: '跑',
  walk: '走',
  speak: '说',
  write: '写',
  dance: '跳舞',
  drive: '驾驶',
  work: '工作',
  read: '读',
  sing: '唱',
  jump: '跳',
  eat: '吃',
  play: '玩',
  listen: '听',
  study: '学习',
  quickly: '快速地',
  slowly: '慢慢地',
  loudly: '大声地',
  carefully: '小心地',
  gracefully: '优雅地',
  hard: '努力地',
  quietly: '安静地',
  beautifully: '优美地',
  high: '高高地',
  happily: '快乐地',
  beautiful: '美丽的',
  happy: '快乐的',
  quiet: '安静的',
  delicious: '美味的',
  warm: '温暖的',
  interesting: '有趣的',
  tall: '高的',
  brave: '勇敢的',
  clever: '聪明的',
  friendly: '友好的',
  cold: '冷的',
  bright: '明亮的',
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizePos(pos: string): string {
  const p = pos.trim().toLowerCase()
  if (p === 'adverb') return 'adv'
  if (p === 'adjective') return 'adj'
  return p
}

function pairKey(verb: string, adv: string): string {
  return `${verb.toLowerCase()}|${adv.toLowerCase()}`
}

function buildCollocationPool(): VerbAdvCollocation[] {
  const seen = new Set<string>()
  const pool: VerbAdvCollocation[] = []

  for (const item of [...listVerbAdvCollocations(), ...EXTRA_COLLOCATIONS]) {
    const key = pairKey(item.verb, item.adv)
    if (seen.has(key)) continue
    seen.add(key)
    pool.push(item)
  }
  return pool
}

function buildMeaningLookup(words: KnownWord[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const item of words) {
    const zh = item.meaningZh?.trim()
    if (zh) map.set(item.word.toLowerCase(), zh)
  }
  for (const [word, zh] of Object.entries(FALLBACK_MEANINGS)) {
    if (!map.has(word)) map.set(word, zh)
  }
  return map
}

function lookupMeaning(map: Map<string, string>, word: string): string | undefined {
  return map.get(word.toLowerCase())
}

function pickWords(words: KnownWord[], pos: string, count: number, exclude: Set<string>): string[] {
  const picked: string[] = []
  const pool = shuffle(
    words.filter((w) => normalizePos(w.pos) === pos && !exclude.has(w.word.toLowerCase())),
  )
  for (const item of pool) {
    if (picked.length >= count) break
    picked.push(item.word)
    exclude.add(item.word.toLowerCase())
  }
  return picked
}

function pickUniqueCollocations(
  candidates: VerbAdvCollocation[],
  count: number,
): VerbAdvCollocation[] {
  const picked: VerbAdvCollocation[] = []
  const usedVerbs = new Set<string>()
  const usedAdvs = new Set<string>()

  for (const item of candidates) {
    if (picked.length >= count) break
    const verb = item.verb.toLowerCase()
    const adv = item.adv.toLowerCase()
    if (usedVerbs.has(verb) || usedAdvs.has(adv)) continue
    picked.push(item)
    usedVerbs.add(verb)
    usedAdvs.add(adv)
  }
  return picked
}

/** 先从固定搭配里选题，再优先选用户已掌握的动词/副词 */
function selectSessionCollocations(
  knownWords: KnownWord[],
  count: number,
): VerbAdvCollocation[] {
  const knownVerbs = new Set(
    knownWords.filter((w) => normalizePos(w.pos) === 'verb').map((w) => w.word.toLowerCase()),
  )
  const knownAdvs = new Set(
    knownWords.filter((w) => normalizePos(w.pos) === 'adv').map((w) => w.word.toLowerCase()),
  )

  const pool = buildCollocationPool()
  const bothKnown = shuffle(pool.filter(
    (item) => knownVerbs.has(item.verb.toLowerCase()) && knownAdvs.has(item.adv.toLowerCase()),
  ))
  const verbKnown = shuffle(pool.filter(
    (item) => knownVerbs.has(item.verb.toLowerCase()),
  ))

  const tiers = [...bothKnown, ...verbKnown, ...shuffle(pool)]

  const seen = new Set<string>()
  const ordered: VerbAdvCollocation[] = []
  for (const item of tiers) {
    const key = pairKey(item.verb, item.adv)
    if (seen.has(key)) continue
    seen.add(key)
    ordered.push(item)
  }

  const picked = pickUniqueCollocations(ordered, count)
  if (picked.length >= count) return picked

  return pickUniqueCollocations(shuffle(pool), count)
}

function pickScholars(words: KnownWord[], exclude: Set<string>): string[] {
  const fromKnown = pickWords(words, 'adj', SCHOLAR_COUNT, exclude)
  if (fromKnown.length >= SCHOLAR_COUNT) return fromKnown

  const rest = shuffle(
    FALLBACK_ADJECTIVES.filter((w) => !exclude.has(w) && !fromKnown.includes(w)),
  )
  return [...fromKnown, ...rest].slice(0, SCHOLAR_COUNT)
}

function makeCard(
  id: string,
  word: string,
  role: MatchSideRole,
  meanings: Map<string, string>,
): MatchCard {
  return {
    id,
    word,
    role,
    meaningZh: lookupMeaning(meanings, word),
  }
}

/** 生成连线后的中文组合释义 */
export function formatPairMeaning(
  verb: MatchCard,
  modifier: MatchCard,
  pairPhrases?: Record<string, string>,
): string {
  if (modifier.role === 'magician') {
    const preset = pairPhrases?.[pairKey(verb.word, modifier.word)]
    if (preset) return preset
  }

  const verbZh = verb.meaningZh?.trim() || verb.word
  const modZh = modifier.meaningZh?.trim() || modifier.word

  if (modifier.role === 'magician') {
    const adv = modZh.endsWith('地') ? modZh : `${modZh}地`
    return `${adv}${verbZh}`
  }

  if (modZh.endsWith('的')) return `${modZh}${verbZh}`
  return `${modZh}的${verbZh}`
}

export function buildWarriorMagicianSession(
  knownWords: KnownWord[],
  sessionSeed = Date.now(),
): WarriorMagicianSession {
  void sessionSeed
  const meanings = buildMeaningLookup(knownWords)
  const collocations = selectSessionCollocations(knownWords, WARRIOR_COUNT)

  const pairPhrases: Record<string, string> = {}
  for (const item of collocations) {
    pairPhrases[pairKey(item.verb, item.adv)] = item.phraseZh
  }

  const used = new Set<string>()
  for (const item of collocations) {
    used.add(item.verb.toLowerCase())
    used.add(item.adv.toLowerCase())
  }

  const warriors: MatchCard[] = collocations.map((item, index) =>
    makeCard(`warrior-${index}`, item.verb, 'warrior', meanings),
  )

  const magicians: MatchCard[] = collocations.map((item, index) =>
    makeCard(`magician-${index}`, item.adv, 'magician', meanings),
  )

  const scholars: MatchCard[] = pickScholars(knownWords, used).map((word, index) =>
    makeCard(`scholar-${index}`, word, 'scholar', meanings),
  )

  const correctPairs: Record<string, string> = {}
  for (let i = 0; i < warriors.length; i += 1) {
    correctPairs[warriors[i].id] = magicians[i].id
  }

  return {
    warriors,
    rightSide: shuffle([...magicians, ...scholars]),
    correctPairs,
    pairPhrases,
  }
}

export const WARRIOR_MATCH_META = {
  id: 'warrior-match',
  title: '魔法连线',
  scene: '武士 ⚔ 魔法师',
  ruleSummary: '为每个动词找出合适的修饰词并完成连线',
  questionCount: WARRIOR_COUNT,
} as const
