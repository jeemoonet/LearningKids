/**
 * 从 app.db 读取小组信息，输出 AI 配图提示词。
 * 默认配合 Cursor Skills（GenerateImage）出图，见 DOC-DEV-002 §6。
 *
 * 用法:
 *   node scripts/build-group-cover-prompt.mjs beginner 1
 *   node scripts/build-group-cover-prompt.mjs beginner --all
 *   node scripts/build-group-cover-prompt.mjs beginner 1 --json
 */

import { DatabaseSync } from 'node:sqlite'
import { buildGroupCoverPrompt, groupCoverMetaFromGroup } from '../server/dist/lib/groupCoverPrompt.js'

const tierId = process.argv[2]
const arg = process.argv[3]

if (!tierId || !arg) {
  console.error('用法: node scripts/build-group-cover-prompt.mjs <tierId> <groupIndex|--all> [--json]')
  process.exit(1)
}

const asJson = process.argv.includes('--json')
const db = new DatabaseSync('server/data/app.db')

function loadGroup(groupIndex) {
  const group = db
    .prepare('SELECT group_index, title FROM game_tier_groups WHERE tier_id = ? AND group_index = ?')
    .get(tierId, groupIndex)
  if (!group) return null

  const words = db
    .prepare(
      `SELECT w.word, w.pos
       FROM game_word_assignments a
       JOIN words w ON w.id = a.word_id
       WHERE a.tier_id = ? AND a.group_index = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(tierId, groupIndex)

  return groupCoverMetaFromGroup(tierId, groupIndex, group.title, words)
}

function printMeta(meta) {
  const asset = `src/public/images/vocab-groups/${meta.tierId}/${meta.groupIndex}.png`
  if (asJson) {
    console.log(JSON.stringify({ ...meta, asset, prompt: buildGroupCoverPrompt(meta) }, null, 2))
    return
  }
  console.log(`# ${meta.title} (${meta.words.length} words)`)
  console.log(`文件: ${asset}`)
  console.log(`单词: ${meta.words.map((w) => `${w.word}(${w.pos})`).join(', ')}`)
  console.log('')
  console.log(buildGroupCoverPrompt(meta))
  console.log('\n---\n')
}

if (arg === '--all') {
  const rows = db
    .prepare('SELECT group_index FROM game_tier_groups WHERE tier_id = ? ORDER BY group_index')
    .all(tierId)
  for (const row of rows) {
    const meta = loadGroup(row.group_index)
    if (meta) printMeta(meta)
  }
} else {
  const groupIndex = Number(arg)
  if (!Number.isInteger(groupIndex) || groupIndex < 1) {
    console.error('groupIndex 必须是正整数')
    process.exit(1)
  }
  const meta = loadGroup(groupIndex)
  if (!meta) {
    console.error(`未找到 ${tierId} 第 ${groupIndex} 组`)
    process.exit(1)
  }
  printMeta(meta)
}
