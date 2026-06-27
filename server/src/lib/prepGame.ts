import type { DatabaseSync } from 'node:sqlite'
import { PREP_TEMPLATES, PREP_LEVEL_TEMPLATES, PREP_TEMPLATE_VERB_LEXICON } from './prepTemplates.js'
import { mapWordRow } from './gameGroups.js'
import { collectVerbsFromSentence } from './sentenceVerbs.js'

export type PrepTrack = 'time' | 'position' | 'more'

export interface PrepLevel {
  id: string
  track: PrepTrack
  groupIndex: number
  title: string
  scene: string
  ruleSummary: string
  questionCount: number
  prepWords: string[]
}

export interface PrepQuestion {
  id: string
  levelId: string
  sentence: string
  sentenceZh: string
  verbs: string[]
  options: string[]
  correctIndex: number
  answer: string
  hint: string
  source: 'template' | 'passage' | 'example'
}

export const PREP_DEFAULT_ROUND_COUNT = 8

const TIER_ID = 'beginner'

export const HIGH_FREQ_PREPOSITIONS = [
  'at', 'on', 'in',
  'for', 'by', 'from', 'to',
  'before', 'after', 'since', 'during',
  'past', 'about',
  'above', 'under', 'below',
] as const

export type HighFreqPreposition = (typeof HIGH_FREQ_PREPOSITIONS)[number]

export const MORE_PREPOSITIONS = [
  'of', 'with',
  'across', 'over', 'through',
  'out', 'off',
  'out of',
  'inside', 'outside', 'toward', 'towards', 'until',
  'against', 'without', 'within', 'beyond', 'ago',
] as const

export type MorePreposition = (typeof MORE_PREPOSITIONS)[number]

const HIGH_FREQ_SET = new Set<string>(HIGH_FREQ_PREPOSITIONS)
const MORE_SET = new Set<string>(MORE_PREPOSITIONS)
const ALL_PREP_SET = new Set<string>([...HIGH_FREQ_PREPOSITIONS, ...MORE_PREPOSITIONS])

interface LevelDef {
  id: string
  track: PrepTrack
  groupIndexes: number[]
  words: string[]
  title: string
  scene: string
  ruleSummary: string
  roundCount?: number
}

const LEVEL_DEFS: LevelDef[] = [
  {
    id: 'hf-1',
    track: 'time',
    groupIndexes: [90],
    words: ['at', 'on', 'in'],
    title: '万能三兄弟',
    scene: 'at · on · in',
    ruleSummary: 'at 接时刻，on 接日期，in 接月份/季节/较长时段（北京中考每年必考）',
  },
  {
    id: 'hf-2',
    track: 'time',
    groupIndexes: [91],
    words: ['for', 'since', 'during', 'until'],
    title: '连续精灵',
    scene: 'for · since · during · until',
    ruleSummary: 'for 表持续多久，since 表从何时起，during 表在……期间，until 表直到……为止',
  },
  {
    id: 'hf-3',
    track: 'time',
    groupIndexes: [92],
    words: ['before', 'after', 'from', 'ago'],
    title: '顺序精灵',
    scene: 'before · after · from · ago',
    ruleSummary: 'before/after 表先后，from 常与 to 连用表起止，ago 表……前（用于过去时间）',
  },
  {
    id: 'hf-4',
    track: 'time',
    groupIndexes: [93],
    words: ['past', 'to', 'about'],
    title: '钟表精灵',
    scene: 'past · to · about',
    ruleSummary: 'past/to 表钟点差几分，about 表大约某个时间',
  },
  {
    id: 'pos-1',
    track: 'position',
    groupIndexes: [],
    words: ['at', 'on', 'in'],
    title: '万能三兄弟',
    scene: 'at · on · in',
    ruleSummary: 'at 表具体地点，on 表表面之上，in 表空间内部或较大区域（位置考点）',
  },
  {
    id: 'hf-5',
    track: 'position',
    groupIndexes: [],
    words: ['on', 'above', 'under', 'below'],
    title: '上下精灵',
    scene: 'on · above · under · below',
    ruleSummary: 'on 表表面接触，above 表上方，under/below 表下方',
  },
  {
    id: 'more-1',
    track: 'more',
    groupIndexes: [],
    words: ['with', 'without', 'by'],
    title: '伴随精灵',
    scene: 'with · without · by',
    ruleSummary: 'with 表伴随/工具，without 表没有/不带，by 表方式/手段或被动行为者',
  },
  {
    id: 'more-2',
    track: 'position',
    groupIndexes: [],
    words: ['across', 'over', 'through'],
    title: '穿越精灵',
    scene: 'across · over · through',
    ruleSummary: 'across 表横穿，over 表越过/在上方跨越，through 表穿过内部',
  },
  {
    id: 'pos-2',
    track: 'position',
    groupIndexes: [],
    words: ['out', 'off'],
    title: '消失精灵',
    scene: 'out · off',
    ruleSummary: 'out/off 常与动词连用：出去/离开/脱落/关闭，搭配武士 Verb 一起记',
  },
  {
    id: 'pos-3',
    track: 'position',
    groupIndexes: [],
    words: ['in', 'inside', 'out', 'outside', 'out of'],
    title: '内外精灵',
    scene: 'in · inside · out · outside · out of',
    ruleSummary: 'in/inside/out of 接平民（名词）；out/outside 接武士（动词）',
  },
  {
    id: 'more-5',
    track: 'more',
    groupIndexes: [],
    words: ['between...and', 'from...to'],
    title: '配对精灵',
    scene: 'between…and · from…to',
    ruleSummary: 'between 与 and 成对表两者之间；from 与 to 成对表从 A 到 B',
  },
  {
    id: 'more-4',
    track: 'more',
    groupIndexes: [],
    words: ['for', 'against'],
    title: '支持精灵',
    scene: 'for · against',
    ruleSummary: 'for 表目的/对象/给某人，against 表对抗/倚靠',
  },
]

