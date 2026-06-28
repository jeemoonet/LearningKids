import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { getPlayerStats } from './playerStats.js'

export type GrammarModule = 'prep' | 'sentence'

export interface GrammarResultPayload {
  passed: boolean
  familiarity: number
  magicPower: number
  magicGained: number
  combatPower: number
  totalGrowth: number
  level: number
  levelTitle: string
  levelUp: boolean
}

interface GrammarRow {
  familiarity: number
  pass_count: number
  last_fam_gain_at: number | null
}

function startOfUtcDay(ts: number): number {
  const d = new Date(ts)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function ensureProfileRow(db: DatabaseSync, userId: string): void {
  const exists = db
    .prepare('SELECT user_id FROM user_profiles WHERE user_id = ?')
    .get(userId)
  if (!exists) {
    db.prepare(
      'INSERT INTO user_profiles (user_id, grade, updated_at, magic_power) VALUES (?, \'\', ?, 0)',
    ).run(userId, Date.now())
  }
}

export function submitGrammarResult(
  db: DatabaseSync,
  userId: string,
  module: GrammarModule,
  skillId: string,
  correctCount: number,
  totalQuestions: number,
): GrammarResultPayload {
  const skill = skillId.trim()
  if (!skill) throw new Error('缺少 skillId')

  const safeTotal = Math.max(0, Math.round(totalQuestions))
  const safeCorrect = Math.max(0, Math.min(safeTotal, Math.round(correctCount)))
  const passed = safeTotal > 0 && safeCorrect >= safeTotal

  ensureProfileRow(db, userId)
  const beforeStats = getPlayerStats(db, userId)
  const now = Date.now()
  const todayStart = startOfUtcDay(now)

  const existing = db
    .prepare(
      `SELECT familiarity, pass_count, last_fam_gain_at
       FROM user_grammar_familiarity WHERE user_id = ? AND skill_id = ?`,
    )
    .get(userId, skill) as GrammarRow | undefined

  let familiarity = existing?.familiarity ?? 0
  let lastFamGainAt = existing?.last_fam_gain_at ?? null
  let passCount = existing?.pass_count ?? 0
  let magicGained = 0

  if (passed) {
    magicGained = 1
    db.prepare(
      'UPDATE user_profiles SET magic_power = magic_power + 1, updated_at = ? WHERE user_id = ?',
    ).run(now, userId)

    if (passCount === 0) {
      familiarity = 3
      lastFamGainAt = now
    } else if (familiarity < 5) {
      const lastGainDay = lastFamGainAt ? startOfUtcDay(lastFamGainAt) : 0
      if (lastGainDay < todayStart) {
        familiarity = Math.min(5, familiarity + 1)
        lastFamGainAt = now
      }
    }
    passCount += 1
  } else {
    familiarity = Math.max(familiarity, 1)
  }

  db.prepare(
    `INSERT INTO user_grammar_familiarity (
       user_id, skill_id, module, familiarity, best_score, total_questions,
       pass_count, last_played_at, last_fam_gain_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, skill_id) DO UPDATE SET
       module = excluded.module,
       familiarity = excluded.familiarity,
       best_score = MAX(user_grammar_familiarity.best_score, excluded.best_score),
       total_questions = excluded.total_questions,
       pass_count = excluded.pass_count,
       last_played_at = excluded.last_played_at,
       last_fam_gain_at = excluded.last_fam_gain_at,
       updated_at = excluded.updated_at`,
  ).run(
    userId,
    skill,
    module,
    familiarity,
    safeCorrect,
    safeTotal,
    passCount,
    now,
    lastFamGainAt,
    now,
  )

  if (passed) {
    db.prepare(
      `INSERT INTO user_grammar_pass_log (id, user_id, skill_id, module, correct_count, total_questions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      `gpl-${randomBytes(8).toString('hex')}`,
      userId,
      skill,
      module,
      safeCorrect,
      safeTotal,
      now,
    )
  }

  const afterStats = getPlayerStats(db, userId)

  return {
    passed,
    familiarity,
    magicPower: afterStats.magicPower,
    magicGained,
    combatPower: afterStats.combatPower,
    totalGrowth: afterStats.totalGrowth,
    level: afterStats.level,
    levelTitle: afterStats.levelTitle,
    levelUp: afterStats.level > beforeStats.level,
  }
}

export interface GrammarProgressMigrateEntry {
  module: GrammarModule
  skillId: string
  bestScore: number
  totalQuestions: number
  passed: boolean
  lastPlayedAt?: number
}

export interface GrammarProgressMigrateResult {
  imported: number
  skipped: number
  magicAdded: number
}

/** 将客户端 localStorage 语法进度一次性迁入服务端（已有记录的技能跳过） */
export function migrateGrammarProgress(
  db: DatabaseSync,
  userId: string,
  entries: GrammarProgressMigrateEntry[],
): GrammarProgressMigrateResult {
  ensureProfileRow(db, userId)
  let imported = 0
  let skipped = 0
  let magicAdded = 0
  const now = Date.now()

  for (const entry of entries) {
    const skill = entry.skillId?.trim()
    if (!skill || (entry.module !== 'prep' && entry.module !== 'sentence')) continue

    const exists = db
      .prepare(
        'SELECT skill_id FROM user_grammar_familiarity WHERE user_id = ? AND skill_id = ?',
      )
      .get(userId, skill)
    if (exists) {
      skipped += 1
      continue
    }

    const safeTotal = Math.max(0, Math.round(entry.totalQuestions))
    const safeBest = Math.max(0, Math.min(safeTotal, Math.round(entry.bestScore)))
    const passed = Boolean(entry.passed)
    const playedAt = entry.lastPlayedAt && entry.lastPlayedAt > 0 ? entry.lastPlayedAt : now

    let familiarity = 0
    let passCount = 0
    let lastFamGainAt: number | null = null

    if (passed) {
      familiarity = 3
      passCount = 1
      lastFamGainAt = playedAt
      db.prepare(
        'UPDATE user_profiles SET magic_power = magic_power + 1, updated_at = ? WHERE user_id = ?',
      ).run(now, userId)
      magicAdded += 1
      db.prepare(
        `INSERT INTO user_grammar_pass_log (id, user_id, skill_id, module, correct_count, total_questions, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        `gpl-${randomBytes(8).toString('hex')}`,
        userId,
        skill,
        entry.module,
        safeTotal > 0 ? safeTotal : safeBest,
        safeTotal,
        playedAt,
      )
    } else if (safeBest > 0 || safeTotal > 0) {
      familiarity = 1
    }

    db.prepare(
      `INSERT INTO user_grammar_familiarity (
         user_id, skill_id, module, familiarity, best_score, total_questions,
         pass_count, last_played_at, last_fam_gain_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      userId,
      skill,
      entry.module,
      familiarity,
      safeBest,
      safeTotal,
      passCount,
      playedAt,
      lastFamGainAt,
      now,
    )
    imported += 1
  }

  return { imported, skipped, magicAdded }
}
