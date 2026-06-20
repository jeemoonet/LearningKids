import { DatabaseSync } from 'node:sqlite'
import { buildBeginnerThemeGroups } from '../server/dist/lib/buildBeginnerThemeGroups.js'

const db = new DatabaseSync('server/data/app.db')
const words = db.prepare('SELECT id, word, pos FROM words WHERE tier_id = ? ORDER BY sort_order').all('beginner')

const groups = buildBeginnerThemeGroups(words)
for (const group of groups) {
  console.log(group.title, group.wordIds.length)
}
console.log('total', groups.reduce((sum, group) => sum + group.wordIds.length, 0))
const other = groups.find((group) => group.theme.id === 'other')
if (other) {
  const sample = other.wordIds.slice(0, 60).map((id) => {
    const row = words.find((word) => word.id === id)
    return row?.word.replace(/\s+\[.*$/, '')
  })
  console.log('other sample', sample.join(', '))
}
