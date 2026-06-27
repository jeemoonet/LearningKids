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
  damageMultiplier: number;
  rawDamage: number;
  sealsBrokenThisHit: number;
}

export class DamageResolver {
  static readonly BASE_DAMAGE = 1.0;
  static readonly SYNERGY_MULTIPLIER = 1.2;
  static readonly RESIST_MULTIPLIER = 0.8;

  static getAffinity(wordPos: PartOfSpeech, monsterPos: PartOfSpeech): PosAffinity {
    if (wordPos === monsterPos) return 'resist';
    if (POS_SYNERGY[monsterPos] === wordPos) return 'synergy';
    return 'neutral';
  }

  static resolve(word: WordEntry, monsterPos: PartOfSpeech): HitResult {
    const wordPos = word.partOfSpeech;
    const affinity = DamageResolver.getAffinity(wordPos, monsterPos);
    const damageMultiplier =
      affinity === 'synergy'
        ? DamageResolver.SYNERGY_MULTIPLIER
        : affinity === 'resist'
          ? DamageResolver.RESIST_MULTIPLIER
          : 1.0;

    return {
      wordPos,
      monsterPos,
      affinity,
      damageMultiplier,
      rawDamage: DamageResolver.BASE_DAMAGE * damageMultiplier,
      sealsBrokenThisHit: 0,
    };
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
