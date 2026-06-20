/**
 * 初级组按场景主题分组
 * - 先分配名词，再分配动词（及其他词性）
 * - 每组最多 6 个单词，末尾余词均衡并入其他未满组
 * - 同一场景可拆分为多个小组，如「学习1-教室」「学习2-图书馆」
 */

export interface BeginnerTheme {
  id: string
  title: string
  subtitle: string
}

export interface WordForThemeGroup {
  id: number
  word: string
  pos: string
}

export interface ThemeGroupResult {
  title: string
  themeId: string
  wordIds: number[]
}

const MAX_GROUP_SIZE = 6

const BASE_WORD_RE = /^([a-zA-Z]+(?:'[a-zA-Z]+)?)/

interface ThemeConfig {
  id: string
  shortName: string
  title: string
  subScenes: string[]
}

const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'school',
    shortName: '学习',
    title: '校园、学习',
    subScenes: ['教室', '课程', '考试', '老师', '同学', '作业', '图书馆', '课堂'],
  },
  {
    id: 'family',
    shortName: '家庭',
    title: '家庭、日常生活',
    subScenes: ['房间', '三餐', '家人', '家务', '客厅', '厨房', '卧室', '日常'],
  },
  {
    id: 'personal',
    shortName: '个人',
    title: '个人、情绪',
    subScenes: ['外貌', '性格', '感受', '健康', '身体', '情绪', '心理', '状态'],
  },
  {
    id: 'food_shopping',
    shortName: '食物',
    title: '食物、购物',
    subScenes: ['餐厅', '超市', '衣物', '价格', '水果', '饮料', '购物', '烹饪'],
  },
  {
    id: 'weather',
    shortName: '天气',
    title: '天气、季节',
    subScenes: ['温度', '自然', '户外', '季节', '晴天', '雨雪', '风力', '环境'],
  },
  {
    id: 'hobby_sport',
    shortName: '运动',
    title: '爱好、运动',
    subScenes: ['球类', '跑步', '游泳', '音乐', '绘画', '游戏', '健身', '竞技'],
  },
  {
    id: 'travel',
    shortName: '旅行',
    title: '交通、旅行',
    subScenes: ['问路', '交通工具', '景点', '酒店', '地图', '方向', '出行', '风景'],
  },
  {
    id: 'festival',
    shortName: '节日',
    title: '节日、文化',
    subScenes: ['春节', '圣诞', '习俗', '礼物', '派对', '文化', '传统', '庆典'],
  },
  {
    id: 'preposition',
    shortName: '介词',
    title: '介词、位置关系',
    subScenes: ['里外点高低', '前后旁之间', '近远周围里外', '进出上下到', '路径方向'],
  },
  {
    id: 'time_preposition',
    shortName: '时间',
    title: '时间介词',
    subScenes: ['点子面段', '持续与起点', '先后与截止', '钟点与其他', '易混非介词'],
  },
  {
    id: 'other',
    shortName: '其他',
    title: '其他',
    subScenes: ['常用', '补充', '综合', '基础', '拓展', '虚词', '名称', '杂项'],
  },
]

export const BEGINNER_THEMES: BeginnerTheme[] = THEME_CONFIGS.map((config) => ({
  id: config.id,
  title: config.title,
  subtitle: config.subScenes.join('、'),
}))

/** 虚词、代词等归入「其他」（位置/时间介词见固定分组，不在此列） */
const FUNCTION_WORDS = new Set([
  'a', 'all', 'any', 'app', 'as', 'else', 'ever', 'he', 'his', 'i',
  'if', 'it', 'its', 'my', 'no', 'non', 'nor', 'not', 'now', 'of',
  'or', 'so', 'too', 'upon', 'we', 'why', 'cute', 'fixe', 'mixe', 'rin', 'mine',
])

