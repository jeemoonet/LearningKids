import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('server/data/app.db')
const rows = db
  .prepare(
    `SELECT group_index, title FROM game_tier_groups
     WHERE tier_id = 'beginner' AND title LIKE '家庭%'
     ORDER BY group_index`,
  )
  .all()

for (const row of rows) {
  const words = db
    .prepare(
      `SELECT w.word FROM game_word_assignments a
       JOIN words w ON w.id = a.word_id
       WHERE a.tier_id = 'beginner' AND a.group_index = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(row.group_index)
  console.log(`${row.group_index}\t${row.title}\t${words.map((w) => w.word).join(', ')}`)
}
