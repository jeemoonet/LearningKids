import type { SentenceLevel } from './types'

export interface WarriorTenseProfile {
  word: string
  ability: string
  exampleEn: string
  exampleZh: string
}

export interface WarriorTenseComparisonRow {
  spirits: string[]
  focus: string
  example: string
}

export interface WarriorTenseComparison {
  title: string
  rows: WarriorTenseComparisonRow[]
  tip: string
}

export const WARRIOR_TENSE_FAMILY = {
  name: '时空转移',
  intro: '一般时、进行时、完成时，以及动词形式变化，练就语法直觉',
}

const LEVEL_PROFILES: Record<string, WarriorTenseProfile[]> = {
  'tense-1': [
    {
      word: '一般现在时',
      ability: '表示经常性、习惯性动作或客观事实',
      exampleEn: 'Tom plays football every day.',
      exampleZh: '汤姆每天踢足球。',
    },
    {
      word: '一般过去时',
      ability: '表示过去发生的动作或状态',
      exampleEn: 'She visited her grandma yesterday.',
      exampleZh: '她昨天去看望了奶奶。',
    },
    {
      word: '一般将来时',
      ability: '表示将来将要发生的动作',
      exampleEn: 'We will have a picnic next Sunday.',
      exampleZh: '我们下周日要去野餐。',
    },
  ],
  'tense-2': [
    {
      word: '现在完成时',
      ability: 'have/has + 过去分词，强调对现在的影响或持续',
      exampleEn: 'I have lived here for ten years.',
      exampleZh: '我在这里住了十年了。',
    },
    {
      word: '过去完成时',
      ability: 'had + 过去分词，表示过去的过去',
      exampleEn: 'When I arrived, the film had started.',
      exampleZh: '我到的时候，电影已经开始了。',
    },
  ],
  'tense-3': [
    {
      word: '第三人称单数',
      ability: '主语为 he/she/it 时，动词加 -s 或 -es',
      exampleEn: 'She watches TV after dinner.',
      exampleZh: '她晚饭后看电视。',
    },
    {
      word: '不规则动词',
      ability: '过去式与过去分词需单独记忆，不能按规则加 -ed',
      exampleEn: 'He went to school early this morning.',
      exampleZh: '他今天早上很早就去上学了。',
    },
    {
      word: '进行时',
      ability: 'be + doing，表示正在进行的动作',
      exampleEn: 'They are playing basketball now.',
      exampleZh: '他们现在正在打篮球。',
    },
  ],
  'tense-4': [
    {
      word: '一般时态',
      ability: '先看 every day / yesterday / will 等标志词',
      exampleEn: 'He usually reads books at night.',
      exampleZh: '他通常在晚上看书。',
    },
    {
      word: '完成时态',
      ability: 'since / for / already 等提示完成时',
      exampleEn: 'She has already finished her homework.',
      exampleZh: '她已经做完作业了。',
    },
    {
      word: '动词变化',
      ability: '三单、不规则与进行时可能混合出现',
      exampleEn: 'The children are singing happily.',
      exampleZh: '孩子们正在开心地唱歌。',
    },
  ],
}

const LEVEL_COMPARISONS: Record<string, WarriorTenseComparison> = {
  'tense-1': {
    title: '一般现在 / 过去 / 将来 怎么选？',
    rows: [
      {
        spirits: ['一般现在时'],
        focus: '经常性、习惯或客观事实',
        example: 'every day · always · usually',
      },
      {
        spirits: ['一般过去时'],
        focus: '过去某一时刻已发生的动作',
        example: 'yesterday · last week · ago',
      },
      {
        spirits: ['一般将来时'],
        focus: '将来将要发生的事',
        example: 'will · tomorrow · next week',
      },
    ],
    tip: '先找时间标志词，再判断谓语动词时态。',
  },
  'tense-2': {
    title: '现在完成 / 过去完成 怎么选？',
    rows: [
      {
        spirits: ['现在完成时'],
        focus: '过去动作对现在有影响，或持续到现在',
        example: 'have/has + done · since · for',
      },
      {
        spirits: ['过去完成时'],
        focus: '在过去某一时刻之前已经完成的动作',
        example: 'had + done · by the time',
      },
    ],
    tip: '看到 since/for 优先想现在完成时；过去的过去用 had + 过去分词。',
  },
  'tense-3': {
    title: '三单 / 不规则 / 进行时 怎么选？',
    rows: [
      {
        spirits: ['第三人称单数'],
        focus: 'he/she/it 作主语，动词变形',
        example: 'plays · watches · goes',
      },
      {
        spirits: ['不规则动词'],
        focus: '过去式、过去分词不规则变化',
        example: 'go→went · see→saw · eat→ate',
      },
      {
        spirits: ['进行时'],
        focus: '此刻正在进行的动作',
        example: 'am/is/are + doing · now · at the moment',
      },
    ],
    tip: '看主语人称、时间标志与动词形式，不要只凭感觉选词。',
  },
  'tense-4': {
    title: '时态综合：先读标志再选谓语',
    rows: [
      {
        spirits: ['一般时态'],
        focus: 'every day / yesterday / will 等',
        example: 'plays · played · will play',
      },
      {
        spirits: ['完成时态'],
        focus: 'since / for / already 等',
        example: 'have done · had done',
      },
      {
        spirits: ['动词变化'],
        focus: '三单、不规则与进行时混合',
        example: 'is doing · went · watches',
      },
    ],
    tip: '高级关混合全部考点，先判断空格成分再选时态正确的动词形式。',
  },
}

const LEVEL_INTROS: Record<string, string> = {
  'tense-1': '掌握现在、过去、将来三种一般时态，是武士力量的基础训练。',
  'tense-2': '完成时强调动作与时间的关联，是击败 BOSS 的关键能力。',
  'tense-3': '动词形式变化决定谓语是否正确，需结合主语与时间标志判断。',
  'tense-4': '混合一般时、完成时与动词变化，检验综合语法直觉。',
}

export function formatWarriorLevelHeading(level: SentenceLevel): {
  title: string
  summary: string
  ruleSummary: string
} {
  const sceneLabel = level.scene.replace(/\s*·\s*/g, '/')
  return {
    title: `${WARRIOR_TENSE_FAMILY.name}>${level.title}（${sceneLabel}）`,
    summary: LEVEL_INTROS[level.id] ?? WARRIOR_TENSE_FAMILY.intro,
    ruleSummary: level.ruleSummary,
  }
}

export function getWarriorTenseProfiles(levelId: string): WarriorTenseProfile[] {
  return LEVEL_PROFILES[levelId] ?? []
}

export function getWarriorTenseComparison(levelId: string): WarriorTenseComparison {
  const preset = LEVEL_COMPARISONS[levelId]
  if (preset) return preset
  return {
    title: '本关考点对比',
    rows: [],
    tip: '先读时间标志词，再选择正确的动词时态。',
  }
}