/** 时间介词固定分组（词数按考点自然分组，不凑满 6 词） */
const TIME_PREPOSITION_GROUP_DEFS: Array<{ scene: string; words: string[] }> = [
  { scene: '点子面段', words: ['at', 'on', 'in'] },
  { scene: '持续与起点', words: ['for', 'since', 'during', 'through'] },
  { scene: '先后与截止', words: ['before', 'after', 'by', 'until', 'from'] },
  { scene: '钟点与其他', words: ['past', 'to', 'around', 'over', 'between'] },
  { scene: '易混非介词', words: ['ago', 'later', 'every', 'each'] },
]

/** 位置介词固定分组（与时间组重叠的词优先归入时间组） */
const PREPOSITION_GROUP_DEFS: Array<{ scene: string; words: string[] }> = [
  { scene: '里外点高低', words: ['under', 'above', 'below'] },
  { scene: '前后旁之间', words: ['behind', 'in front of', 'beside', 'among', 'opposite'] },
  { scene: '近远周围里外', words: ['near', 'far from', 'inside', 'outside'] },
  { scene: '进出上下到', words: ['into', 'out of', 'onto', 'off'] },
  { scene: '路径方向', words: ['towards', 'away from', 'along', 'across'] },
]

const TIME_PREPOSITION_WORD_SET = new Set(
  TIME_PREPOSITION_GROUP_DEFS.flatMap((group) => group.words),
)

const PREPOSITION_WORD_SET = new Set(
  PREPOSITION_GROUP_DEFS.flatMap((group) => group.words),
)

/** 人名、缩写等归入「其他」 */
const PROPER_OR_ABBREV = new Set([
  'ac', 'adam', 'alan', 'amy', 'bias', 'bolt', 'boss', 'br', 'cd', 'chang', 'chi', 'co',
  'dave', 'dr', 'ea', 'emma', 'eric', 'fei', 'gps', 'hag', 'hua', 'jim', 'jean', 'helen',
  'li', 'lin', 'liu', 'lily', 'lucy', 'mary', 'matt', 'mike', 'mr', 'mri', 'mrs', 'ms',
  'paul', 'rick', 'sam', 'sara', 'sth', 'sb', 'tai', 'th', 'tim', 'tina', 'tony', 'tom',
  'un', 'wang', 'yang', 'opus',
])

