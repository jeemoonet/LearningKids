import type { MapTerrain } from './kingdomBattleMapLayout'
import type { PlanetLevelKind } from '../types'

/** 单一学习交互形态（可复用于多种关卡类型） */
export type LearningMethodId =
  | 'meaning-choice'
  | 'sentence-cloze'
  | 'spelling-fire'
  | 'pos-match-battle'
  | 'meaning-dodge'
  | 'adv-verb-pair'
  | 'pos-squad-link'

export interface LearningMethodDef {
  id: LearningMethodId
  label: string
  shortLabel: string
  description: string
}

export const LEARNING_METHODS: Record<LearningMethodId, LearningMethodDef> = {
  'meaning-choice': {
    id: 'meaning-choice',
    label: '四选一认词',
    shortLabel: '认词',
    description: '看英文选中文释义，叫对名字才算认识',
  },
  'sentence-cloze': {
    id: 'sentence-cloze',
    label: '选词填空造句',
    shortLabel: '造句',
    description: '从候选词中选出正确单词，完成例句填空',
  },
  'spelling-fire': {
    id: 'spelling-fire',
    label: '拼写发射',
    shortLabel: '拼写',
    description: '关键字母挖空，拼对才能发射子弹击破封印',
  },
  'pos-match-battle': {
    id: 'pos-match-battle',
    label: '词性克制出战',
    shortLabel: '词性',
    description: '按相生相克选武士，形容词克名词、副词克动词',
  },
  'meaning-dodge': {
    id: 'meaning-dodge',
    label: '认词闪避',
    shortLabel: '闪避',
    description: '怪兽回合四选一认义，答错扣 HP',
  },
  'adv-verb-pair': {
    id: 'adv-verb-pair',
    label: '副词动词搭配',
    shortLabel: '搭配',
    description: '为动词匹配合适副词（如 run → quickly）',
  },
  'pos-squad-link': {
    id: 'pos-squad-link',
    label: '词性连线',
    shortLabel: '连线',
    description: '组六族小队，按词性连线逐个击破敌军',
  },
}

export interface LevelKindLearningProfile {
  kind: PlanetLevelKind
  nodeLabel: string
  teachingGoal: string
  methodIds: LearningMethodId[]
  enterCta: string
  sceneHint: string
}

/** 关卡类型 → 学习方法（对齐 DOC-PROD-005 §7） */
export const LEVEL_KIND_LEARNING: Record<PlanetLevelKind, LevelKindLearningProfile> = {
  recruit: {
    kind: 'recruit',
    nodeLabel: '村庄·招募',
    teachingGoal: '词义识别 + 造句应用',
    methodIds: ['meaning-choice', 'sentence-cloze'],
    enterCta: '进入招募',
    sceneHint: '先四选一认词，再完成三道选词填空造句，村民才会入团。',
  },
  review: {
    kind: 'review',
    nodeLabel: '山谷·复习',
    teachingGoal: '抗遗忘 · 留住走散士兵',
    methodIds: ['meaning-choice'],
    enterCta: '进入复习',
    sceneHint: '逐个四选一认词；答对提升熟悉度，答错可能叛逃。',
  },
  boss: {
    kind: 'boss',
    nodeLabel: '城堡·BOSS',
    teachingGoal: '拼写 + 词性克制',
    methodIds: ['pos-match-battle', 'spelling-fire', 'meaning-dodge'],
    enterCta: '进入决战',
    sceneHint: '选相生武士出战 → 拼写发射击破封印 → 怪兽回合认词闪避。',
  },
  forest: {
    kind: 'forest',
    nodeLabel: '森林·迷路',
    teachingGoal: '副词修饰动词 · 固定搭配',
    methodIds: ['adv-verb-pair'],
    enterCta: '进入迷林',
    sceneHint: '动词猎手封锁道路，为每个动词选出合适副词，全部配对正确方可通行。',
  },
}

/** 地图地形与关卡类型的默认对应（无 levelId 的路点仅作叙事参考） */
export const TERRAIN_LEVEL_KIND: Partial<Record<MapTerrain, PlanetLevelKind>> = {
  village: 'recruit',
  valley: 'review',
  castle: 'boss',
  forest: 'forest',
}

export function getLevelLearningProfile(kind: PlanetLevelKind): LevelKindLearningProfile {
  return LEVEL_KIND_LEARNING[kind]
}

export function getLearningMethodsForKind(kind: PlanetLevelKind): LearningMethodDef[] {
  return LEVEL_KIND_LEARNING[kind].methodIds.map((id) => LEARNING_METHODS[id])
}

export function formatLearningMethodsSummary(kind: PlanetLevelKind): string {
  return getLearningMethodsForKind(kind)
    .map((m) => m.label)
    .join(' → ')
}

export function formatLearningMethodsNote(kind: PlanetLevelKind): string {
  const profile = LEVEL_KIND_LEARNING[kind]
  return `学习方式：${formatLearningMethodsSummary(kind)} · ${profile.teachingGoal}`
}

export function levelKindShortLabel(kind: PlanetLevelKind): string {
  return LEVEL_KIND_LEARNING[kind].nodeLabel
}
