import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { buildGroupCoverPrompt, groupCoverMetaFromGroup } from '../server/dist/lib/groupCoverPrompt.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const skip = new Set([2])
const groups = [1, 3, 4, 5, 6, 7, 8, 9, 10]

const db = new DatabaseSync(join(root, 'server/data/app.db'))

function loadGroup(groupIndex) {
  const group = db
    .prepare('SELECT group_index, title FROM game_tier_groups WHERE tier_id = ? AND group_index = ?')
    .get('beginner', groupIndex)
  if (!group) return null
  const words = db
    .prepare(
      `SELECT w.word, w.pos FROM game_word_assignments a
       JOIN words w ON w.id = a.word_id
       WHERE a.tier_id = 'beginner' AND a.group_index = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(groupIndex)
  return groupCoverMetaFromGroup('beginner', groupIndex, group.title, words)
}

const out = {}
for (const groupIndex of groups) {
  if (skip.has(groupIndex)) continue
  const meta = loadGroup(groupIndex)
  if (!meta) continue
  out[groupIndex] = { title: meta.title, words: meta.words, prompt: buildGroupCoverPrompt(meta) }
}

writeFileSync(join(root, 'scripts', '.learning-cover-prompts.json'), JSON.stringify(out, null, 2), 'utf8')
console.log(`Wrote ${Object.keys(out).length} prompts to scripts/.learning-cover-prompts.json`)