/** 各主题英文单词集合（小写） */
const THEME_WORDS: Record<string, Set<string>> = {
  school: new Set([
    'add', 'answer', 'ask', 'book', 'case', 'cheat', 'class', 'classmate', 'classroom',
    'club', 'college', 'doubt', 'email', 'exam', 'fact', 'form', 'grade', 'group',
    'homework', 'idea', 'key', 'know', 'learn', 'lesson', 'level', 'library', 'limit',
    'list', 'mark', 'math', 'mean', 'meet', 'mind', 'miss', 'name', 'need', 'news',
    'note', 'once', 'paper', 'part', 'pass', 'pick', 'plan', 'practice', 'print', 'prize',
    'proof', 'question', 'quiet', 'read', 'real', 'role', 'rule', 'ruler', 'say',
    'school', 'schoolbag', 'schoolchild', 'science', 'score', 'shape', 'student', 'study',
    'subject', 'task', 'teach', 'teacher', 'tell', 'term', 'test', 'title', 'topic',
    'try', 'use', 'word', 'write', 'english', 'help', 'keep', 'let', 'look',
  ]),
  family: new Set([
    'aunt', 'baby', 'bed', 'birth', 'born', 'boy', 'breakfast', 'brother', 'chair',
    'child', 'clean', 'clock', 'cook', 'dad', 'daily', 'dear', 'dinner', 'dish', 'door',
    'eat', 'family', 'father', 'fork', 'girl', 'glass', 'hall', 'home', 'house',
    'housework', 'husband', 'kid', 'kitchen', 'live', 'lock', 'lunch', 'meal', 'mom',
    'mother', 'parent', 'rice', 'room', 'sister', 'sleep', 'son', 'soup', 'table',
    'tea', 'tidy', 'uncle', 'wake', 'wall', 'wash', 'wife', 'yard', 'day', 'week',
    'night', 'end', 'hour',
  ]),
  personal: new Set([
    'age', 'anger', 'bad', 'big', 'blind', 'blue', 'body', 'brave', 'brown', 'calm',
    'care', 'cause', 'cheek', 'color', 'cool', 'crazy', 'cry', 'deaf', 'dream', 'eager',
    'ease', 'eye', 'face', 'fear', 'feel', 'felt', 'few', 'foot', 'glad', 'goal', 'good',
    'grey', 'hand', 'happy', 'harm', 'head', 'health', 'heart', 'heavy', 'hello', 'hero',
    'high', 'hope', 'host', 'hot', 'hug', 'hurt', 'kind', 'lazy', 'leg', 'light', 'loss',
    'love', 'lover', 'luck', 'main', 'man', 'nice', 'noise', 'nose', 'oh', 'okay', 'old',
    'pain', 'poor', 'pride', 'quick', 'rich', 'risk', 'rough', 'rude', 'sad', 'scare',
    'self', 'shy', 'sick', 'sigh', 'small', 'smell', 'smile', 'strong', 'tall', 'tear',
    'thin', 'tired', 'tooth', 'true', 'truth', 'warm', 'weak', 'woman', 'wipe', 'worry',
    'young', 'hate', 'mind', 'much', 'same', 'size', 'sound', 'style', 'top', 'worth',
  ]),
  food_shopping: new Set([
    'bag', 'bags', 'bill', 'box', 'bread', 'buy', 'buyer', 'cake', 'candy', 'cap',
    'chunk', 'clothes', 'coat', 'coffee', 'cost', 'deal', 'diet', 'dress', 'drink',
    'egg', 'favor', 'fish', 'food', 'fruit', 'gift', 'grain', 'hat', 'hunger', 'market',
    'meat', 'milk', 'money', 'pay', 'price', 'restaurant', 'salt', 'sell', 'shirt',
    'shoe', 'shop', 'snack', 'store', 'supermarket', 'sweet', 'taste', 'tie', 'tray',
    'vegetable', 'water', 'wear', 'wheat', 'wine',
  ]),
  weather: new Set([
    'animal', 'autumn', 'beach', 'bear', 'bird', 'burn', 'camp', 'cloud', 'cold', 'dark',
    'deep', 'dog', 'dry', 'earth', 'fall', 'field', 'fire', 'flat', 'flower', 'forest',
    'garden', 'grass', 'green', 'hill', 'hole', 'horse', 'hot', 'ice', 'icy', 'lake',
    'land', 'moon', 'nature', 'ocean', 'outdoor', 'panda', 'park', 'plant', 'rain',
    'river', 'sand', 'sea', 'season', 'sky', 'snow', 'spring', 'star', 'summer', 'sun',
    'sunny', 'tree', 'water', 'wave', 'weather', 'wild', 'wind', 'winter',
  ]),
  hobby_sport: new Set([
    'art', 'ball', 'band', 'baseball', 'basketball', 'beat', 'bike', 'camp', 'catch',
    'climb', 'coach', 'cycle', 'dance', 'draw', 'drum', 'exercise', 'fight', 'film',
    'football', 'fun', 'funny', 'game', 'gym', 'hike', 'hit', 'hobby', 'jump', 'kick',
    'listen', 'magic', 'movie', 'music', 'pace', 'paint', 'photo', 'piano', 'play',
    'race', 'ride', 'ring', 'rider', 'run', 'score', 'show', 'sing', 'skate', 'ski',
    'slip', 'soccer', 'song', 'sport', 'step', 'swim', 'team', 'tennis', 'throw',
    'toy', 'volleyball', 'walk', 'watch', 'win',
  ]),
  travel: new Set([
    'airport', 'area', 'beach', 'bike', 'boat', 'bus', 'car', 'city', 'country', 'drive',
    'east', 'far', 'fly', 'gate', 'guide', 'hotel', 'hurry', 'island', 'km', 'land',
    'last', 'law', 'lead', 'low', 'map', 'mile', 'north', 'park', 'pass', 'path',
    'place', 'plane', 'road', 'route', 'rush', 'safe', 'ship', 'side', 'sight', 'sign',
    'south', 'spain', 'station', 'street', 'town', 'train', 'travel', 'trip', 'visit',
    'wait', 'walk', 'way', 'west', 'world', 'rate', 'scale', 'unit',
  ]),
  festival: new Set([
    'america', 'birth', 'birthday', 'celebrate', 'china', 'chinese', 'christmas', 'culture',
    'custom', 'easter', 'fair', 'festival', 'gift', 'holiday', 'june', 'lantern', 'moon',
    'new', 'party', 'spring', 'thank', 'tradition', 'year', 'favor',
  ]),
}

