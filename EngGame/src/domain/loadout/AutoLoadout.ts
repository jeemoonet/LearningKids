import { POS_SYNERGY } from '../element/DamageResolver';
import type { ClipSlot, LevelConfig, PartOfSpeech, PrefillResult } from '../battle/battleTypes';
import type { WordBank } from '../word/WordBank';

export class AutoLoadout {
  static readonly RECENT_COUNT = 5;
  static readonly RECOMMENDED_COUNT = 5;

  static build(wordBank: WordBank, level: LevelConfig): PrefillResult {
    const used = new Set<string>();
    const recentIds: string[] = [];

    for (const id of wordBank.getRecentLearnedWordIds(AutoLoadout.RECENT_COUNT * 2)) {
      if (recentIds.length >= AutoLoadout.RECENT_COUNT) break;
      if (used.has(id)) continue;
      recentIds.push(id);
      used.add(id);
    }

    for (const id of level.themeWordIds) {
      if (recentIds.length >= AutoLoadout.RECENT_COUNT) break;
      if (!used.has(id)) {
        recentIds.push(id);
        used.add(id);
      }
    }

    const recommendedIds: string[] = [];
    const themeSorted = sortByPosAffinity(level.themeWordIds, level.monsterPartOfSpeech, wordBank);

    for (const id of themeSorted) {
      if (recommendedIds.length >= AutoLoadout.RECOMMENDED_COUNT) break;
      if (!used.has(id)) {
        recommendedIds.push(id);
        used.add(id);
      }
    }

    if (recommendedIds.length < AutoLoadout.RECOMMENDED_COUNT) {
      for (const id of wordBank.getMediumFamiliarityWordIds(used)) {
        if (recommendedIds.length >= AutoLoadout.RECOMMENDED_COUNT) break;
        recommendedIds.push(id);
        used.add(id);
      }
    }

    const slots: ClipSlot[] = [
      ...recentIds.map((wordId) => ({
        wordId,
        source: 'owned' as const,
        prefillTag: 'recent' as const,
      })),
      ...recommendedIds.map((wordId) => ({
        wordId,
        source: 'owned' as const,
        prefillTag: 'recommended' as const,
      })),
    ];

    return { slots, recentIds, recommendedIds };
  }
}

function sortByPosAffinity(
  wordIds: string[],
  monsterPos: PartOfSpeech,
  wordBank: WordBank,
): string[] {
  const synergyPos = POS_SYNERGY[monsterPos];
  return [...wordIds].sort((a, b) => {
    const ea = wordBank.getEntry(a);
    const eb = wordBank.getEntry(b);
    if (!ea || !eb) return 0;
    const score = (pos: PartOfSpeech) => {
      if (pos === synergyPos) return 0;
      if (pos === monsterPos) return 2;
      return 1;
    };
    return score(ea.partOfSpeech) - score(eb.partOfSpeech);
  });
}
