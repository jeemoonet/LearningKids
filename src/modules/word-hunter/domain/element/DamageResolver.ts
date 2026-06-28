import type { PartOfSpeech, PosAffinity, WordEntry } from '../battle/battleTypes';

/** 相生表：妖怪词性 → 相生子弹词性 */
export const POS_SYNERGY: Partial<Record<PartOfSpeech, PartOfSpeech>> = {
  noun: 'adjective',
  verb: 'adverb',
  adjective: 'adverb',
  adverb: 'verb',
};

export interface HitResult {
  wordPos: PartOfSpeech;
  monsterPos: PartOfSpeech;
  affinity: PosAffinity;
  syllables: number;
  artilleryTier: 0 | 1 | 2;
  damageMultiplier: number;
  rawDamage: number;
  sealsBrokenThisHit: number;
}

export class DamageResolver {
  static readonly BASE_DAMAGE = 1.0;
  static readonly SYNERGY_MULTIPLIER = 1.2;
  static readonly RESIST_MULTIPLIER = 0.8;
  static readonly SYLLABLE_BONUS_PER_EXTRA = 0.25;
  static readonly MAX_SYLLABLE_BONUS = 1.0;

  static getAffinity(wordPos: PartOfSpeech, monsterPos: PartOfSpeech): PosAffinity {
    if (wordPos === monsterPos) return 'resist';
    if (POS_SYNERGY[monsterPos] === wordPos) return 'synergy';
    return 'neutral';
  }

  static resolve(word: WordEntry, monsterPos: PartOfSpeech): HitResult {
    const wordPos = word.partOfSpeech;
    const affinity = DamageResolver.getAffinity(wordPos, monsterPos);
    const affinityMultiplier =
      affinity === 'synergy'
        ? DamageResolver.SYNERGY_MULTIPLIER
        : affinity === 'resist'
          ? DamageResolver.RESIST_MULTIPLIER
          : 1.0;
    const syllables = Math.max(1, word.syllables ?? DamageResolver.estimateSyllables(word.word));
    const syllableBonus = Math.min(
      DamageResolver.MAX_SYLLABLE_BONUS,
      Math.max(0, syllables - 1) * DamageResolver.SYLLABLE_BONUS_PER_EXTRA,
    );
    const artilleryTier: 0 | 1 | 2 = syllables >= 4 ? 2 : syllables >= 3 ? 1 : 0;
    const lengthMultiplier = 1 + syllableBonus;
    const damageMultiplier = affinityMultiplier * lengthMultiplier;

    return {
      wordPos,
      monsterPos,
      affinity,
      syllables,
      artilleryTier,
      damageMultiplier,
      rawDamage: DamageResolver.BASE_DAMAGE * damageMultiplier,
      sealsBrokenThisHit: 0,
    };
  }

  /**
   * 轻量估算：按元音连读段近似音节数，避免词条缺失音节时伤害失真。
   */
  private static estimateSyllables(word: string): number {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!normalized) return 1;
    const groups = normalized.match(/[aeiouy]+/g);
    return Math.max(1, groups?.length ?? 1);
  }

  static applyToSeals(
    sealsBroken: number,
    buffer: number,
    rawDamage: number,
    sealsTotal = 10,
  ): { sealsBroken: number; buffer: number; brokenThisHit: number } {
    let total = buffer + rawDamage;
    let brokenThisHit = 0;

    while (total >= 1.0 && sealsBroken + brokenThisHit < sealsTotal) {
      total -= 1.0;
      brokenThisHit += 1;
    }

    return {
      sealsBroken: sealsBroken + brokenThisHit,
      buffer: total,
      brokenThisHit,
    };
  }

  static affinityLabel(affinity: PosAffinity): string {
    switch (affinity) {
      case 'synergy':
        return '相生 +20%';
      case 'resist':
        return '同词性 -20%';
      default:
        return '正常伤害';
    }
  }
}
