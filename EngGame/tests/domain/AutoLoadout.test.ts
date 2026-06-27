import { describe, it, expect } from 'vitest';
import { AutoLoadout } from '@/domain/loadout/AutoLoadout';
import { WordBank } from '@/domain/word/WordBank';
import type { LevelConfig, SaveData, WordEntry } from '@/domain/battle/battleTypes';
import starterWords from '@/data/words/starter-100.json';
import level01 from '@/data/levels/level-01.json';

describe('AutoLoadout', () => {
  it('builds 10 slots with 5 recent and 5 recommended', () => {
    const entries = new Map((starterWords as WordEntry[]).map((w) => [w.id, w]));
    const save: SaveData = {
      version: 1,
      ownedWordIds: (starterWords as WordEntry[]).map((w) => w.id),
      progress: {
        version: 1,
        unlockedLevel: 1,
        wordMastery: {},
        stats: { totalBattlesWon: 0, totalWordsLearned: 20, bestCombo: 0 },
      },
      updatedAt: new Date().toISOString(),
    };
    const bank = new WordBank(entries, save);
    const result = AutoLoadout.build(bank, level01 as LevelConfig);
    expect(result.slots.length).toBe(10);
    expect(result.recentIds.length).toBe(5);
    expect(result.recommendedIds.length).toBe(5);
  });
});
