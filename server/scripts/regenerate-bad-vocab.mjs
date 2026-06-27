/** 批量重新生成释义含「一个常见的英语单词」前缀的单词 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { buildQwenChatUrl, loadQwenConfig } from '../src/lib/loadQwenApiKey.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.resolve(__dirname, '../data/app.db')
const CACHE_FILE = path.resolve(__dirname, '../../material/english/vocab_cache.json')
const BAD_MEANING = '一个常见的英语单词'
const BATCH_SIZE = 10

const TIER_LABELS = { beginner: '初级', intermediate: '中级', advanced: '高级' }
const HIGH_FREQ_FILES = {
  beginner: '中考高频词-初级组.md',
  intermediate: '中考高频词-中级组.md',
  advanced: '中考高频词-高级组.md',
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadHighFreqPool(tierId, limit = 80) {
  const filePath = path.resolve(__dirname, '../data', HIGH_FREQ_FILES[tierId] ?? HIGH_FREQ_FILES.beginner)
  if (!fs.existsSync(filePath)) return ''
  return fs
    .readFileSync(filePath, 'utf8')
    .trim()
    .replace(/;$/, '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(', ')
}

function tierSentenceRules(tierId) {
  switch (tierId) {
    case 'intermediate':
      return '允许 1 个介词短语或 1 个并列结构；仍避免 which/that 定语从句'
    case 'advanced':
      return '允许中考阅读/完形常见句型（It is ... to ...、help sb. do 等）；句中生词不超过 1 个'
    default:
      return '主谓宾/主系表，一般现在时为主；禁止从句、被动语态、虚拟语气'
  }
}

function findBadWords(db) {
  return db
    .prepare(
      `
      SELECT id, word, pos, pos_label, tier_id, meaning_zh, example_en
      FROM words
      WHERE meaning_zh LIKE ?
      ORDER BY id
      `,
    )
    .all(`%${BAD_MEANING}%`)
}

function buildBatchPrompt(words, highFreq) {
  const tierId = words[0]?.tier_id ?? 'beginner'
  const tierLabel = TIER_LABELS[tierId] ?? tierId
  const wordLines = words.map((w) => `- ${w.word} (${w.pos_label || w.pos})`).join('\n')

  return `你是初中英语词汇编写专家，面向英语弱基础学生（北京中考）。

请为以下每个单词重新生成词汇数据（释义、例句、关联词）。

## 单词（年级：${tierLabel}）
${wordLines}

## 例句规则
1. meaning_zh：中文释义，≤20字，仅最常考的一个义项；禁止出现「一个常见的英语单词」等占位前缀
2. example_en：6～10 个英文词，最多 12 词；${tierSentenceRules(tierId)}
3. example_zh：例句中文对照，自然简洁
4. 除目标词外，句中其余词优先使用熟词池中的词
5. 禁止语法错误模板句（如 Students {word} new skills、Remember to use {word}、She answered {word} and got full marks）
6. 例句必须语法正确，及物/不及物用法准确
7. 人名/缩写释义标注「人名/缩写」或给出常见译名

## 关联词
similar 共 3 项：词形变化 > 固定搭配 > 同场景词 > 易混词

## 熟词池
${highFreq || '（请使用初中常见词）'}

## 输出格式
只输出 JSON，不要 markdown 代码块：
{"words":[{"word":"...","meaning_zh":"...","example_en":"...","example_zh":"...","similar1":"...","similar2":"...","similar3":"..."}]}
必须覆盖上述每个单词，word 字段与列表完全一致。`
}

async function callQwenBatch(prompt) {
  const { apiKey, baseUrl, model } = loadQwenConfig()
  const response = await fetch(buildQwenChatUrl(baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `API 请求失败 (${response.status})`)
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('API 未返回内容')
  return JSON.parse(content)
}

function validateEntry(entry, expectedWord) {
  if (entry.word !== expectedWord) return false
  if (!entry.meaning_zh?.trim() || entry.meaning_zh.includes(BAD_MEANING)) return false
  if (!entry.example_en?.trim() || !entry.example_zh?.trim()) return false
  return true
}

function applyBatch(db, entries) {
  const stmt = db.prepare(`
    UPDATE words
    SET meaning_zh = ?, example_en = ?, example_zh = ?,
        similar1 = ?, similar2 = ?, similar3 = ?
    WHERE id = ?
  `)
  let updated = 0
  for (const { id, entry } of entries) {
    stmt.run(
      entry.meaning_zh.trim(),
      entry.example_en.trim(),
      entry.example_zh.trim(),
      entry.similar1?.trim() ?? '',
      entry.similar2?.trim() ?? '',
      entry.similar3?.trim() ?? '',
      id,
    )
    updated += 1
  }
  return updated
}

function syncCacheFromDb(db, words) {
  if (!fs.existsSync(CACHE_FILE)) return 0
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  let updated = 0
  for (const word of words) {
    const row = db
      .prepare(
        'SELECT phonetic, meaning_zh, similar1, similar2, similar3, example_en, example_zh FROM words WHERE word = ?',
      )
      .get(word)
    if (!row) continue
    cache[word] = {
      phonetic: row.phonetic ?? '',
      meaning_zh: row.meaning_zh,
      similar1: row.similar1 ?? '',
      similar2: row.similar2 ?? '',
      similar3: row.similar3 ?? '',
      example_en: row.example_en,
      example_zh: row.example_zh ?? '',
      story_theme: cache[word]?.story_theme ?? '',
    }
    updated += 1
  }
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
  return updated
}

function chunkByTier(words) {
  const groups = new Map()
  for (const word of words) {
    const key = word.tier_id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(word)
  }
  const batches = []
  for (const tierWords of groups.values()) {
    for (let i = 0; i < tierWords.length; i += BATCH_SIZE) {
      batches.push(tierWords.slice(i, i + BATCH_SIZE))
    }
  }
  return batches
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 0

  if (!process.env.SERVERS_MD) {
    process.env.SERVERS_MD = path.join(os.homedir(), 'DEV/server/Servers.md')
  }

  const db = new DatabaseSync(DB_PATH)
  const targets = findBadWords(db)
  const toProcess = limit > 0 ? targets.slice(0, limit) : targets
  const batches = chunkByTier(toProcess)

  console.log(`发现 ${targets.length} 个待修复单词，分 ${batches.length} 批处理`)
  if (dryRun) {
    for (const row of toProcess) console.log(`  ${row.id}\t${row.word}\t${row.meaning_zh}`)
    return
  }

  const ok = []
  const failed = []

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i]
    const tierId = batch[0].tier_id
    const highFreq = loadHighFreqPool(tierId)
    const label = batch.map((w) => w.word).join(', ')
    process.stdout.write(`[${i + 1}/${batches.length}] ${label} ... `)

    try {
      const result = await callQwenBatch(buildBatchPrompt(batch, highFreq))
      const byWord = new Map((result.words ?? []).map((entry) => [entry.word, entry]))
      const applied = []

      for (const row of batch) {
        const entry = byWord.get(row.word)
        if (!entry || !validateEntry(entry, row.word)) {
          failed.push({ word: row.word, message: '生成结果无效' })
          continue
        }
        applied.push({ id: row.id, entry })
        ok.push(row.word)
      }

      if (applied.length) applyBatch(db, applied)
      console.log(`OK ${applied.length}/${batch.length}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      for (const row of batch) failed.push({ word: row.word, message })
      console.log(`FAIL ${message}`)
    }

    await sleep(500)
  }

  const cacheUpdated = syncCacheFromDb(db, ok)
  const remaining = findBadWords(db).length

  console.log('\n--- 完成 ---')
  console.log(`成功: ${ok.length}`)
  console.log(`失败: ${failed.length}`)
  console.log(`vocab_cache 同步: ${cacheUpdated} 词`)
  console.log(`剩余待修复: ${remaining}`)
  if (failed.length) {
    console.log('失败列表:')
    for (const item of failed) console.log(`  ${item.word}: ${item.message}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
