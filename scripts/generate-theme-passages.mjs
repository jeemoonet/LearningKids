/**
 * 为各主题批量生成场景短文（passage_en / passage_zh）
 * 规则：≤3 句，串联本主题全部单词，支持 TTS 播放
 *
 * 用法：
 *   node --import tsx/esm scripts/generate-theme-passages.mjs
 *   node --import tsx/esm scripts/generate-theme-passages.mjs --tier beginner --force
 */
import { DatabaseSync } from 'node:sqlite'
import { generateAllThemePassages } from '../server/src/lib/generateThemePassage.ts'

const args = process.argv.slice(2)
const tierArgIndex = args.indexOf('--tier')
const tierId = tierArgIndex >= 0 ? args[tierArgIndex + 1] : 'beginner'
const force = args.includes('--force')

const db = new DatabaseSync('server/data/app.db')

console.log(`Generating theme passages for tier: ${tierId}${force ? ' (force)' : ''}`)

const results = await generateAllThemePassages(db, tierId, { force, delayMs: 200 })

let ok = 0
for (const item of results) {
  ok += 1
  console.log(`${item.groupIndex}\t${item.title}\t${item.source}`)
}

console.log(`\nDone: ${ok}/${results.length} themes`)
