import { formatLearningMethodsNote, getLevelLearningProfile } from './levelLearningMethods'
import type { PlanetLevel, PlanetLevelKind } from '../types'

export interface LevelIntroContent {
  icon: string
  title: string
  location: string
  body: string
  note?: string
  primaryLabel: string
}

function kindIcon(kind: PlanetLevelKind): string {
  if (kind === 'boss') return '🏯'
  if (kind === 'review') return '🌫️'
  if (kind === 'forest') return '🌲'
  return '🏘️'
}

export function buildRecruitIntro(level: PlanetLevel, villagerCount: number): LevelIntroContent {
  const profile = getLevelLearningProfile('recruit')
  return {
    icon: kindIcon('recruit'),
    title: level.name,
    location: `${profile.nodeLabel} · ${level.name}`,
    body: `你遇到了 ${villagerCount} 位迷失的村民，你想把他们招募到队伍中，但他们要求你必须先认识他们，并完成造句考验，才愿意加入军团。`,
    note: formatLearningMethodsNote('recruit'),
    primaryLabel: '开始招募',
  }
}

export function buildReviewIntro(level: PlanetLevel, reviewCount: number): LevelIntroContent {
  const profile = getLevelLearningProfile('review')
  const body =
    reviewCount > 0
      ? `有 ${reviewCount} 名走散的老兵在此徘徊。叫出他们的名字才能留住，答错或太久未复习，他们可能会叛逃。`
      : `此处需要巩固复习。逐个认词，答对提升熟悉度，帮老兵留在军团里。`
  return {
    icon: kindIcon('review'),
    title: level.name,
    location: `${profile.nodeLabel} · ${level.name}`,
    body,
    note: formatLearningMethodsNote('review'),
    primaryLabel: '开始复习',
  }
}

export function buildBossIntro(
  level: PlanetLevel,
  monsterName: string,
  armySize: number,
): LevelIntroContent {
  const profile = getLevelLearningProfile('boss')
  const foe = level.monsterName ?? monsterName
  return {
    icon: kindIcon('boss'),
    title: level.name,
    location: `${profile.nodeLabel} · ${level.name}`,
    body: `「${foe}」盘踞在王宫深处。你率领 ${armySize} 名士兵前来决战——选相生词性出战，拼写击破封印，并在怪兽回合认词闪避，才能攻陷此关。`,
    note: formatLearningMethodsNote('boss'),
    primaryLabel: '开始决战',
  }
}

export function buildForestIntro(level: PlanetLevel, pairCount: number): LevelIntroContent {
  const profile = getLevelLearningProfile('forest')
  return {
    icon: kindIcon('forest'),
    title: level.name,
    location: `${profile.nodeLabel} · ${level.name}`,
    body: `动词猎手封锁了前路。须完成 ${pairCount} 组「副词 + 动词」搭配试炼，迷雾才会为你让道。`,
    note: formatLearningMethodsNote('forest'),
    primaryLabel: '开始试炼',
  }
}
