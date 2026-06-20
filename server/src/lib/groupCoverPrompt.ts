/**
 * 单词小组配图 — 提示词与元数据（供脚本 / 服务端使用）
 * 规则文档：doc/3.开发/DOC-DEV-002-单词小组配图规则.md
 * 出图：prompt 供 Cursor Skills（GenerateImage）使用；备选 Gemini 脚本
 */

const BASE_WORD_RE = /^([a-zA-Z]+(?:'[a-zA-Z]+)?)/

export type WordPos = 'noun' | 'verb' | 'adj' | 'adv' | 'other'

export interface GroupCoverWord {
  word: string
  pos: WordPos
}

export interface GroupCoverMeta {
  tierId: string
  groupIndex: number
  title: string
  words: GroupCoverWord[]
  scene: string
  theme: string
}

const SCENE_PALETTE: Record<string, string> = {
  教室: 'soft blue, white, light yellow',
  课程: 'warm orange and blue',
  考试: 'calm green and gray',
  老师: 'soft blue and beige',
  同学: 'bright cyan and coral',
  作业: 'warm amber and white',
  图书馆: 'deep blue and wood brown',
  课堂: 'sky blue and mint',
  房间: 'cozy beige and pastel green',
  三餐: 'warm red and cream',
  家人: 'soft pink and brown',
  餐厅: 'red and warm yellow',
  超市: 'green and white',
  温度: 'cool blue and white',
  自然: 'forest green and sky blue',
  球类: 'vibrant orange and grass green',
  问路: 'city gray and blue',
  春节: 'festive red and gold',
  常用: 'neutral gray and blue',
  里外点高低: 'sky blue, warm beige, soft green',
  前后旁之间: 'coral, mint, light gray',
  近远周围里外: 'teal, sand yellow, forest green',
  进出上下到: 'orange, white, wood brown',
  路径方向: 'grass green, road gray, sky blue',
  点子面段: 'sky blue, cream white, soft orange',
  持续与起点: 'teal, amber, light gray',
  先后与截止: 'coral, slate gray, mint',
  钟点与其他: 'lavender, clock white, sky blue',
  易混非介词: 'warm yellow, pink, soft green',
}

const DEFAULT_PALETTE = 'soft pastel tones, friendly for teens'

/** 子场景场景锚点（精简版） */
const SCENE_ANCHORS: Record<string, string> = {
  房间: 'Anchors: bed, nightstand, window, side table.',
  三餐: 'Anchors: dining table, chairs, kitchen/dining background.',
  家人: 'Anchors: sofa, family photo wall, entryway.',
  家务: 'Anchors: kitchen counter, cleaning area.',
  客厅: 'Anchors: sofa, coffee table, bookshelf.',
  教室: 'Anchors: desks, whiteboard, window.',
  课程: 'Anchors: group table, whiteboard, classroom walls.',
  考试: 'Anchors: exam desks, wall clock, invigilator desk.',
  老师: 'Anchors: teacher desk, student desks.',
  同学: 'Anchors: classroom or hallway gathering spot.',
  作业: 'Anchors: student desk, lamp, homework.',
  图书馆: 'Anchors: bookshelves, reading table.',
  课堂: 'Anchors: teacher at board, student desks.',
  里外点高低: 'Anchors: desk, transparent box, table lamp, floor area.',
  前后旁之间: 'Anchors: classroom row, blackboard, corridor with pillars.',
  近远周围里外: 'Anchors: school building, door, park lake, small bridge.',
  进出上下到: 'Anchors: doorway, bed, table, path sign to school.',
  路径方向: 'Anchors: riverside path, zebra crossing, forest trail, fire warning.',
  点子面段: 'Anchors: wall clock, desk calendar, monthly planner, sunny window.',
  持续与起点: 'Anchors: timeline strip, hourglass, holiday banner, night-to-day sky.',
  先后与截止: 'Anchors: school schedule board, classroom door, deadline sticky notes.',
  钟点与其他: 'Anchors: large analog clock, weekly planner, weekend calendar strip.',
  易混非介词: 'Anchors: wall calendar with checkmarks, student desk, afternoon window.',
}

/** 子场景画面串联提示（精简版，控制总 prompt ≤2000 字） */
const SCENE_STORY_HINTS: Record<string, string> = {
  房间: 'Cozy bedroom: bed, calendar, alarm clock, bowl, sunny window, birthday cake.',
  三餐: 'Dining table with chairs, meal and dishes, family eating together.',
  家人: 'Home interior with family members and household props.',
  家务: 'Home chore moment with cleaning or tidying props.',
  客厅: 'Living room with sofa, coffee table, family activity.',
  教室: 'Classroom: desks, whiteboard, books, club poster, pencil case.',
  课程: 'Group lesson: study table, news board, form, math on board, level chart, doubt (?).',
  考试: 'Exam hall: desks, papers, wall clock, score sheet, rules poster.',
  老师: 'Classroom with teacher at front, students at desks.',
  同学: 'Classmates together in one classroom or hallway.',
  作业: 'Student desk with lamp and homework materials.',
  图书馆: 'Library with bookshelves and reading table.',
  课堂: 'Active class with teacher at board and students at desks.',
  里外点高低:
    'One cozy study corner: apple in box (in), cup on desk (on), red pin at desk corner (at), cat under desk (under), lamp above desk (above), floor below desk (below).',
  前后旁之间:
    'One classroom + hallway view: student behind pillar (behind), teacher in front of blackboard (in front of), chair beside desk (beside), student between two desks (between), one student among classmates (among), two shops opposite each other across street window (opposite).',
  近远周围里外:
    'One school + park scene: home near school (near), far mountain far from village (far from), trees around lake (around), students inside classroom through window (inside), students outside door (outside), bridge over river (over).',
  进出上下到:
    'One bedroom doorway scene: boy walking into room (into), girl running out of room (out of), arrow from city sign (from), cat jumping onto bed (onto), cup falling off table (off), path arrow to school gate (to).',
  路径方向:
    'One outdoor path scene: runner towards door (towards), student staying away from fire (away from), walking along river (along), walking past library (past), crossing street (across), walking through forest tunnel (through).',
  点子面段:
    'One student study corner: wall clock at 7:00 (at), desk calendar open to Monday (on), monthly planner showing March and morning sun through window (in).',
  持续与起点:
    'One study timeline scene: hourglass labeled 2 hours (for), timeline arrow from 2020 to now (since), holiday travel banner during break (during), student working from moon to sunrise through the night (through).',
  先后与截止:
    'One school schedule scene: homework stack before dinner clock (before), students playing after school bell (after), sticky note deadline by Friday (by), waiting bench until 5 o\'clock sign (until), daily schedule bar from 8 to 11 (from).',
  钟点与其他:
    'One clock classroom scene: analog clock ten past eight (past), analog clock ten to nine (to), clock hand around 6 with wavy approx mark (around), chat bubble over weekend calendar Sat-Sun (over), break slot between 2 and 4 on timetable (between).',
  易混非介词:
    'One calendar desk scene: calendar page 3 years ago with back arrow (ago), afternoon sun see-you-later note (later), calendar with checkmark every day row (every), each student at desk with one book (each).',
}

/** 常见词的具象化提示（按单词原形匹配，精简短语） */
const WORD_VISUAL_HINTS: Record<string, string> = {
  bed: 'wooden bed',
  clock: 'alarm clock',
  dish: 'bowl on table',
  cheat: 'no-cheating sign',
  case: 'pencil case',
  club: 'club poster',
  book: 'textbook',
  email: 'email on screen',
  fact: 'fact card on board',
  level: 'level chart',
  form: 'form on clipboard',
  math: 'math on whiteboard',
  news: 'news bulletin board',
  group: 'students at group table',
  score: 'score sheet',
  paper: 'test paper',
  rule: 'classroom rules poster',
  part: 'worksheet section',
  daily: 'wall calendar',
  day: 'sunny window',
  birth: 'birthday cake',
  chair: 'wooden dining chair at table',
  boy: 'boy sitting at dining table',
  dad: 'father at head of table',
  house: 'family house through window',
  end: 'wall clock showing evening end of day',
  kid: 'younger child on chair at table',
  need: 'hand raised for help',
  idea: 'lightbulb',
  mind: 'thought bubble',
  doubt: 'question mark',
  quiet: 'quiet sign',
  real: 'real apple',
  limit: 'wall clock/timer',
  key: 'answer key booklet',
  role: 'role name cards',
  fair: 'fair poster',
  once: 'storybook',
  new: 'NEW badge on book',
  june: 'June calendar page',
  word: 'vocabulary flashcard',
  ask: 'student raising hand',
  add: 'student adding numbers',
  meet: 'two students greeting',
  list: 'numbered checklist',
  plan: 'weekly plan chart',
  name: 'name tag on desk',
  use: 'student using laptop',
  help: 'student helping classmate',
  pick: 'hand picking item',
  pass: 'passing test paper',
  read: 'student reading book',
  write: 'student writing',
  open: 'opening door',
  close: 'closing book',
  wash: 'washing hands',
  cook: 'cooking at stove',
  clean: 'cleaning desk',
  in: 'apple inside transparent box',
  on: 'cup on desk surface',
  at: 'red location pin at desk corner',
  under: 'cat under desk',
  above: 'lamp hanging above desk',
  below: 'floor area below desk',
  behind: 'student behind pillar',
  'in front of': 'teacher in front of blackboard',
  beside: 'chair beside desk',
  between: 'student between two desks',
  among: 'student among classmates circle',
  opposite: 'two shops opposite across street',
  near: 'house near school building',
  'far from': 'distant mountain far from village',
  around: 'trees around lake',
  inside: 'students inside classroom',
  outside: 'students waiting outside door',
  over: 'small bridge over river',
  into: 'boy walking into room',
  'out of': 'girl running out of room',
  from: 'arrow from city name sign',
  to: 'path arrow to school gate',
  onto: 'cat jumping onto bed',
  off: 'cup falling off table edge',
  towards: 'runner moving towards door',
  'away from': 'student staying away from fire',
  along: 'person walking along riverside path',
  past: 'person walking past library building',
  across: 'person on zebra crossing',
  through: 'person walking through forest tunnel',
  for: 'hourglass showing 2 hours duration',
  since: 'timeline arrow from past year to now',
  during: 'holiday banner during school break',
  before: 'homework before dinner clock',
  after: 'students after school bell',
  by: 'deadline sticky note by Friday',
  until: 'waiting sign until 5 o\'clock',
  ago: 'calendar 3 years ago back arrow',
  later: 'afternoon see-you-later note',
  every: 'calendar with checkmark every day',
  each: 'each student with one book',
}

/** 时间介词等场景专用视觉映射（覆盖 WORD_VISUAL_HINTS） */
const SCENE_WORD_OVERRIDES: Record<string, Record<string, string>> = {
  点子面段: {
    at: 'wall clock at 7:00',
    on: 'desk calendar open to Monday',
    in: 'monthly planner March + morning sun',
  },
  持续与起点: {
    for: 'hourglass showing 2 hours',
    since: 'timeline arrow from 2020 to now',
    during: 'holiday travel banner during break',
    through: 'student working from moon to sunrise',
  },
  先后与截止: {
    before: 'homework stack before dinner clock',
    after: 'students playing after school bell',
    by: 'deadline sticky note by Friday',
    until: 'waiting bench until 5 o\'clock sign',
    from: 'schedule bar from 8 to 11',
  },
  钟点与其他: {
    past: 'analog clock ten past eight',
    to: 'analog clock ten to nine',
    around: 'clock around six with wavy approx mark',
    over: 'weekend calendar Sat-Sun chat bubble',
    between: 'timetable break between 2 and 4',
  },
  易混非介词: {
    ago: 'calendar page 3 years ago with back arrow',
    later: 'afternoon sun with see-you-later note',
    every: 'calendar row with checkmark every day',
    each: 'each student at desk with one book',
  },
}

export const MAX_GROUP_COVER_PROMPT_LENGTH = 2000

type VisualRole = 'noun' | 'verb' | 'adj' | 'adv' | 'other'

function normalizePos(pos: string | undefined): WordPos {
  if (pos === 'noun' || pos === 'verb' || pos === 'adj' || pos === 'adv') return pos
  return 'other'
}

function inferVisualRole(word: string, pos: WordPos): VisualRole {
  if (pos === 'noun') return 'noun'
  if (pos === 'verb') return 'verb'
  if (pos === 'adj') return 'adj'
  if (pos === 'adv') return 'adv'
  return 'other'
}

function defaultVisualByRole(word: string, role: VisualRole): string {
  switch (role) {
    case 'noun':
      return `${word} object`
    case 'verb':
      return `student ${word}ing`
    case 'adj':
      return `${word} quality badge`
    case 'adv':
      return `${word} motion cue`
    default:
      return `${word} sign/icon`
  }
}

function visualHintForWord(entry: GroupCoverWord, scene?: string): string {
  const role = inferVisualRole(entry.word, entry.pos)
  const sceneOverride = scene ? SCENE_WORD_OVERRIDES[scene]?.[entry.word] : undefined
  if (sceneOverride) return sceneOverride
  const custom = WORD_VISUAL_HINTS[entry.word]
  if (custom) return custom
  return defaultVisualByRole(entry.word, role)
}

function compactWordMappings(words: GroupCoverWord[], scene?: string): string {
  return words
    .map((entry) => {
      const role = inferVisualRole(entry.word, entry.pos)
      const tag = role === 'noun' ? 'n' : role === 'verb' ? 'v' : role === 'adj' ? 'adj' : role === 'adv' ? 'adv' : 'o'
      return `${entry.word}[${tag}:${visualHintForWord(entry, scene)}]`
    })
    .join(', ')
}

function sceneAnchorHint(scene: string): string | null {
  return SCENE_ANCHORS[scene] ?? null
}

function sceneStoryHint(scene: string, words: GroupCoverWord[]): string | null {
  const base = SCENE_STORY_HINTS[scene]
  if (base) return base
  if (words.length === 0) return null
  return `One coherent ${scene} scene where all vocabulary items appear as natural objects and actions in the same space.`
}

export function extractBaseWord(raw: string): string {
  const match = BASE_WORD_RE.exec(raw.trim())
  return (match?.[1] ?? raw).toLowerCase()
}

/** 配图标签用完整词条（保留 in front of 等短语介词） */
function coverWordLabel(raw: string): string {
  const cleaned = raw.trim().split('[')[0].trim()
  if (/\s/.test(cleaned)) return cleaned.toLowerCase()
  return extractBaseWord(raw)
}

export function parseGroupTitle(title: string): { theme: string; scene: string } {
  const dash = title.indexOf('-')
  if (dash === -1) return { theme: title, scene: title }
  const left = title.slice(0, dash)
  const scene = title.slice(dash + 1)
  const theme = left.replace(/\d+$/, '')
  return { theme, scene }
}

function paletteForScene(scene: string): string {
  return SCENE_PALETTE[scene] ?? DEFAULT_PALETTE
}

function trimToMaxLength(prompt: string, maxLength: number): string {
  if (prompt.length <= maxLength) return prompt
  return `${prompt.slice(0, maxLength - 3).trimEnd()}...`
}

export function buildGroupCoverPrompt(meta: GroupCoverMeta): string {
  const { title, words, scene, theme } = meta
  const wordList = words.map((entry) => entry.word).join(', ')
  const anchorHint = sceneAnchorHint(scene)
  const storyHint = sceneStoryHint(scene, words)
  const mappings = compactWordMappings(words, scene)

  const prompt = [
    'Educational flat cartoon, 16:9 banner, 2D flat style, gentle shading, bright warm natural light.',
    `Scene "${title}" (${theme}/${scene}). Palette: ${paletteForScene(scene)}.`,
    anchorHint,
    storyHint ? `Composition: ${storyHint}` : `Composition: one coherent ${scene} scene.`,
    'Visual rules by POS: n=noun→object; v=verb→character action; adj=adjective→quality badge/color cue; adv=adverb→motion/speed cue; o=other→sign/icon.',
    `Visuals: ${mappings}. Same room, one moment, one visual per word.`,
    'ONE continuous scene. NO grid, panels, collage, comic strip.',
    `Labels MOST prominent: LARGE white pill badge, bold navy sans-serif, leader line+dot. Label once: ${wordList}.`,
    'Teen-friendly cartoon. No Chinese, no extra words.',
  ]
    .filter(Boolean)
    .join(' ')

  return trimToMaxLength(prompt, MAX_GROUP_COVER_PROMPT_LENGTH)
}

export function groupCoverMetaFromGroup(
  tierId: string,
  groupIndex: number,
  title: string,
  rawWords: Array<{ word: string; pos?: string }>,
): GroupCoverMeta {
  const { theme, scene } = parseGroupTitle(title)
  const words = rawWords.map((item) => ({
    word: coverWordLabel(item.word),
    pos: normalizePos(item.pos),
  }))
  return { tierId, groupIndex, title, words, scene, theme }
}

/** 静态资源相对 public/ 的路径 */
export function groupCoverAssetRelativePath(tierId: string, groupIndex: number): string {
  return `images/vocab-groups/${tierId}/${groupIndex}.png`
}