const THEME_ORDER = THEME_CONFIGS.map((config) => config.id).filter((id) => id !== 'other')

function baseWord(raw: string): string {
  const match = BASE_WORD_RE.exec(raw.trim())
  return (match?.[1] ?? raw).toLowerCase()
}

/** 完整词条键（保留短语介词，如 in front of） */
function wordKey(raw: string): string {
  return raw.trim().toLowerCase().split('[')[0].trim()
}

function classifyWord(rawWord: string, pos: string): string {
  const word = wordKey(rawWord)

  if (TIME_PREPOSITION_WORD_SET.has(word)) {
    return 'time_preposition'
  }

  if (PREPOSITION_WORD_SET.has(word)) {
    return 'preposition'
  }

  const stem = baseWord(rawWord)
  if (FUNCTION_WORDS.has(stem) || PROPER_OR_ABBREV.has(stem)) {
    return 'other'
  }

  for (const themeId of THEME_ORDER) {
    if (THEME_WORDS[themeId]?.has(stem)) {
      return themeId
    }
  }

  if (pos === 'verb') {
    return 'hobby_sport'
  }

  return 'other'
}

/** 名词优先，其次其他词性，最后动词 */
function orderWordsByPos(words: WordForThemeGroup[]): WordForThemeGroup[] {
  const nouns = words.filter((word) => word.pos === 'noun')
  const verbs = words.filter((word) => word.pos === 'verb')
  const rest = words.filter((word) => word.pos !== 'noun' && word.pos !== 'verb')
  return [...nouns, ...rest, ...verbs]
}

/** 均衡切分，避免末尾只剩 1～2 词的孤立小组 */
function balancedChunkWords(words: WordForThemeGroup[], maxSize: number): WordForThemeGroup[][] {
  const total = words.length
  if (total === 0) return []

  const groupCount = Math.ceil(total / maxSize)
  const baseSize = Math.floor(total / groupCount)
  const extra = total % groupCount

  const chunks: WordForThemeGroup[][] = []
  let index = 0
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
    const size = baseSize + (groupIndex < extra ? 1 : 0)
    chunks.push(words.slice(index, index + size))
    index += size
  }
  return chunks
}

/** 少于 MIN_FILL 词的小组，将单词并入同主题或其他未满组 */
const MIN_FILL = 5

function redistributeSmallGroups(groups: ThemeGroupResult[]): ThemeGroupResult[] {
  const fixedGroups = groups.filter(
    (group) => group.themeId === 'preposition' || group.themeId === 'time_preposition',
  )
  const working = groups
    .filter((group) => group.themeId !== 'preposition' && group.themeId !== 'time_preposition')
    .map((group) => ({ ...group, wordIds: [...group.wordIds] }))

  let changed = true
  while (changed) {
    changed = false

    for (const small of working.filter(
      (group) => group.wordIds.length > 0 && group.wordIds.length < MIN_FILL,
    )) {
      while (small.wordIds.length > 0) {
        const recipients = working
          .filter((group) => group !== small && group.wordIds.length < MAX_GROUP_SIZE)
          .sort((a, b) => {
            const sameThemeA = a.themeId === small.themeId ? 0 : 1
            const sameThemeB = b.themeId === small.themeId ? 0 : 1
            if (sameThemeA !== sameThemeB) return sameThemeA - sameThemeB
            return b.wordIds.length - a.wordIds.length
          })

        const target = recipients[0]
        if (!target) break

        target.wordIds.push(small.wordIds.shift()!)
        changed = true
      }
    }

    for (let index = working.length - 1; index >= 0; index--) {
      if (working[index].wordIds.length === 0) {
        working.splice(index, 1)
        changed = true
      }
    }
  }

  return [...working, ...fixedGroups]
}

