import type { DatabaseSync } from 'node:sqlite'
import { buildPlanetSession, ensureFamiliarityRows, type PlanetSession } from './conquerPlanet.js'

const SECTION_PASS_BASELINE = 2
const FAMILIARITY_MAX = 5

function startOfUtcDay(ts: number): number {
  const d = new Date(ts)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function setPlanetFamiliarityExact(
  db: DatabaseSync,
  userId: string,
  word: string,
  familiarity: number,
): void {
  const now = Date.now()
  const value = Math.max(0, Math.min(FAMILIARITY_MAX, Math.round(familiarity)))
  db.prepare(
    `INSERT INTO user_planet_familiarity (user_id, word, familiarity, last_reviewed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, word) DO UPDATE SET
       familiarity = excluded.familiarity,
       last_reviewed_at = excluded.last_reviewed_at`,
  ).run(userId, word.trim().toLowerCase(), value, now)
}

function upsertPlanetFamiliarity(
  db: DatabaseSync,
  userId: string,
  word: string,
  familiarity: number,
): void {
  const now = Date.now()
  const value = Math.max(0, Math.min(5, Math.round(familiarity)))
  db.prepare(
    `INSERT INTO user_planet_familiarity (user_id, word, familiarity, last_reviewed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, word) DO UPDATE SET
       familiarity = MAX(user_planet_familiarity.familiarity, excluded.familiarity),
       last_reviewed_at = excluded.last_reviewed_at`,
  ).run(userId, word.trim().toLowerCase(), value, now)
}

export interface BossMicroGainResult {
  gained: boolean
  familiarity: number
  session: PlanetSession
}

/** Boss 战：已入团词拼写/认义答对时 +1 熟悉度（同日同词最多一次，答错不扣） */
export function applyBossMicroGain(
  db: DatabaseSync,
  userId: string,
  word: string,
): BossMicroGainResult {
  const key = word.trim().toLowerCase()
  if (!key) {
    return { gained: false, familiarity: 0, session: buildPlanetSession(db, userId) }
  }

  const known = db
    .prepare('SELECT 1 FROM user_known_words WHERE user_id = ? AND lower(word) = ?')
    .get(userId, key)
  if (!known) {
    return { gained: false, familiarity: 0, session: buildPlanetSession(db, userId) }
  }

  ensureFamiliarityRows(db, userId)
  const famRow = db
    .prepare('SELECT familiarity FROM user_planet_familiarity WHERE user_id = ? AND word = ?')
    .get(userId, key) as { familiarity: number } | undefined
  let fam = Number(famRow?.familiarity ?? 3)

  if (fam >= FAMILIARITY_MAX) {
    return { gained: false, familiarity: fam, session: buildPlanetSession(db, userId) }
  }

  const gainDay = startOfUtcDay(Date.now())
  const already = db
    .prepare(
      `SELECT 1 FROM user_planet_boss_gain_log
       WHERE user_id = ? AND word = ? AND gain_day = ?`,
    )
    .get(userId, key, gainDay)
  if (already) {
    return { gained: false, familiarity: fam, session: buildPlanetSession(db, userId) }
  }

  fam = Math.min(FAMILIARITY_MAX, fam + 1)
  setPlanetFamiliarityExact(db, userId, key, fam)
  db.prepare(
    `INSERT INTO user_planet_boss_gain_log (user_id, word, gain_day, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, key, gainDay, Date.now())

  return { gained: true, familiarity: fam, session: buildPlanetSession(db, userId) }
}

/** 小节测评通过后，将 section_words 熟悉度合并进 planet 表 */
export function mergeSectionFamiliarityOnPass(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): number {
  const rows = db
    .prepare(
      `SELECT sw.word, sw.familiarity,
              pf.familiarity AS planet_familiarity
       FROM section_words sw
       LEFT JOIN user_planet_familiarity pf
         ON pf.user_id = ? AND lower(pf.word) = lower(sw.word)
       WHERE sw.section_id = ?`,
    )
    .all(userId, sectionId) as Array<{
    word: string
    familiarity: number
    planet_familiarity: number | null
  }>

  let updated = 0
  for (const row of rows) {
    const sectionFam = Number(row.familiarity ?? 0)
    const planetFam = row.planet_familiarity != null ? Number(row.planet_familiarity) : null
    const merged = Math.min(
      5,
      Math.max(sectionFam, planetFam ?? 0, SECTION_PASS_BASELINE),
    )
    upsertPlanetFamiliarity(db, userId, row.word, merged)
    updated += 1
  }
  return updated
}
