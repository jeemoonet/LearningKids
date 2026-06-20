import { DatabaseSync } from 'node:sqlite'
import { buildBeginnerThemeGroups } from '../server/dist/lib/buildBeginnerThemeGroups.js'
import { saveGameGroups } from '../server/dist/lib/gameGroups.js'

const tierId = 'beginner'
const db = new DatabaseSync('server/data/app.db')

const words = db
  .prepare('SELECT id, word, pos FROM words WHERE tier_id = ? ORDER BY sort_order, id')
  .all(tierId)

const themeGroups = buildBeginnerThemeGroups(words)

db.exec('BEGIN IMMEDIATE')
try {
  const saved = saveGameGroups(
    db,
    tierId,
    themeGroups.map((group) => ({
      title: group.title,
      wordIds: group.wordIds,
      groupSize: group.wordIds.length,
    })),
  )
  db.exec('COMMIT')
  console.log('Applied theme groups:', saved)
  for (const group of themeGroups) {
    console.log(`  ${group.title}: ${group.wordIds.length} words`)
  }
} catch (error) {
  db.exec('ROLLBACK')
  throw error
}
