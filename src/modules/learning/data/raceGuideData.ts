import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'

export interface RaceGuideEntry {
  pos: Exclude<PartOfSpeech, 'other'>
  grammar: string
  power: string
  synergy: string
  relations: string
}

export const RACE_GUIDES: RaceGuideEntry[] = [
  {
    pos: 'verb',
    grammar: '表示动作与行为，军团里的主力输出。',
    power: '裸战力 = 音节 × 1.5（武士加成，同等级最高）。',
    synergy: '面对 魔法师 ADV 妖怪时相生 +20%，伤害更高。',
    relations: '与 魔法师 ADV 相伴：副词修饰动词（run → quickly）。魔法师出征时，武士是最佳反击人选。',
  },
  {
    pos: 'noun',
    grammar: '表示事物与实体，构成军团数量基石。',
    power: '裸战力 = 音节 × 1.0，人数通常最多，总战力贡献稳定。',
    synergy: '面对 医生 ADJ 妖怪时同词性 -20%；需 医生 ADJ 出手相生 +20%。',
    relations: '与 医生 ADJ 相伴：形容词修饰名词（happy day）。平民编队是占领王国的基本兵力。',
  },
  {
    pos: 'adjective',
    grammar: '修饰名词，描述性质与状态。',
    power: '裸战力 = 音节 × 1.0；专克名词类敌人。',
    synergy: '打 平民 NOUN 妖怪相生 +20%；打 医生 ADJ 妖怪时，魔法师 ADV 相生 +20%。',
    relations: '强化 平民 NOUN；也被 魔法师 ADV 进一步修饰（very happy）。',
  },
  {
    pos: 'adverb',
    grammar: '修饰动词或形容词，调节程度与方式。',
    power: '裸战力 = 音节 × 1.0；对动词系敌人有战术优势。',
    synergy: '打 武士 VERB 妖怪相生 +20%；打 医生 ADJ 妖怪同样相生 +20%。',
    relations: '与 武士 VERB、医生 ADJ 形成修饰链：副词→动词、副词→形容词，是语法搭配的核心纽带。',
  },
  {
    pos: 'prep',
    grammar: '介词，表时间、方位与逻辑关系（at / on / in）。',
    power: '裸战力 = 音节 × 1.0；功能型单位，提供场景与位移 buff。',
    synergy: '无专属相生位，实战伤害按正常倍率 ×1.0。',
    relations: '精灵族串联时间与空间，为武士与平民指明战场方位，是远征路线的向导。',
  },
  {
    pos: 'pronoun',
    grammar: '代词，指代与省略（I / you / they）。',
    power: '裸战力 = 音节 × 1.0；指挥官型单位，强化全军认知。',
    synergy: '无专属相生位，认词与指挥加成独立于倍率表。',
    relations: '贵族统领六族编队，减少重复点名，让军团指挥更高效（规划：答题时间 +2s / 一次复活）。',
  },
]

export const RACE_SYNERGY_CHAIN = 'ADJ → Noun · ADV → Verb · ADV → ADJ · Verb → ADV'
