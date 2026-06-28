/** 等级阈值：综合成长值（战斗力 + 魔法值）≥ 该值即达到对应等级 */
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 40, 100, 180, 280, 400, 550, 730, 940, 1180,
] as const

export const LEVEL_TITLES: readonly string[] = [
  '青铜战士',
  '白银士兵',
  '黄金勇士',
  '小队长',
  '中队长',
  '大队长',
  '星尘先锋',
  '传说将军',
  '王者元帅',
  '至尊星主',
] as const

export const MAX_LEVEL = LEVEL_TITLES.length

export interface ResolvedLevel {
  level: number
  levelTitle: string
  totalGrowth: number
  floor: number
  ceiling: number
}

export function resolveLevel(totalGrowth: number): ResolvedLevel {
  const safe = Math.max(0, Math.floor(totalGrowth))
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (safe >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  const floor = LEVEL_THRESHOLDS[level - 1] ?? 0
  const ceiling =
    level >= MAX_LEVEL ? floor + 1 : (LEVEL_THRESHOLDS[level] ?? floor + 1)
  return {
    level,
    levelTitle: LEVEL_TITLES[level - 1] ?? LEVEL_TITLES[0],
    totalGrowth: safe,
    floor,
    ceiling,
  }
}
