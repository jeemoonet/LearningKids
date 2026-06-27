import type { PrepLevel, PrepTrack } from './types'

export interface SpiritProfile {
  word: string
  ability: string
  exampleEn: string
  exampleZh: string
  /** 词性星球搭档：平民接名词，武士接动词 */
  ally?: 'commoner' | 'warrior'
}

export interface SpiritFamilyInfo {
  track: PrepTrack
  name: string
  icon: string
  intro: string
  coreAbility: string
}

export interface SpiritComparisonRow {
  spirits: string[]
  focus: string
  example: string
}

export interface LevelComparison {
  title: string
  rows: SpiritComparisonRow[]
  tip: string
}

export const PREP_FAMILIES: Record<PrepTrack, SpiritFamilyInfo> = {
  time: {
    track: 'time',
    name: '时间精灵',
    icon: '⏳',
    intro: '时间精灵掌管时刻、日期与时段，是击溃 BOSS通关的核心家族。',
    coreAbility: '标记事件何时发生：具体钟点、某一天，或月份/季节/较长时段',
  },
  position: {
    track: 'position',
    name: '位置精灵',
    icon: '🧭',
    intro: '位置精灵掌管空间方位与移动方向，常见于完形填空与阅读理解。',
    coreAbility: '描述物体在哪、往哪去、沿什么路径移动',
  },
  more: {
    track: 'more',
    name: '更多精灵',
    icon: '✨',
    intro: '更多精灵覆盖伴随、配对、扩展用法等，帮助完善介词体系。',
    coreAbility: '表达工具伴随、固定搭配及抽象方位',
  },
}

const LEVEL_SPIRIT_PROFILES: Record<string, Record<string, SpiritProfile>> = {
  'pos-1': {
    at: {
      word: 'at',
      ability: '具体地点或小位置',
      exampleEn: 'We waited at the bus stop.',
      exampleZh: '我们在公交车站等候。',
    },
    on: {
      word: 'on',
      ability: '在表面之上',
      exampleEn: 'The book is on the desk.',
      exampleZh: '书在课桌上。',
    },
    in: {
      word: 'in',
      ability: '在空间内部或较大区域里',
      exampleEn: 'Tom lives in Beijing.',
      exampleZh: '汤姆住在北京。',
    },
  },
  'hf-5': {
    on: {
      word: 'on',
      ability: '与表面接触、贴在……上',
      exampleEn: 'The cup is on the table.',
      exampleZh: '杯子在桌子上。',
    },
    above: {
      word: 'above',
      ability: '在……上方（不一定接触）',
      exampleEn: 'The plane flew above the clouds.',
      exampleZh: '飞机飞在云层上方。',
    },
    under: {
      word: 'under',
      ability: '在……正下方',
      exampleEn: 'The cat hid under the bed.',
      exampleZh: '猫躲到了床底下。',
    },
    below: {
      word: 'below',
      ability: '在……下方或低于……',
      exampleEn: 'The temperature fell below freezing.',
      exampleZh: '气温降到了冰点以下。',
    },
  },
  'more-2': {
    across: {
      word: 'across',
      ability: '横穿、从一侧到另一侧',
      exampleEn: 'She walked across the street carefully.',
      exampleZh: '她小心地穿过了马路。',
    },
    over: {
      word: 'over',
      ability: '越过或从上方跨越',
      exampleEn: 'There is a bridge over the river.',
      exampleZh: '河上有一座桥。',
    },
    through: {
      word: 'through',
      ability: '从内部穿过',
      exampleEn: 'We walked through the tunnel.',
      exampleZh: '我们穿过了隧道。',
    },
  },
  'pos-2': {
    out: {
      word: 'out',
      ability: '与动词连用，出去/向外/熄灭',
      ally: 'warrior',
      exampleEn: "Let's go out after dinner.",
      exampleZh: '晚饭后我们出去吧。',
    },
    off: {
      word: 'off',
      ability: '与动词连用，脱离/下车/关闭/出发',
      ally: 'warrior',
      exampleEn: 'Please take off your coat.',
      exampleZh: '请脱掉外套。',
    },
  },
  'pos-3': {
    in: {
      word: 'in',
      ability: '在区域/容器内，后接平民（名词）',
      ally: 'commoner',
      exampleEn: 'The keys are in my pocket.',
      exampleZh: '钥匙在我口袋里。',
    },
    inside: {
      word: 'inside',
      ability: '强调在内部，后接平民（名词）',
      ally: 'commoner',
      exampleEn: 'Wait inside the classroom.',
      exampleZh: '在教室里等。',
    },
    out: {
      word: 'out',
      ability: '与武士动词连用，表示向外/出去',
      ally: 'warrior',
      exampleEn: "Let's go out and play.",
      exampleZh: '我们出去玩吧。',
    },
    outside: {
      word: 'outside',
      ability: '在外面，常接动词或平民（名词）',
      ally: 'warrior',
      exampleEn: 'Go outside and wait for me.',
      exampleZh: '到外面等我。',
    },
    'out of': {
      word: 'out of',
      ability: '后接平民（名词），表从容器/区域里出来',
      ally: 'commoner',
      exampleEn: 'She ran out of the classroom.',
      exampleZh: '她跑出了教室。',
    },
  },
  'more-5': {
    'between...and': {
      word: 'between...and',
      ability: 'between 与 and 成对，表示在 A 与 B 之间',
      exampleEn: 'We nap between one and two.',
      exampleZh: '我们在一点到两点之间小睡。',
    },
    'from...to': {
      word: 'from...to',
      ability: 'from 与 to 成对，表示从 A 到 B',
      exampleEn: 'The bus runs from seven to ten.',
      exampleZh: '公交车从七点到十点运行。',
    },
  },
  'more-1': {
    with: {
      word: 'with',
      ability: '和……一起，或用……工具/方式',
      exampleEn: 'I went to the park with my friends.',
      exampleZh: '我和朋友们去了公园。',
    },
    without: {
      word: 'without',
      ability: '没有/不带……',
      exampleEn: 'He left without saying goodbye.',
      exampleZh: '他没说再见就走了。',
    },
    by: {
      word: 'by',
      ability: '方式/手段，或被动句中的行为者',
      exampleEn: 'We travel by bus every day.',
      exampleZh: '我们每天乘公交出行。',
    },
  },
  'more-4': {
    for: {
      word: 'for',
      ability: '目的/对象/给某人',
      exampleEn: 'Here is a gift for you.',
      exampleZh: '这是送给你的礼物。',
    },
    against: {
      word: 'against',
      ability: '倚靠/对抗',
      exampleEn: 'Do not lean against the wall.',
      exampleZh: '不要靠在墙上。',
    },
  },
}

