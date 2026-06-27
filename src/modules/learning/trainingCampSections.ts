import type { SentenceTrack } from '../sentence-game/types'

export type TrainingSectionId = 'spirit' | 'warrior' | 'magic' | 'formation'

export interface TrainingCampSection {
  id: TrainingSectionId
  label: string
  icon: string
  summary: string
  module: 'prep' | 'sentence'
  tracks?: SentenceTrack[]
  showBoss?: boolean
  title: string
  description: string
}

export const TRAINING_CAMP_SECTIONS: TrainingCampSection[] = [
  {
    id: 'spirit',
    label: '精灵起源',
    icon: '✨',
    summary: '介绍介词的使用，按时间、位置、扩展等不同精灵家族分别学习',
    module: 'prep',
    title: '精灵起源',
    description: '召唤时间/位置/更多精灵，掌握 at · on · in 及 of · with · about 等考点',
  },
  {
    id: 'warrior',
    label: '武士的力量',
    icon: '⚔️',
    summary: '介绍动词的使用、动词组合与时态变化',
    module: 'sentence',
    tracks: ['tense'],
    title: '武士的力量',
    description: '一般时、完成时与动词形式变化，练就语法直觉',
  },
  {
    id: 'magic',
    label: '魔法世界',
    icon: '🪄',
    summary: '魔法师与动词的组合，学者魔法师辨析与高级用法',
    module: 'sentence',
    tracks: ['adj-adv'],
    title: '魔法世界',
    description: '学者与魔法师搭配动词，掌握比较级与最高级',
  },
  {
    id: 'formation',
    label: '排兵布阵',
    icon: '🚩',
    summary: '句型侦探：主谓宾定状补拼句，含时间/地点状语与综合闯关',
    module: 'sentence',
    tracks: ['structure'],
    showBoss: true,
    title: '排兵布阵',
    description: '按句子成分还原英文句子，掌握时间/地点状语，检验句型综合能力',
  },
]

export function getTrainingSection(id: TrainingSectionId): TrainingCampSection {
  return TRAINING_CAMP_SECTIONS.find((s) => s.id === id) ?? TRAINING_CAMP_SECTIONS[0]
}
