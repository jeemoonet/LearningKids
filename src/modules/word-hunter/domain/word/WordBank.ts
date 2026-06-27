import type { LearnedVia, SaveData, WordEntry, WordMastery } from '../battle/battleTypes';

export class WordBank {
  private entries: Map<string, WordEntry>
  private save: SaveData

  constructor(entries: Map<string, WordEntry>, save: SaveData) {
    this.entries = entries
    this.save = save
  }

  getEntry(id: string): WordEntry | undefined {
    return this.entries.get(id);
  }

  getAllEntries(): WordEntry[] {
    return [...this.entries.values()];
  }

  isOwned(id: string): boolean {
    return this.save.ownedWordIds.includes(id);
  }

  getOwnedEntries(): WordEntry[] {
    return this.save.ownedWordIds
      .map((id) => this.entries.get(id))
      .filter((e): e is WordEntry => Boolean(e));
  }

  getSave(): SaveData {
    return this.save;
  }

  unlockWords(wordIds: string[], via: LearnedVia): void {
    for (const id of wordIds) {
      if (!this.save.ownedWordIds.includes(id)) {
        this.save.ownedWordIds.push(id);
        this.save.progress.wordMastery[id] = {
          wordId: id,
          familiarity: 10,
          learnedVia: via,
          firstLearnedAt: new Date().toISOString(),
        };
      }
    }
    this.save.progress.stats.totalWordsLearned = this.save.ownedWordIds.length;
    this.save.updatedAt = new Date().toISOString();
  }

  getRecentLearnedWordIds(limit: number): string[] {
    const viaWeight: Record<LearnedVia, number> = {
      captured: 3,
      victory: 2,
      starter: 1,
    };

    const owned = this.save.ownedWordIds
      .map((id) => this.save.progress.wordMastery[id])
      .filter((m): m is WordMastery => Boolean(m));

    return owned
      .sort((a, b) => {
        const viaDiff = viaWeight[b.learnedVia] - viaWeight[a.learnedVia];
        if (viaDiff !== 0) return viaDiff;
        return new Date(b.firstLearnedAt).getTime() - new Date(a.firstLearnedAt).getTime();
      })
      .slice(0, limit)
      .map((m) => m.wordId);
  }

  getMediumFamiliarityWordIds(exclude: Set<string>): string[] {
    return this.save.ownedWordIds
      .filter((id) => !exclude.has(id))
      .map((id) => ({ id, m: this.save.progress.wordMastery[id] }))
      .filter((x) => x.m)
      .sort((a, b) => {
        const dist = (f: number) => Math.abs(f - 50);
        return dist(a.m!.familiarity) - dist(b.m!.familiarity);
      })
      .map((x) => x.id);
  }
}