const SPIRIT_PROFILES: Record<string, SpiritProfile> = {
  at: {
    word: 'at',
    ability: '接具体时刻或较小时间点',
    exampleEn: 'The bus leaves at half past seven.',
    exampleZh: '公交车七点半发车。',
  },
  on: {
    word: 'on',
    ability: '接具体某一天或日期',
    exampleEn: 'My birthday is on May 8th.',
    exampleZh: '我的生日是五月八日。',
  },
  in: {
    word: 'in',
    ability: '接月份、季节、年份或较长时段',
    exampleEn: 'Many flowers bloom in spring.',
    exampleZh: '许多花在春天开放。',
  },
  for: {
    word: 'for',
    ability: '接时间段，表示持续多久',
    exampleEn: 'She slept for eight hours last night.',
    exampleZh: '她昨晚睡了八个小时。',
  },
  since: {
    word: 'since',
    ability: '接时间点，表示从某时至今',
    exampleEn: 'Dad has worked here since last year.',
    exampleZh: '爸爸从去年起在这里工作。',
  },
  during: {
    word: 'during',
    ability: '接名词，表示在……期间',
    exampleEn: 'Please keep quiet during the exam.',
    exampleZh: '考试期间请保持安静。',
  },
  through: {
    word: 'through',
    ability: '表示贯穿整个过程',
    exampleEn: 'We worked through the night.',
    exampleZh: '我们通宵工作。',
  },
  before: {
    word: 'before',
    ability: '表示在……之前',
    exampleEn: 'Wash your hands before lunch.',
    exampleZh: '午饭前洗手。',
  },
  after: {
    word: 'after',
    ability: '表示在……之后',
    exampleEn: 'We went home after class.',
    exampleZh: '下课后我们回了家。',
  },
  by: {
    word: 'by',
    ability: '表示不晚于某个时间',
    exampleEn: 'Please finish the report by Friday.',
    exampleZh: '请在周五前完成报告。',
  },
  from: {
    word: 'from',
    ability: '表示从……开始，常与 to 连用',
    exampleEn: 'The bus runs from seven to ten.',
    exampleZh: '公交车从七点到十点运行。',
  },
  past: {
    word: 'past',
    ability: '表示过几分（钟点）',
    exampleEn: 'The bell rings at ten past nine.',
    exampleZh: '铃声响，现在九点十分。',
  },
  to: {
    word: 'to',
    ability: '表示差几分（钟点）',
    exampleEn: 'It is a quarter to ten now.',
    exampleZh: '现在差一刻十点。',
  },
  around: {
    word: 'around',
    ability: '表示大约某个时间',
    exampleEn: 'Lunch starts around twelve.',
    exampleZh: '午饭大约十二点开始。',
  },
  over: {
    word: 'over',
    ability: '表示跨越一段时间',
    exampleEn: 'We visit grandma over the weekend.',
    exampleZh: '我们整个周末去看奶奶。',
  },
  between: {
    word: 'between',
    ability: '表示在两者之间',
    exampleEn: 'We nap between one and two.',
    exampleZh: '我们在一点到两点之间小睡。',
  },
  behind: {
    word: 'behind',
    ability: '表示在……后面',
    exampleEn: 'The cat is behind the door.',
    exampleZh: '猫在门后面。',
  },
  into: {
    word: 'into',
    ability: '表示进入到……里面',
    exampleEn: 'She walked into the classroom quietly.',
    exampleZh: '她安静地走进了教室。',
  },
  off: {
    word: 'off',
    ability: '与动词连用，表从……脱离/掉落',
    exampleEn: 'He fell off his bike.',
    exampleZh: '他从自行车上摔了下来。',
  },
  out: {
    word: 'out',
    ability: '与动词连用，表向外/出去',
    exampleEn: "Let's go out after dinner.",
    exampleZh: '晚饭后我们出去吧。',
  },
  along: {
    word: 'along',
    ability: '表示沿着……',
    exampleEn: 'I walk along the river every morning.',
    exampleZh: '我每天早上沿着河散步。',
  },
  among: {
    word: 'among',
    ability: '表示在……之中（三者及以上）',
    exampleEn: 'She sat among the students.',
    exampleZh: '她坐在学生中间。',
  },
  of: {
    word: 'of',
    ability: '表示……的/所属关系',
    exampleEn: 'The capital of China is Beijing.',
    exampleZh: '中国的首都是北京。',
  },
  with: {
    word: 'with',
    ability: '表示和……一起，或用……工具',
    exampleEn: 'I went to the park with my friends.',
    exampleZh: '我和朋友们去了公园。',
  },
  about: {
    word: 'about',
    ability: '接时间点，表示大约',
    exampleEn: 'Dinner is about seven.',
    exampleZh: '晚饭大约七点。',
  },
  under: {
    word: 'under',
    ability: '表示在……正下方',
    exampleEn: 'The cat hid under the bed.',
    exampleZh: '猫躲到了床底下。',
  },
  above: {
    word: 'above',
    ability: '表示在……上方（不一定正上方）',
    exampleEn: 'The plane flew above the clouds.',
    exampleZh: '飞机飞在云层上方。',
  },
  below: {
    word: 'below',
    ability: '表示在……下方/低于……',
    exampleEn: 'The village lies below the hill.',
    exampleZh: '村庄在山丘下方。',
  },
  across: {
    word: 'across',
    ability: '表示横穿/在……对面',
    exampleEn: 'She walked across the street carefully.',
    exampleZh: '她小心地穿过了马路。',
  },
  inside: {
    word: 'inside',
    ability: '表示在……内部',
    exampleEn: 'Wait inside the classroom.',
    exampleZh: '在教室里等。',
  },
  outside: {
    word: 'outside',
    ability: '表示在……外部',
    exampleEn: 'Wait for me outside the gate.',
    exampleZh: '在大门外等我。',
  },
  toward: {
    word: 'toward',
    ability: '表示朝……方向',
    exampleEn: 'She walked toward the school gate.',
    exampleZh: '她朝校门走去。',
  },
  towards: {
    word: 'towards',
    ability: '与 toward 同义，表示朝……方向',
    exampleEn: 'They ran towards the finish line.',
    exampleZh: '他们朝终点线跑去。',
  },
  until: {
    word: 'until',
    ability: '表示直到……为止',
    exampleEn: 'Wait here until I come back.',
    exampleZh: '在这里等到我回来。',
  },
  against: {
    word: 'against',
    ability: '表示倚靠/对抗',
    exampleEn: 'Do not lean against the wall.',
    exampleZh: '不要靠在墙上。',
  },
  without: {
    word: 'without',
    ability: '表示没有/不带……',
    exampleEn: 'He left without saying goodbye.',
    exampleZh: '他没说再见就走了。',
  },
  within: {
    word: 'within',
    ability: '表示在……之内/不超过……',
    exampleEn: 'Reply within three days, please.',
    exampleZh: '请在三天内回复。',
  },
  beyond: {
    word: 'beyond',
    ability: '表示在……那边/超出……',
    exampleEn: 'The hills lie beyond the river.',
    exampleZh: '山丘在河的那一边。',
  },
  ago: {
    word: 'ago',
    ability: '表示……之前（用于过去时间）',
    exampleEn: 'I met her two days ago.',
    exampleZh: '我两天前遇见了她。',
  },
}

