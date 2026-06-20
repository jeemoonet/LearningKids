import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('server/data/app.db')
const cols = db.prepare('PRAGMA table_info(game_tier_groups)').all()
console.log('game_tier_groups columns:', cols)

const groups = db.prepare(`
  SELECT g.group_index, g.title, GROUP_CONCAT(w.word, ', ') AS words
  FROM game_tier_groups g
  JOIN game_word_assignments a ON a.tier_id = g.tier_id AND a.group_index = g.group_index
  JOIN words w ON w.id = a.word_id
  WHERE g.tier_id = 'beginner' AND g.title LIKE '学习%'
  GROUP BY g.group_index, g.title
  ORDER BY g.group_index
`).all()

for (const g of groups) {
  console.log(`${g.group_index}\t${g.title}\t${g.words}`)
}