const PREP_HINTS: Record<string, string> = {
  at: 'at 用于具体时刻，如 at three、at half past seven。',
  on: 'on 用于具体某一天/日期，如 on Sunday、on May 8th。',
  in: 'in 用于月份、季节、年份或较长时段，如 in June、in the evening。',
  for: 'for + 时间段，表示持续多久；也可表「给某人」，如 a gift for you。',
  since: 'since + 时间点，表示从某时开始一直到现在。',
  during: 'during + 名词，表示在……期间。',
  through: 'through 表示贯穿整个过程。',
  before: 'before 表示在……之前。',
  after: 'after 表示在……之后。',
  by: 'by 表示不晚于某个时间，即「在……之前/到……为止」。',
  from: 'from 表示从……开始，常与 to 连用。',
  to: 'to 可表示差几分（a quarter to ten），也可与 from 连用表起止。',
  past: 'past 表示过几分，如 ten past nine。',
  around: 'around 表示大约某个时间。',
  over: 'over 表示跨越一段时间，如 over the weekend。',
  between: 'between 表示在两者之间。',
  behind: 'behind 表示在……后面。',
  among: 'among 表示在……之中（三者及以上）。',
  into: 'into 表示进入到……里面。',
  off: 'off 表示从……离开/掉落；常与动词构成短语，如 take off、get off。',
  out: 'out 表示向外、出去；常与动词构成短语，如 go out、walk out。',
  along: 'along 表示沿着……。',
  of: 'of 表示……的/属于……，如 a cup of tea。',
  with: 'with 表示和……一起，或用……工具。',
  about: 'about 表示大约某个时间，如 about seven；也可表示关于某个话题。',
  under: 'under 表示在……下面。',
  above: 'above 表示在……上方。',
  below: 'below 表示在……下面/低于……。',
  across: 'across 表示横穿/在……对面。',
  against: 'against 表示倚靠/对抗。',
  without: 'without 表示没有/不带……。',
  within: 'within 表示在……之内/不超过……。',
  beyond: 'beyond 表示在……那边/超出……。',
  inside: 'inside 表示在……里面。',
  outside: 'outside 表示在……外面。',
  toward: 'toward 表示朝……方向。',
  towards: 'towards 与 toward 同义，表示朝……方向。',
  until: 'until 表示直到……为止。',
  ago: 'ago 表示……之前，用于过去时间点。',
}

