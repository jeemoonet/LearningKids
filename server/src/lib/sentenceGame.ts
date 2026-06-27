import {
  SENTENCE_LEVEL_TEMPLATES,
  SENTENCE_ROLE_LABELS,
  type SentenceRole,
  type SentenceTemplate,
} from './sentenceTemplates.js'
import { collectVerbsFromSentence, verbsFromStructureNote } from './sentenceVerbs.js'

export type SentenceTrack = 'structure' | 'tense' | 'adverbial' | 'adj-adv' | 'boss'

export interface SentenceLevel {
  id: string
  track: SentenceTrack
  title: string
  scene: string
  ruleSummary: string
  questionCount: number
  focusRoles: string[]
}

export interface SentenceQuestion {
  id: string
  levelId: string
  sentence: string
  sentenceZh: string
  verbs: string[]
  options: string[]
  correctIndex: number
  answer: string
  role: SentenceRole
  roleLabel: string
  structureNote: string
  hint: string
}

export const SENTENCE_DEFAULT_ROUND_COUNT = 6
export const SENTENCE_EXAM_ROUND_COUNT = 10

interface LevelDef {
  id: string
  track: SentenceTrack
  title: string
  scene: string
  ruleSummary: string
  focusRoles: SentenceRole[]
  roundCount?: number
}

const LEVEL_DEFS: LevelDef[] = [
  {
    id: 'struct-1',
    track: 'structure',
    title: '主谓宾',
    scene: '主 + 谓 + 宾',
    ruleSummary: '先找主语（谁），再选谓语动词（做什么），最后接宾语（什么）',
    focusRoles: ['predicate'],
  },
  {
    id: 'struct-2',
    track: 'structure',
    title: '定语',
    scene: '形容词修饰名词',
    ruleSummary: '定语放在名词前，用形容词描述「什么样的」',
    focusRoles: ['attributive'],
  },
  {
    id: 'struct-3',
    track: 'structure',
    title: '状语入门',
    scene: '副词修饰动词',
    ruleSummary: '状语说明「怎么样做」，修饰动词时常用副词',
    focusRoles: ['adverbial'],
  },
  {
    id: 'adv-time',
    track: 'structure',
    title: '时间状语',
    scene: '何时 · 多久 · 频率',
    ruleSummary: '时间状语回答 When？注意 at/on/in、for/since、every 等搭配',
    focusRoles: ['adverbial'],
  },
  {
    id: 'adv-place',
    track: 'structure',
    title: '地点状语',
    scene: '何处 · 方位',
    ruleSummary: '地点状语回答 Where？注意 in/on/at、behind/along/under 等方位词',
    focusRoles: ['adverbial'],
  },
  {
    id: 'adv-3',
    track: 'structure',
    title: '状语高级',
    scene: '时间 + 地点',
    ruleSummary: '混合时间与地点状语，判断空格回答 When 还是 Where',
    focusRoles: ['adverbial'],
    roundCount: 8,
  },
  {
    id: 'struct-4',
    track: 'structure',
    title: '高级',
    scene: '至少五种成分',
    ruleSummary: '综合运用主谓宾定状补，每句至少包含五种句子成分',
    focusRoles: ['subject', 'predicate', 'object', 'attributive', 'adverbial', 'complement'],
  },
  {
    id: 'tense-1',
    track: 'tense',
    title: '一般时态',
    scene: '现在 · 过去 · 将来',
    ruleSummary: '看时间标志词：every day→一般现在时，yesterday→过去时，will→将来时',
    focusRoles: ['predicate'],
  },
  {
    id: 'tense-2',
    track: 'tense',
    title: '完成时',
    scene: 'have/has · had',
    ruleSummary: 'since/for 用现在完成时；过去的过去用过去完成时 had + 过去分词',
    focusRoles: ['predicate'],
  },
  {
    id: 'tense-3',
    track: 'tense',
    title: '动词变化',
    scene: '三单 · 不规则 · 进行',
    ruleSummary: '第三人称单数加 -s/-es；不规则动词需单独记忆；进行时用 be + doing',
    focusRoles: ['predicate'],
  },
  {
    id: 'tense-4',
    track: 'tense',
    title: '高级',
    scene: '时态综合',
    ruleSummary: '混合一般时、完成时与动词变化，先读时间标志再选谓语',
    focusRoles: ['predicate'],
    roundCount: 8,
  },
  {
    id: 'adj-adv-1',
    track: 'adj-adv',
    title: '学者魔法师辨析',
    scene: '学者 vs 魔法师',
    ruleSummary: '修饰名词用学者；修饰动词/学者/魔法师用魔法师；系动词后接学者',
    focusRoles: ['adverbial', 'complement', 'attributive'],
  },
  {
    id: 'adj-adv-2',
    track: 'adj-adv',
    title: '比较级最高级',
    scene: '更… · 最…',
    ruleSummary: 'than 用比较级；the … of all / ever 用最高级；-er/-est 或 more/most',
    focusRoles: ['adverbial', 'complement', 'attributive'],
  },
  {
    id: 'adj-adv-3',
    track: 'adj-adv',
    title: '高级',
    scene: '学者魔法师综合',
    ruleSummary: '混合学者魔法师辨析与比较等级，注意修饰对象与比较结构',
    focusRoles: ['adverbial', 'complement', 'attributive'],
    roundCount: 8,
  },
]