const LEVEL_COMPARISONS: Record<string, LevelComparison> = {
  'hf-1': {
    title: 'at / on / in 怎么选？',
    rows: [
      { spirits: ['at'], focus: '具体钟点', example: 'at 7:30 · at noon' },
      { spirits: ['on'], focus: '某天/日期', example: 'on Monday · on May 8th' },
      { spirits: ['in'], focus: '月/季/年/较长时段', example: 'in June · in the evening' },
    ],
    tip: '先判断时间是「几点」还是「哪天」还是「哪段时期」，再选对应精灵。',
  },
  'pos-1': {
    title: 'at / on / in 位置怎么选？',
    rows: [
      { spirits: ['at'], focus: '具体地点/点', example: 'at home · at the gate' },
      { spirits: ['on'], focus: '表面之上', example: 'on the desk · on the wall' },
      { spirits: ['in'], focus: '内部/区域里', example: 'in the room · in Beijing' },
    ],
    tip: '先想是「某个点」「某个面」还是「在里面/大区域里」，再选对应精灵。',
  },
  'hf-2': {
    title: '连续精灵怎么选？',
    rows: [
      { spirits: ['for'], focus: '持续多久', example: 'for two hours' },
      { spirits: ['since'], focus: '从某时至今', example: 'since 2020' },
      { spirits: ['during'], focus: '在……期间', example: 'during the exam' },
      { spirits: ['until'], focus: '直到', example: 'until midnight' },
    ],
    tip: 'for + 时间段；since + 时间点；during 后接名词；until 表持续到某时为止。',
  },
  'hf-3': {
    title: '顺序精灵怎么选？',
    rows: [
      { spirits: ['before'], focus: '在……之前', example: 'before lunch' },
      { spirits: ['after'], focus: '在……之后', example: 'after class' },
      { spirits: ['from'], focus: '从……起', example: 'from 9 to 3' },
      { spirits: ['ago'], focus: '……前（过去）', example: 'two days ago' },
    ],
    tip: 'from…to… 表示起止范围；ago 只能用于过去时间且放句末。',
  },
  'hf-4': {
    title: '钟表精灵怎么选？',
    rows: [
      { spirits: ['past'], focus: '过几分', example: 'ten past nine' },
      { spirits: ['to'], focus: '差几分', example: 'a quarter to ten' },
      { spirits: ['about'], focus: '大约', example: 'about seven' },
    ],
    tip: 'past 与 to 专门用于钟点；about 表示大约某个时间。',
  },
  'hf-5': {
    title: '上下精灵怎么选？',
    rows: [
      { spirits: ['on'], focus: '表面接触', example: 'on the desk · on the wall' },
      { spirits: ['above'], focus: '上方（可不接触）', example: 'above the clouds' },
      { spirits: ['under'], focus: '正下方', example: 'under the bed' },
      { spirits: ['below'], focus: '下方/低于', example: 'below zero' },
    ],
    tip: 'on 强调贴着表面；above 在上方但不强调接触；under/below 都在下方，below 可表「低于」。',
  },
  'more-1': {
    title: '伴随精灵怎么选？',
    rows: [
      { spirits: ['with'], focus: '和/用', example: 'with friends · with a pen' },
      { spirits: ['without'], focus: '没有/不带', example: 'without a coat' },
      { spirits: ['by'], focus: '方式/手段', example: 'by bus · by hand' },
    ],
    tip: 'with 表伴随或工具；without 表缺少某物；by 表方式/手段或被动行为者。',
  },
  'more-2': {
    title: '穿越精灵怎么选？',
    rows: [
      { spirits: ['across'], focus: '横穿平面', example: 'across the street' },
      { spirits: ['over'], focus: '越过/上方跨越', example: 'over the fence · over the river' },
      { spirits: ['through'], focus: '穿过内部', example: 'through the tunnel' },
    ],
    tip: 'across 强调平面横穿；over 强调越过或从上方跨过；through 强调从里面穿过去。',
  },
  'pos-2': {
    title: '消失精灵 · 动词搭配',
    rows: [
      { spirits: ['out'], focus: '出去/向外/熄灭', example: 'go out · walk out · lights go out' },
      { spirits: ['off'], focus: '脱离/下车/关/出发', example: 'take off · get off · turn off' },
    ],
    tip: '消失精灵必须和动词手拉手：out 偏「向外、离开」；off 偏「脱离、关闭、出发」。答题时先找句中动词，再选 out 还是 off。',
  },
  'pos-3': {
    title: '内外精灵 · 平民与武士',
    rows: [
      { spirits: ['in', 'inside', 'out of'], focus: '接平民名词', example: 'in the box · inside the room · out of the bag' },
      { spirits: ['out', 'outside'], focus: '与武士动词连用', example: 'go out · wait outside' },
    ],
    tip: 'in/inside/out of 后接名词（平民）：in the box、inside the room、out of the classroom；out/outside 找句中动词（武士）：go out、play outside。',
  },
  'more-5': {
    title: '配对精灵 · 固定搭档',
    rows: [
      { spirits: ['between...and'], focus: '两者之间', example: 'between 9 and 3 · between A and B' },
      { spirits: ['from...to'], focus: '起止范围', example: 'from Monday to Friday · from 7 to 10' },
    ],
    tip: 'between 后面要有 and；from 后面要有 to。闯关时空缺处填 and 或 to，先判断是「之间」还是「从…到…」。',
  },
  'more-4': {
    title: '支持精灵怎么选？',
    rows: [
      { spirits: ['for'], focus: '目的/对象/给某人', example: 'a gift for you · study for the exam' },
      { spirits: ['against'], focus: '倚靠/对抗', example: 'against the wall · play against a team' },
    ],
    tip: 'for 表目的、对象或「给某人」；against 表倚靠某物或对抗对手。',
  },
}