const PREP_LEVEL_HINTS: Record<string, Record<string, string>> = {
  'pos-1': {
    at: 'at 用于具体地点或小位置，如 at home、at the bus stop。',
    on: 'on 用于表面之上，如 on the desk、on the wall。',
    in: 'in 用于空间内部或较大区域，如 in the classroom、in Beijing。',
  },
  'hf-5': {
    on: 'on 表示与表面接触、在……上面，如 on the desk。',
    above: 'above 表示在……上方（不一定接触），如 above the clouds。',
    under: 'under 表示在……正下方，如 under the bed。',
    below: 'below 表示在……下方或低于……，如 below zero。',
  },
  'more-2': {
    across: 'across 表示横穿平面，从一侧到另一侧，如 across the street。',
    over: 'over 表示越过或从上方跨越，如 jump over the fence、a bridge over the river。',
    through: 'through 表示从内部穿过，如 walk through the tunnel。',
  },
  'pos-2': {
    out: 'out 常与 go/walk/run 等动词连用，表示出去或向外，如 go out、walk out of。',
    off: 'off 常与 take/get/fall/turn 等动词连用，表示脱离、下车、关闭或出发，如 take off、get off。',
  },
  'pos-3': {
    in: 'in + 名词（平民）：较大区域或容器内，如 in the box、in Beijing。',
    inside: 'inside + 名词（平民）：强调在内部，如 inside the classroom。',
    out: 'out 与武士动词连用：go out、come out，表示向外/出去。',
    outside: 'outside 与动词或名词：go outside、outside the gate。',
    'out of': 'out of + 名词（平民）：从……里出来，如 out of the room、out of the bag；常与 run/take/get 等动词连用。',
  },
  'more-5': {
    'between...and':
      'between...and 表两者之间，结构：between A and B。本题空缺处填 and。',
    'from...to': 'from...to 表从 A 到 B，结构：from Monday to Friday。本题空缺处填 to。',
  },
  'more-1': {
    with: 'with 表示和……一起，或用……工具/方式。',
    without: 'without 表示没有/不带……。',
    by: 'by 表示方式/手段（by bus），或被动句中的行为者（written by Tom）。',
  },
  'hf-3': {
    ago: 'ago 表示……之前，用于过去时间点，通常放句末，如 two days ago。',
  },
  'hf-2': {
    until: 'until 表示直到……为止，如 Wait until I come back。',
  },
  'more-4': {
    for: 'for 表示目的/对象/给某人，如 a gift for you、study for the exam。',
    against: 'against 表示倚靠/对抗，如 against the wall、play against another team。',
  },
}

const CORE_DISTRACTORS = ['at', 'on', 'in', 'to', 'for', 'by', 'from']

const EXTRA_DISTRACTORS: Record<string, string[]> = {
  'hf-1': ['to'],
  'pos-1': ['to'],
  'hf-2': ['in', 'to', 'at'],
  'hf-3': ['to', 'by', 'in'],
  'hf-4': ['at', 'in'],
  'hf-5': ['in', 'at', 'on'],
  'more-1': ['of', 'for', 'in'],
  'more-2': ['on', 'in', 'above'],
  'pos-2': ['in', 'on', 'away'],
  'pos-3': ['into', 'outside', 'inside'],
  'more-4': ['with', 'in', 'to'],
  'more-5': ['and', 'to', 'or', 'with'],
}

