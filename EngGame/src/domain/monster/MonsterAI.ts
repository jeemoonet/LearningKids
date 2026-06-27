import type { LevelConfig, WordEntry } from '../battle/battleTypes';

export class MonsterAI {
  constructor(
    private level: LevelConfig,
    private themeWords: WordEntry[],
    private learnedWords: WordEntry[],
    private rng: () => number = Math.random,
  ) {}

  pickAttackWord(): WordEntry {
    const themePool = this.themeWords.length > 0 ? this.themeWords : this.learnedWords;
    const learnedPool = this.learnedWords.length > 0 ? this.learnedWords : themePool;
    const useTheme = this.rng() < this.level.attackPoolWeights.theme;
    const pool = useTheme ? themePool : learnedPool;
    const idx = Math.floor(this.rng() * pool.length);
    return pool[Math.min(idx, pool.length - 1)];
  }

  getDamage(base = 15): number {
    let dmg = base;
    if (this.level.damageMultiplier) dmg *= this.level.damageMultiplier;
    return Math.round(dmg);
  }

  getTimerSeconds(base: number, isEnraged: boolean): number {
    let t = this.level.timerSeconds ?? base;
    if (isEnraged) t -= 2;
    return Math.max(t, 4);
  }
}
