import type { SaveData, WordEntry } from '../domain/battle/battleTypes';
import starterWords from '../data/words/starter-100.json';
import level01Words from '../data/words/levels/level-01.json';

const SAVE_KEY = 'word-hunter-save-v1';

export function getAllWordEntries(): Map<string, WordEntry> {
  const map = new Map<string, WordEntry>();
  for (const w of [...starterWords, ...level01Words] as WordEntry[]) {
    map.set(w.id, w);
  }
  return map;
}

export function createNewSave(starterIds: string[]): SaveData {
  const now = new Date().toISOString();
  return {
    version: 1,
    progress: {
      version: 1,
      unlockedLevel: 1,
      wordMastery: Object.fromEntries(
        starterIds.map((id) => [
          id,
          {
            wordId: id,
            familiarity: 30,
            learnedVia: 'starter' as const,
            firstLearnedAt: now,
          },
        ]),
      ),
      stats: {
        totalBattlesWon: 0,
        totalWordsLearned: starterIds.length,
        bestCombo: 0,
      },
    },
    ownedWordIds: [...starterIds],
    updatedAt: now,
  };
}

export class SaveService {
  static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  static persist(save: SaveData): void {
    save.updatedAt = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  static clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
