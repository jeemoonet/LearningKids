import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { DamageResolver } from '../../word-hunter/domain/element/DamageResolver'
import type { PlanetWord } from '../types'

/**
 * 战斗力公式（见设计思路·第三节）：
 *   单兵战斗力 = 基础值(音节/等级) × 词性系数 × 克制加成
 *   - 基础值：音节数
 *   - 词性系数：Verb=1.5（武士），其余=1.0
 *   - 克制加成：复用 DamageResolver 的相生(×1.2)/同词性(×0.8)
 */
export const POS_COEFFICIENT: Record<PartOfSpeech, number> = {
  noun: 1.0,
  verb: 1.5,
  adjective: 1.0,
  adverb: 1.0,
  prep: 1.0,
  pronoun: 1.0,
  other: 1.0,
}

/** 不考虑对手时的「裸」战斗力（用于军团总览） */
export function basePower(word: PlanetWord): number {
  return word.syllables * POS_COEFFICIENT[word.partOfSpeech]
}

/** 面对某词性敌人时的实战战斗力（含相生相克） */
export function combatPower(word: PlanetWord, enemyPos: PartOfSpeech): number {
  const affinity = DamageResolver.getAffinity(word.partOfSpeech, enemyPos)
  const mult =
    affinity === 'synergy'
      ? DamageResolver.SYNERGY_MULTIPLIER
      : affinity === 'resist'
        ? DamageResolver.RESIST_MULTIPLIER
        : 1.0
  return basePower(word) * mult
}

export function roundPower(n: number): number {
  return Math.round(n * 10) / 10
}