interface QuestionSeed {
  prep: string
  sentence: string
  sentenceZh: string
  verbs: string[]
  source: PrepQuestion['source']
  /** 配对介词关卡：挖空的连接词（and / to） */
  linkAnswer?: string
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function containsPrep(sentence: string, prep: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(prep)}\\b`, 'i')
  return pattern.test(sentence)
}

function blankPrep(sentence: string, prep: string): string | null {
  const pattern = new RegExp(`\\b${escapeRegex(prep)}\\b`, 'i')
  if (!pattern.test(sentence)) return null
  return sentence.replace(pattern, '______')
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function pickDistractors(levelId: string, answer: string, levelWords: string[]): string[] {
  const pool = new Set<string>()
  for (const word of levelWords) {
    if (word.toLowerCase() !== answer.toLowerCase()) pool.add(word)
  }
  for (const word of EXTRA_DISTRACTORS[levelId] ?? []) {
    if (word.toLowerCase() !== answer.toLowerCase()) pool.add(word)
  }
  for (const word of CORE_DISTRACTORS) {
    if (word.toLowerCase() !== answer.toLowerCase()) pool.add(word)
  }
  return shuffle([...pool]).slice(0, 3)
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

  for (const filler of CORE_DISTRACTORS) {
    if (finalDistractors.length >= 3) break
    if (unique.has(filler) || filler.toLowerCase() === answer.toLowerCase()) continue
    unique.add(filler)
    finalDistractors.push(filler)
  }

  const options = shuffle([answer, ...finalDistractors.slice(0, 3)])
  return { options, correctIndex: options.findIndex((item) => item.toLowerCase() === answer.toLowerCase()) }
}

function findSentenceZh(
  sentenceEn: string,
  passageEn: string,
  passageZh: string,
  fallbackZh: string,
): string {
  const enParts = splitSentences(passageEn)
  const zhParts = splitSentences(passageZh)
  const index = enParts.findIndex(
    (part) => part.toLowerCase().includes(sentenceEn.toLowerCase().slice(0, 12)),
  )
  if (index >= 0 && zhParts[index]) return zhParts[index]
  return fallbackZh
}

function loadGroupData(db: DatabaseSync, groupIndex: number) {
  const group = db
    .prepare(
      'SELECT group_index, title, passage_en, passage_zh FROM game_tier_groups WHERE tier_id = ? AND group_index = ?',
    )
    .get(TIER_ID, groupIndex) as
    | { group_index: number; title: string; passage_en: string; passage_zh: string }
    | undefined

  if (!group) return null

  const wordRows = db
    .prepare(
      `
      SELECT w.* FROM words w
      INNER JOIN game_word_assignments a ON a.word_id = w.id
      WHERE a.tier_id = ? AND a.group_index = ?
      ORDER BY w.sort_order, w.id
      `,
    )
    .all(TIER_ID, groupIndex) as Array<Record<string, unknown>>

  return {
    group,
    words: wordRows.map((row) => mapWordRow(row)),
  }
}

function collectTemplateSeeds(def: LevelDef): QuestionSeed[] {
  const seeds: QuestionSeed[] = []
  const levelTemplates = PREP_LEVEL_TEMPLATES[def.id]
  for (const prep of def.words) {
    const templates =
      levelTemplates?.[prep.toLowerCase()] ?? PREP_TEMPLATES[prep.toLowerCase()] ?? []
    for (const template of templates) {
      seeds.push({
        prep,
        sentence: template.sentence,
        sentenceZh: template.sentenceZh,
        verbs: template.verbs,
        source: 'template',
        linkAnswer: template.link,
      })
    }
  }
  return seeds
}

function inferVerbsForPassageSentence(sentence: string): string[] {
  const hints = PREP_TEMPLATE_VERB_LEXICON.filter((verb) => {
    const pattern = new RegExp(`\\b${escapeRegex(verb)}\\b`, 'i')
    return pattern.test(sentence)
  })
  return collectVerbsFromSentence(sentence, hints)
}

function allowedPrepSet(track: PrepTrack): Set<string> {
  return track === 'more' ? MORE_SET : HIGH_FREQ_SET
}

function collectDatabaseSeeds(db: DatabaseSync, def: LevelDef): QuestionSeed[] {
  const allowed = new Set(def.words.map((word) => word.toLowerCase()))
  const prepSet = allowedPrepSet(def.track)
  const seeds: QuestionSeed[] = []

  for (const groupIndex of def.groupIndexes) {
    const data = loadGroupData(db, groupIndex)
    if (!data) continue

    for (const word of data.words) {
      const prep = word.word.trim()
      if (!allowed.has(prep.toLowerCase()) || !prepSet.has(prep.toLowerCase())) continue

      let sentenceEn = ''
      let sentenceZh = word.exampleZh
      let source: PrepQuestion['source'] = 'example'

      for (const part of splitSentences(data.group.passage_en)) {
        if (containsPrep(part, prep)) {
          sentenceEn = part
          sentenceZh = findSentenceZh(part, data.group.passage_en, data.group.passage_zh, word.exampleZh)
          source = 'passage'
          break
        }
      }

      if (!sentenceEn && word.exampleEn && containsPrep(word.exampleEn, prep)) {
        sentenceEn = word.exampleEn
        sentenceZh = word.exampleZh
        source = 'example'
      }

      if (!sentenceEn) continue
      const pattern = new RegExp(`\\b${escapeRegex(prep)}\\b`, 'i')
      if (!pattern.test(sentenceEn)) continue

      seeds.push({
        prep,
        sentence: sentenceEn.replace(pattern, '{prep}'),
        sentenceZh,
        verbs: inferVerbsForPassageSentence(sentenceEn),
        source,
      })
    }
  }

  return seeds
}

function collectAllSeeds(db: DatabaseSync, def: LevelDef): QuestionSeed[] {
  const merged = [...collectTemplateSeeds(def), ...collectDatabaseSeeds(db, def)]
  const seen = new Set<string>()
  return merged.filter((seed) => {
    const key = `${seed.prep}:${seed.sentence}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function seedToQuestion(
  levelId: string,
  levelWords: string[],
  seed: QuestionSeed,
  questionIndex: number,
  sessionId: string,
): PrepQuestion {
  const pairId = seed.prep
  const answer = seed.linkAnswer ?? seed.prep
  let sentence = seed.sentence
  if (seed.linkAnswer) {
    sentence = sentence.replace('{link}', '______')
  } else if (sentence.includes('{prep}')) {
    sentence = sentence.replace('{prep}', '______')
  }
  const distractors = pickDistractors(levelId, answer, levelWords)
  const { options, correctIndex } = buildOptions(answer, distractors)
  const hint =
    PREP_LEVEL_HINTS[levelId]?.[pairId.toLowerCase()] ??
    PREP_LEVEL_HINTS[levelId]?.[answer.toLowerCase()] ??
    PREP_HINTS[answer.toLowerCase()] ??
    `此处应填 ${answer}。`

  return {
    id: `${levelId}-${sessionId}-${questionIndex}-${pairId}`,
    levelId,
    sentence,
    sentenceZh: seed.sentenceZh,
    verbs: collectVerbsFromSentence(sentence, seed.verbs),
    options,
    correctIndex,
    answer,
    hint,
    source: seed.source,
  }
}

function getRoundCount(def: LevelDef): number {
  return def.roundCount ?? PREP_DEFAULT_ROUND_COUNT
}

function createSessionId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function generatePrepSession(
  db: DatabaseSync,
  levelId: string,
  count?: number,
): PrepQuestion[] {
  const def = LEVEL_DEFS.find((item) => item.id === levelId)
  if (!def) return []

  const roundCount = count ?? getRoundCount(def)
  const seeds = collectAllSeeds(db, def)
  if (seeds.length === 0) return []

  const sessionId = createSessionId()
  const levelWords = [...def.words]
  const questions: PrepQuestion[] = []
  const usedKeys = new Set<string>()

  const priorityPreps = shuffle([...levelWords])
  let prepCursor = 0
  let guard = 0

  while (questions.length < roundCount && guard < roundCount * 20) {
    guard += 1
    const prep = priorityPreps[prepCursor % priorityPreps.length]
    prepCursor += 1

    const prepSeeds = seeds.filter((seed) => seed.prep.toLowerCase() === prep.toLowerCase())
    if (prepSeeds.length === 0) continue

    const fresh = prepSeeds.filter((seed) => !usedKeys.has(`${seed.prep}:${seed.sentence}`))
    const pool = fresh.length > 0 ? fresh : prepSeeds
    const seed = pool[Math.floor(Math.random() * pool.length)]
    usedKeys.add(`${seed.prep}:${seed.sentence}`)

    questions.push(seedToQuestion(def.id, levelWords, seed, questions.length, sessionId))
  }

  return shuffle(questions)
}

export function listPrepLevels(db: DatabaseSync): PrepLevel[] {
  return LEVEL_DEFS.map((def) => ({
    id: def.id,
    track: def.track,
    groupIndex: def.groupIndexes[0] ?? 0,
    title: def.title,
    scene: def.scene,
    ruleSummary: def.ruleSummary,
    questionCount: getRoundCount(def),
    prepWords: def.words,
  }))
}

export function getPrepQuestions(db: DatabaseSync, levelId: string, count?: number): PrepQuestion[] {
  return generatePrepSession(db, levelId, count)
}

export function getPrepLevelRule(_db: DatabaseSync, levelId: string): string {
  const def = LEVEL_DEFS.find((item) => item.id === levelId)
  return def?.ruleSummary ?? ''
}

export function isHighFreqPreposition(word: string): boolean {
  return HIGH_FREQ_SET.has(word.trim().toLowerCase())
}

export function isMorePreposition(word: string): boolean {
  return MORE_SET.has(word.trim().toLowerCase())
}

export function isPrepWord(word: string): boolean {
  return ALL_PREP_SET.has(word.trim().toLowerCase())
}
