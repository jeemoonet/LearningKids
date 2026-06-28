import type { LevelConfig, WordEntry } from '../battle/battleTypes';

export class MonsterAI {
  private level: LevelConfig
  private themeWords: WordEntry[]
  private learnedWords: WordEntry[]
  private rng: () => number

  constructor(
    level: LevelConfig,
    themeWords: WordEntry[],
    learnedWords: WordEntry[],
    rng: () => number = Math.random,
  ) {
    this.level = level
    this.themeWords = themeWords
    this.learnedWords = learnedWords
    this.rng = rng
  }

  pickAttackWord(excludedWordIds?: Set<string>): WordEntry {
    const themeBase = this.themeWords.length > 0 ? this.themeWords : this.learnedWords
    const learnedBase = this.learnedWords.length > 0 ? this.learnedWords : themeBase
    const filterPool = (pool: WordEntry[]) =>
      excludedWordIds && excludedWordIds.size > 0
        ? pool.filter((w) => !excludedWordIds.has(w.id))
        : pool

    const themePool = filterPool(themeBase)
    const learnedPool = filterPool(learnedBase)
    const safeThemePool = themePool.length > 0 ? themePool : themeBase
    const safeLearnedPool = learnedPool.length > 0 ? learnedPool : learnedBase
    const useTheme = this.rng() < this.level.attackPoolWeights.theme;
    let pool = useTheme ? safeThemePool : safeLearnedPool
    if (pool.length === 0) pool = safeThemePool.length > 0 ? safeThemePool : safeLearnedPool
    if (pool.length === 0) pool = this.themeWords.length > 0 ? this.themeWords : this.learnedWords
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
