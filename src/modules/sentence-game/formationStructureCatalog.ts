import type { SentenceLevel } from './types'
import type { WarriorTenseComparison, WarriorTenseProfile } from './warriorTenseCatalog'

export const FORMATION_FAMILY = {
  name: '句子成分',
  intro: '按主谓宾定状补还原英文句子，掌握时间与地点状语',
}

const LEVEL_PROFILES: Record<string, WarriorTenseProfile[]> = {
  'struct-1': [
    { word: '主语', ability: '句子的主体，说明「谁/什么」', exampleEn: 'Tom reads books.', exampleZh: '汤姆读书。' },
    { word: '谓语', ability: '说明主语「做什么」', exampleEn: 'Tom reads books.', exampleZh: '汤姆读书。' },
    { word: '宾语', ability: '动作的承受者', exampleEn: 'Tom reads books.', exampleZh: '汤姆读书。' },
  ],
  'struct-2': [
    { word: '定语', ability: '修饰名词，说明「什么样的」', exampleEn: 'a red apple', exampleZh: '一个红苹果' },
  ],
  'struct-3': [
    { word: '状语', ability: '修饰动词，说明「怎么样/何时/何地」', exampleEn: 'She sings beautifully.', exampleZh: '她唱得很动听。' },
  ],
  'adv-time': [
    { word: '时间状语', ability: '回答 When？', exampleEn: 'I get up at 7 every day.', exampleZh: '我每天七点起床。' },
  ],
  'adv-place': [
    { word: '地点状语', ability: '回答 Where？', exampleEn: 'They live in Beijing.', exampleZh: '他们住在北京。' },
  ],
  'adv-3': [
    { word: '时间 + 地点', ability: '混合判断 When / Where', exampleEn: 'We met at the park yesterday.', exampleZh: '我们昨天在公园见面。' },
  ],
  'struct-4': [
    { word: '主谓宾定状补', ability: '综合运用五种以上成分', exampleEn: 'The little boy runs very fast.', exampleZh: '那个小男孩跑得很快。' },
  ],
  boss: [
    { word: '综合闯关', ability: '混合句子成分、时态与形副', exampleEn: 'All skills combined.', exampleZh: '全部句型考点综合检验。' },
  ],
}

const LEVEL_COMPARISONS: Record<string, WarriorTenseComparison> = {
  'struct-1': {
    title: '主谓宾 怎么拼？',
    rows: [
      { spirits: ['主语'], focus: '谁/什么', example: 'Tom / The cat' },
      { spirits: ['谓语'], focus: '做什么', example: 'reads / runs' },
      { spirits: ['宾语'], focus: '动作对象', example: 'books / the ball' },
    ],
    tip: '英文基本语序：主语 + 谓语 + 宾语。',
  },
  'struct-2': {
    title: '定语 怎么用？',
    rows: [{ spirits: ['定语'], focus: '放在名词前', example: 'a beautiful day · red car' }],
    tip: '定语通常是形容词，修饰后面的名词。',
  },
  'struct-3': {
    title: '状语 怎么用？',
    rows: [{ spirits: ['状语'], focus: '修饰动词', example: 'run quickly · sing well' }],
    tip: '状语说明动作的方式、时间或地点。',
  },
  'adv-time': {
    title: '时间状语 标志词',
    rows: [{ spirits: ['时间'], focus: 'When？', example: 'at 7 · every day · yesterday' }],
    tip: '注意 at/on/in、for/since 等时间搭配。',
  },
  'adv-place': {
    title: '地点状语 标志词',
    rows: [{ spirits: ['地点'], focus: 'Where？', example: 'in the room · at school' }],
    tip: '注意 in/on/at、behind/along 等方位词。',
  },
  'adv-3': {
    title: '时间 vs 地点',
    rows: [
      { spirits: ['时间'], focus: 'When？', example: 'yesterday · at noon' },
      { spirits: ['地点'], focus: 'Where？', example: 'in the park · at home' },
    ],
    tip: '先判断空格回答的是时间还是地点。',
  },
  'struct-4': {
    title: '五种成分综合',
    rows: [
      { spirits: ['主干'], focus: '主 + 谓 + 宾', example: 'Tom reads books' },
      { spirits: ['修饰'], focus: '定 + 状 + 补', example: 'the little boy · very fast' },
    ],
    tip: '先找主谓宾骨架，再补定状补。',
  },
  boss: {
    title: '综合闯关要点',
    rows: [
      { spirits: ['成分'], focus: '主谓宾定状补', example: '先判断空格成分' },
      { spirits: ['时态/形副'], focus: '混合考点', example: '再选正确词形' },
    ],
    tip: '随机混合全部句型考点，先判断成分再选词。',
  },
}

const LEVEL_SUMMARIES: Record<string, string> = {
  'struct-1': '掌握主谓宾，是拼句还原的基础。',
  'struct-2': '定语修饰名词，说明「什么样的」。',
  'struct-3': '状语修饰动词，说明「怎么样做」。',
  'adv-time': '时间状语回答 When？',
  'adv-place': '地点状语回答 Where？',
  'adv-3': '混合时间与地点状语，先判断问的是何时还是何地。',
  'struct-4': '综合运用主谓宾定状补，每句至少五种成分。',
  boss: '混合考查句子成分、时态与形副用法。',
}

export function formatFormationLevelHeading(level: SentenceLevel): {
  title: string
  summary: string
  ruleSummary: string
} {
  const sceneLabel = level.scene.replace(/\s*·\s*/g, '/')
  return {
    title: `${FORMATION_FAMILY.name}>${level.title}（${sceneLabel}）`,
    summary: LEVEL_SUMMARIES[level.id] ?? FORMATION_FAMILY.intro,
    ruleSummary: level.ruleSummary,
  }
}

export function getFormationStructureProfiles(levelId: string): WarriorTenseProfile[] {
  return LEVEL_PROFILES[levelId] ?? []
}

export function getFormationStructureComparison(levelId: string): WarriorTenseComparison {
  return (
    LEVEL_COMPARISONS[levelId] ?? {
      title: '本关考点对比',
      rows: [],
      tip: '先判断句子成分，再拖入正确词块。',
    }
  )
}
