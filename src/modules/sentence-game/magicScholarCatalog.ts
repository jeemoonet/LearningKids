import type { SentenceLevel } from './types'
import type { WarriorTenseComparison, WarriorTenseProfile } from './warriorTenseCatalog'

export const MAGIC_SCHOLAR_FAMILY = {
  name: '学者 & 魔法师',
  intro: '学者修饰名词，魔法师修饰动词；系动词后接学者',
}

const LEVEL_PROFILES: Record<string, WarriorTenseProfile[]> = {
  'adj-adv-1': [
    {
      word: '学者',
      ability: '修饰名词，说明「什么样的」',
      exampleEn: 'It is a beautiful day.',
      exampleZh: '这是美好的一天。',
    },
    {
      word: '魔法师',
      ability: '修饰动词、学者或其他魔法师',
      exampleEn: 'She runs quickly.',
      exampleZh: '她跑得很快。',
    },
    {
      word: '系动词 + 学者',
      ability: 'look / feel / taste 等后接学者',
      exampleEn: 'The soup smells delicious.',
      exampleZh: '这汤闻起来很香。',
    },
  ],
  'adj-adv-2': [
    {
      word: '比较级',
      ability: '两者比较，常与 than 连用',
      exampleEn: 'Tom is taller than Jim.',
      exampleZh: '汤姆比吉姆高。',
    },
    {
      word: '最高级',
      ability: '三者及以上比较，常与 the / of all 连用',
      exampleEn: 'She is the best student in our class.',
      exampleZh: '她是我们班最优秀的学生。',
    },
  ],
  'adj-adv-3': [
    {
      word: '学者辨析',
      ability: '判断修饰对象是否为名词',
      exampleEn: 'We had an interesting talk.',
      exampleZh: '我们进行了一场有趣的谈话。',
    },
    {
      word: '魔法师辨析',
      ability: '判断修饰对象是否为动词',
      exampleEn: 'He speaks English fluently.',
      exampleZh: '他英语说得很流利。',
    },
    {
      word: '比较结构',
      ability: '混合比较级、最高级与修饰对象',
      exampleEn: 'This book is more useful than that one.',
      exampleZh: '这本书比那本更有用。',
    },
  ],
}

const LEVEL_COMPARISONS: Record<string, WarriorTenseComparison> = {
  'adj-adv-1': {
    title: '学者 / 魔法师 怎么选？',
    rows: [
      { spirits: ['学者'], focus: '修饰名词', example: 'a happy child · red apple' },
      { spirits: ['魔法师'], focus: '修饰动词/学者/魔法师', example: 'run fast · very good' },
      { spirits: ['系动词后'], focus: '接学者作表语', example: 'look happy · taste good' },
    ],
    tip: '先看被修饰的词是名词还是动词，再选学者或魔法师。',
  },
  'adj-adv-2': {
    title: '比较级 / 最高级 怎么选？',
    rows: [
      { spirits: ['比较级'], focus: '两者比较', example: 'taller than · more careful than' },
      { spirits: ['最高级'], focus: '范围中最…', example: 'the tallest · the most interesting' },
    ],
    tip: 'than 指向比较级；the … of all / in the class 指向最高级。',
  },
  'adj-adv-3': {
    title: '综合辨析要点',
    rows: [
      { spirits: ['学者'], focus: '名词前或系动词后', example: 'quiet room · feel tired' },
      { spirits: ['魔法师'], focus: '动词前后', example: 'speak loudly · very well' },
      { spirits: ['比较级/最高级'], focus: 'than / the … of', example: 'better than · the best' },
    ],
    tip: '高级关混合身份辨析与比较结构，先找修饰对象再选形副。',
  },
}

const LEVEL_SUMMARIES: Record<string, string> = {
  'adj-adv-1': '掌握学者与魔法师的分工，是魔法世界的基础训练。',
  'adj-adv-2': '比较级与最高级决定「更…」还是「最…」。',
  'adj-adv-3': '混合学者魔法师辨析与比较等级，检验综合掌握。',
}

export function formatMagicLevelHeading(level: SentenceLevel): {
  title: string
  summary: string
  ruleSummary: string
} {
  const sceneLabel = level.scene.replace(/\s*·\s*/g, '/')
  return {
    title: `${MAGIC_SCHOLAR_FAMILY.name}>${level.title}（${sceneLabel}）`,
    summary: LEVEL_SUMMARIES[level.id] ?? MAGIC_SCHOLAR_FAMILY.intro,
    ruleSummary: level.ruleSummary,
  }
}

export function getMagicScholarProfiles(levelId: string): WarriorTenseProfile[] {
  return LEVEL_PROFILES[levelId] ?? []
}

export function getMagicScholarComparison(levelId: string): WarriorTenseComparison {
  return (
    LEVEL_COMPARISONS[levelId] ?? {
      title: '本关考点对比',
      rows: [],
      tip: '先判断修饰对象，再选择学者或魔法师。',
    }
  )
}