export function formatPrepLevelHeading(level: PrepLevel): { title: string; intro: string } {
  const family = PREP_FAMILIES[level.track]
  const wordsLabel =
    level.prepWords.length > 0 ? level.prepWords.join('/') : level.scene.replace(/\s*·\s*/g, '/')
  return {
    title: `${family.name}>${level.title}（${wordsLabel}）`,
    intro: family.intro,
  }
}

export function getSpiritProfile(word: string, levelId?: string): SpiritProfile {
  const key = word.toLowerCase()
  const levelProfile = levelId ? LEVEL_SPIRIT_PROFILES[levelId]?.[key] : undefined
  if (levelProfile) return levelProfile
  return (
    SPIRIT_PROFILES[key] ?? {
      word,
      ability: `此处应使用 ${word}。`,
      exampleEn: `Use "${word}" in the blank.`,
      exampleZh: `空白处应填 ${word}。`,
    }
  )
}

export function getLevelComparison(levelId: string, prepWords: string[]): LevelComparison {
  const preset = LEVEL_COMPARISONS[levelId]
  if (preset) return preset

  return {
    title: '本关精灵差异',
    rows: prepWords.map((word) => {
      const profile = getSpiritProfile(word, levelId)
      return {
        spirits: [word],
        focus: profile.ability,
        example: profile.exampleEn.replace(/\{prep\}/g, word).slice(0, 48),
      }
    }),
    tip: '对比各精灵的核心能力与例句，再进入闯关练习。',
  }
}
