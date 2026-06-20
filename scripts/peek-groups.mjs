import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('server/data/app.db')
const rows = db.prepare(`
  SELECT g.group_index, g.title, w.word
  FROM game_tier_groups g
  JOIN game_word_assignments a ON a.tier_id = g.tier_id AND a.group_index = g.group_index
  JOIN words w ON w.id = a.word_id
  WHERE g.tier_id = 'beginner' AND g.group_index <= 3
  ORDER BY g.group_index, w.sort_order, w.id
`).all()

const groups = {}
for (const row of rows) {
  if (!groups[row.title]) groups[row.title] = []
  groups[row.title].push(row.word.replace(/\s+\[.*$/, ''))
}
console.log(JSON.stringify(groups, null, 2))
