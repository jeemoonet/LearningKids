import type { DatabaseSync } from 'node:sqlite'
import {
  getPlanetLevel,
  type PlanetLevelConfig,
  type PlanetLevelKind,
} from './conquerPlanetConfig.js'

/** 地图挑战格随机池（BOSS / 迷林固定，不参与随机） */
export const RANDOM_CHALLENGE_KINDS: Array<'recruit' | 'review' | 'reading'> = [
  'recruit',
  'review',
  'reading',
]

const KIND_PRESENTATION: Record<PlanetLevelKind, { icon: string; desc: string }> = {
  recruit: {
    icon: '🏘️',
    desc: '说出村民的名字与特点，并完成造句训练，收他们入伍',
  },
  review: {
    icon: '🌫️',
    desc: '走散的老兵在此徘徊，叫出他们的名字才能留住，否则会叛逃',
  },
  reading: {
    icon: '📖',
    desc: '用当前学习单词阅读短文，答对至少 2 道选择题即可通过',
  },
  boss: {
    icon: '🏯',
    desc: '击败盘踞城堡的怪兽，拼写击破封印',
  },
  forest: {
    icon: '🌲',
    desc: '为动词匹配副词，配对成功才能通行',
  },
}

export function isRandomChallengeSlot(kind: PlanetLevelKind): boolean {
  return kind === 'recruit' || kind === 'review'
}

function readAssignment(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): PlanetLevelKind | null {
  const row = db
    .prepare(
      `SELECT assigned_kind FROM user_planet_level_assignments
       WHERE user_id = ? AND level_id = ?`,
    )
    .get(userId, levelId) as { assigned_kind: string } | undefined
  if (!row?.assigned_kind) return null
  return row.assigned_kind as PlanetLevelKind
}

function writeAssignment(
  db: DatabaseSync,
  userId: string,
  levelId: string,
  kind: PlanetLevelKind,
): void {
  db.prepare(
    `INSERT INTO user_planet_level_assignments (user_id, level_id, assigned_kind, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, level_id) DO NOTHING`,
  ).run(userId, levelId, kind, Date.now())
}

export function getAssignedKind(
  db: DatabaseSync,
  userId: string,
  base: PlanetLevelConfig,
): PlanetLevelKind {
  if (!isRandomChallengeSlot(base.kind)) return base.kind

  const existing = readAssignment(db, userId, base.id)
  if (existing) return existing

  const pick =
    RANDOM_CHALLENGE_KINDS[Math.floor(Math.random() * RANDOM_CHALLENGE_KINDS.length)]
  writeAssignment(db, userId, base.id, pick)
  return pick
}

export function applyKindPresentation(
  base: PlanetLevelConfig,
  kind: PlanetLevelKind,
): PlanetLevelConfig {
  const preset = KIND_PRESENTATION[kind]
  return {
    ...base,
    kind,
    icon: preset.icon,
    desc: preset.desc,
  }
}

export function getEffectiveLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): PlanetLevelConfig | undefined {
  const base = getPlanetLevel(levelId)
  if (!base) return undefined
  const kind = getAssignedKind(db, userId, base)
  return applyKindPresentation(base, kind)
}

export function clearLevelAssignments(
  db: DatabaseSync,
  userId: string,
  levelIds: string[],
): void {
  if (levelIds.length === 0) return
  const placeholders = levelIds.map(() => '?').join(',')
  db.prepare(
    `DELETE FROM user_planet_level_assignments
     WHERE user_id = ? AND level_id IN (${placeholders})`,
  ).run(userId, ...levelIds)
}