const BOSS_LEVEL: LevelDef = {
  id: 'boss',
  track: 'boss',
  title: '综合闯关',
  scene: '主谓宾定状补',
  ruleSummary: '混合考查句子成分、时态、状语与形副用法，先判断空格成分再选词',
  focusRoles: ['predicate', 'attributive', 'adverbial', 'complement'],
  roundCount: SENTENCE_EXAM_ROUND_COUNT,
}

const TEMPLATE_MAP = new Map(
  SENTENCE_LEVEL_TEMPLATES.map((entry) => [entry.levelId, entry.templates]),
)

/** 高级关：合并同赛道前置关卡模板 */
const ADVANCED_LEVEL_SOURCES: Record<string, string[]> = {
  'tense-4': ['tense-1', 'tense-2', 'tense-3'],
  'adv-3': ['adv-time', 'adv-place'],
  'adj-adv-3': ['adj-adv-1', 'adj-adv-2'],
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function buildOptions(answer: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const unique = new Set<string>([answer])
  const finalDistractors: string[] = []

  for (const item of distractors) {
    if (unique.has(item)) continue
    unique.add(item)
    finalDistractors.push(item)
    if (finalDistractors.length >= 3) break
  }

  while (finalDistractors.length < 3) {
    const filler = `(${finalDistractors.length + 1})`
    if (!unique.has(filler)) {
      unique.add(filler)
      finalDistractors.push(filler)
    } else {
      break
    }
  }

  const options = shuffle([answer, ...finalDistractors.slice(0, 3)])
  return {
    options,
    correctIndex: options.findIndex((item) => item.toLowerCase() === answer.toLowerCase()),
  }
}

function verbsForTemplate(template: SentenceTemplate): string[] {
  const filledSentence = template.sentence.replace('{blank}', template.answer)
  const hints = verbsFromStructureNote(template.structureNote)
  if (template.role === 'predicate') {
    hints.push(template.answer)
  }
  return collectVerbsFromSentence(filledSentence, hints)
}

function templateToQuestion(
  levelId: string,
  template: SentenceTemplate,
  questionIndex: number,
  sessionId: string,
): SentenceQuestion {
  const sentence = template.sentence.replace('{blank}', '______')
  const { options, correctIndex } = buildOptions(template.answer, template.distractors)

  return {
    id: `${levelId}-${sessionId}-${questionIndex}`,
    levelId,
    sentence,
    sentenceZh: template.sentenceZh,
    verbs: verbsForTemplate(template),
    options,
    correctIndex,
    answer: template.answer,
    role: template.role,
    roleLabel: SENTENCE_ROLE_LABELS[template.role],
    structureNote: template.structureNote,
    hint: template.hint,
  }
}

function getTemplatesForLevel(levelId: string): SentenceTemplate[] {
  if (levelId === 'boss') {
    return SENTENCE_LEVEL_TEMPLATES.flatMap((entry) => entry.templates)
  }

  const advancedSources = ADVANCED_LEVEL_SOURCES[levelId]
  if (advancedSources) {
    return advancedSources.flatMap((sourceId) => TEMPLATE_MAP.get(sourceId) ?? [])
  }

  return TEMPLATE_MAP.get(levelId) ?? []
}

function getRoundCount(def: LevelDef): number {
  return def.roundCount ?? SENTENCE_DEFAULT_ROUND_COUNT
}

function createSessionId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function normalizeDrawKey(sentence: string, answer: string): string {
  return `${sentence.replace('{blank}', '______')}|${answer}`
}

function templateKey(template: SentenceTemplate): string {
  return normalizeDrawKey(template.sentence, template.answer)
}

/** 从题库随机抽题；excludeKeys 用于「再练一轮」时尽量避开上一轮题目 */
function pickTemplates(
  templates: SentenceTemplate[],
  roundCount: number,
  excludeKeys: string[] = [],
): SentenceTemplate[] {
  const exclude = new Set(excludeKeys)
  let pool = shuffle(templates.filter((item) => !exclude.has(templateKey(item))))

  // 排除后不够题量则回退全池，但仍优先未出现过的题
  if (pool.length < roundCount) {
    const seen = new Set(pool.map(templateKey))
    const rest = shuffle(templates.filter((item) => !seen.has(templateKey(item))))
    pool = [...pool, ...rest]
    if (pool.length < roundCount) {
      pool = shuffle(templates)
    }
  }

  const selected: SentenceTemplate[] = []
  const used = new Set<string>()

  for (const template of pool) {
    if (selected.length >= roundCount) break
    const key = templateKey(template)
    if (used.has(key)) continue
    used.add(key)
    selected.push(template)
  }

  return selected.slice(0, roundCount)
}

function getLevelDef(levelId: string): LevelDef | undefined {
  if (levelId === 'boss') return BOSS_LEVEL
  return LEVEL_DEFS.find((item) => item.id === levelId)
}

export function generateSentenceSession(
  levelId: string,
  count?: number,
  excludeKeys: string[] = [],
): SentenceQuestion[] {
  const def = getLevelDef(levelId)
  if (!def) return []

  const roundCount = count ?? getRoundCount(def)
  const templates = getTemplatesForLevel(levelId)
  if (templates.length === 0) return []

  const sessionId = createSessionId()
  const picked = pickTemplates(templates, roundCount, excludeKeys)
  const questions = picked.map((template, index) =>
    templateToQuestion(levelId, template, index, sessionId),
  )

  return shuffle(questions)
}

export function listSentenceLevels(): SentenceLevel[] {
  const levels = LEVEL_DEFS.map((def) => ({
    id: def.id,
    track: def.track,
    title: def.title,
    scene: def.scene,
    ruleSummary: def.ruleSummary,
    questionCount: getRoundCount(def),
    focusRoles: def.focusRoles.map((role) => SENTENCE_ROLE_LABELS[role]),
  }))

  levels.push({
    id: BOSS_LEVEL.id,
    track: BOSS_LEVEL.track,
    title: BOSS_LEVEL.title,
    scene: BOSS_LEVEL.scene,
    ruleSummary: BOSS_LEVEL.ruleSummary,
    questionCount: getRoundCount(BOSS_LEVEL),
    focusRoles: BOSS_LEVEL.focusRoles.map((role) => SENTENCE_ROLE_LABELS[role]),
  })

  return levels
}

export function getSentenceQuestions(
  levelId: string,
  count?: number,
  excludeKeys: string[] = [],
): SentenceQuestion[] {
  return generateSentenceSession(levelId, count, excludeKeys)
}

export function getSentenceLevelRule(levelId: string): string {
  const def = getLevelDef(levelId)
  return def?.ruleSummary ?? ''
}