function buildFixedWordGroups(
  words: WordForThemeGroup[],
  definitions: Array<{ scene: string; words: string[] }>,
  themeId: string,
  titlePrefix: string,
): { groups: ThemeGroupResult[]; usedIds: Set<number> } {
  const byExact = new Map<string, WordForThemeGroup>()
  for (const word of words) {
    byExact.set(wordKey(word.word), word)
  }

  const usedIds = new Set<number>()
  const groups: ThemeGroupResult[] = []

  definitions.forEach((definition, index) => {
    const wordIds: number[] = []
    for (const target of definition.words) {
      const found = byExact.get(target.toLowerCase())
      if (found && !usedIds.has(found.id)) {
        wordIds.push(found.id)
        usedIds.add(found.id)
      }
    }
    if (wordIds.length === 0) return
    groups.push({
      title: `${titlePrefix}${index + 1}-${definition.scene}`,
      themeId,
      wordIds,
    })
  })

  return { groups, usedIds }
}

function buildPrepositionGroups(words: WordForThemeGroup[]): {
  groups: ThemeGroupResult[]
  usedIds: Set<number>
} {
  return buildFixedWordGroups(words, PREPOSITION_GROUP_DEFS, 'preposition', '介词')
}

function buildTimePrepositionGroups(words: WordForThemeGroup[]): {
  groups: ThemeGroupResult[]
  usedIds: Set<number>
} {
  return buildFixedWordGroups(
    words,
    TIME_PREPOSITION_GROUP_DEFS,
    'time_preposition',
    '时间',
  )
}

function buildGroupsForTheme(config: ThemeConfig, words: WordForThemeGroup[]): ThemeGroupResult[] {
  if (words.length === 0) return []
  if (config.id === 'preposition' || config.id === 'time_preposition') return []

  const ordered = orderWordsByPos(words)
  const chunks = balancedChunkWords(ordered, MAX_GROUP_SIZE)
  const results: ThemeGroupResult[] = []

  chunks.forEach((chunk, index) => {
    const scene = config.subScenes[index % config.subScenes.length]
    results.push({
      title: `${config.shortName}${index + 1}-${scene}`,
      themeId: config.id,
      wordIds: chunk.map((word) => word.id),
    })
  })

  return results
}

export function buildBeginnerThemeGroups(words: WordForThemeGroup[]): ThemeGroupResult[] {
  const { groups: timePrepositionGroups, usedIds: timeUsedIds } =
    buildTimePrepositionGroups(words)
  const { groups: prepositionGroups, usedIds: prepositionUsedIds } =
    buildPrepositionGroups(words)
  const usedIds = new Set([...timeUsedIds, ...prepositionUsedIds])
  const buckets = new Map<string, WordForThemeGroup[]>()

  for (const config of THEME_CONFIGS) {
    buckets.set(config.id, [])
  }

  for (const word of words) {
    if (usedIds.has(word.id)) continue
    const themeId = classifyWord(word.word, word.pos)
    buckets.get(themeId)!.push(word)
  }

  const results: ThemeGroupResult[] = []

  for (const config of THEME_CONFIGS) {
    if (config.id === 'preposition' || config.id === 'time_preposition') continue
    const themeWords = buckets.get(config.id) ?? []
    if (themeWords.length === 0) continue
    results.push(...buildGroupsForTheme(config, themeWords))
  }

  return redistributeSmallGroups([
    ...results,
    ...prepositionGroups,
    ...timePrepositionGroups,
  ])
}

export function extractBaseWord(raw: string): string {
  return baseWord(raw)
}
