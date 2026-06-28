import type { DatabaseSync } from 'node:sqlite'
import { ensureFamiliarityRows, buildPlanetSession } from './conquerPlanet.js'
import { resolveLevel } from './playerLevelConfig.js'

export interface LevelProgress {
  current: number
  floor: number
  ceiling: number
}

export interface PlayerStats {
  combatPower: number
  magicPower: number
  totalGrowth: number
  level: number
  levelTitle: string
  levelProgress: LevelProgress
  armySize: number
  legionBattlePower: number
}

function getMagicPower(db: DatabaseSync, userId: string): number {
  const row = db
    .prepare('SELECT magic_power FROM user_profiles WHERE user_id = ?')
    .get(userId) as { magic_power?: number } | undefined
  return Math.max(0, Number(row?.magic_power ?? 0))
}

export function computeCombatPower(db: DatabaseSync, userId: string): number {
  ensureFamiliarityRows(db, userId)
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(familiarity), 0) AS total
       FROM user_planet_familiarity WHERE user_id = ?`,
    )
    .get(userId) as { total: number }
  return Math.max(0, Number(row?.total ?? 0))
}

export function getPlayerStats(db: DatabaseSync, userId: string): PlayerStats {
  const session = buildPlanetSession(db, userId)
  const combatPower = session.combatPower
  const magicPower = getMagicPower(db, userId)
  const totalGrowth = combatPower + magicPower
  const resolved = resolveLevel(totalGrowth)

  return {
    combatPower,
    magicPower,
    totalGrowth,
    level: resolved.level,
    levelTitle: resolved.levelTitle,
    levelProgress: {
      current: totalGrowth,
      floor: resolved.floor,
      ceiling: resolved.ceiling,
    },
    armySize: session.armySize,
    legionBattlePower: session.totalPower,
  }
}
