/** 调整指定单词词性并重新生成释义/例句 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { buildQwenChatUrl, loadQwenConfig } from '../src/lib/loadQwenApiKey.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.resolve(__dirname, '../data/app.db')
const CACHE_FILE = path.resolve(__dirname, '../../material/english/vocab_cache.json')

const POS_LABEL = {
  noun: '名词',
  verb: '动词',
  adj: '形容词',
  adv: '副词',
  other: '其他',
}

/** word -> 目标词性 */
const TARGET_POS = {
  doubt: 'verb',
  print: 'verb',
  scare: 'verb',
  care: 'verb',
  free: 'adj',
  rich: 'adj',
  poor: 'adj',
  deep: 'adj',
  low: 'adj',
  rough: 'adj',
  pair: 'noun',
}

function loadHighFreqPool(tierId, limit = 80) {
  const files = {
    beginner: '中考高频词-初级组.md',
    intermediate: '中考高频词-中级组.md',
    advanced: '中考高频词-高级组.md',
  }
  const filePath = path.resolve(__dirname, '../data', files[tierId] ?? files.beginner)
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

function buildPrompt(words, highFreq) {
  const wordLines = words
    .map((w) => `- ${w.word}（${POS_LABEL[w.pos]}，必须按此词性释义和造句）`)
    .join('\n')

  return `你是初中英语词汇编写专家，面向英语弱基础学生（北京中考）。

请为以下单词生成词汇数据。每个单词必须严格按指定词性释义和造句，不要用其他词性义项。

## 单词
${wordLines}

## 规则
1. meaning_zh：中文释义，≤20字，仅指定词性的最常考义项
2. example_en：6～10 个英文词，主谓宾/主系表简单句，一般现在时
3. example_zh：例句中文对照，自然简洁
4. 例句必须语法正确，及物/不及物用法准确
5. similar1~3：词形变化 > 固定搭配 > 易混词

## 熟词池
${highFreq || '（请使用初中常见词）'}

## 输出格式
只输出 JSON：
{"words":[{"word":"...","meaning_zh":"...","example_en":"...","example_zh":"...","similar1":"...","similar2":"...","similar3":"..."}]}
必须覆盖上述每个单词。`
}

async function callQwen(prompt) {
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
  if (!response.ok) throw new Error(payload.error?.message ?? `API 失败 (${response.status})`)
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('API 未返回内容')
  return JSON.parse(content)
}

function syncCache(db, words) {
  if (!fs.existsSync(CACHE_FILE)) return
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
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
  }
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`)
}

async function main() {
  if (!process.env.SERVERS_MD) {
    process.env.SERVERS_MD = path.join(os.homedir(), 'DEV/server/Servers.md')
  }

  const db = new DatabaseSync(DB_PATH)
  const updatePos = db.prepare('UPDATE words SET pos = ?, pos_label = ? WHERE word = ?')

  for (const [word, pos] of Object.entries(TARGET_POS)) {
    updatePos.run(pos, POS_LABEL[pos], word)
  }

  const rows = db
    .prepare(
      `SELECT id, word, pos, tier_id FROM words WHERE word IN (${Object.keys(TARGET_POS).map(() => '?').join(',')}) ORDER BY word`,
    )
    .all(...Object.keys(TARGET_POS))

  const tierId = rows[0]?.tier_id ?? 'beginner'
  const highFreq = loadHighFreqPool(tierId)
  const wordsForPrompt = rows.map((r) => ({ word: r.word, pos: r.pos }))

  console.log(`更新词性并生成 ${rows.length} 词...`)
  const result = await callQwen(buildPrompt(wordsForPrompt, highFreq))
  const byWord = new Map((result.words ?? []).map((e) => [e.word, e]))

  const updateContent = db.prepare(`
    UPDATE words SET meaning_zh=?, example_en=?, example_zh=?,
      similar1=?, similar2=?, similar3=? WHERE id=?
  `)

  for (const row of rows) {
    const entry = byWord.get(row.word)
    if (!entry?.meaning_zh || !entry?.example_en) {
      console.log(`FAIL ${row.word}: 生成结果无效`)
      continue
    }
    updateContent.run(
      entry.meaning_zh.trim(),
      entry.example_en.trim(),
      entry.example_zh?.trim() ?? '',
      entry.similar1?.trim() ?? '',
      entry.similar2?.trim() ?? '',
      entry.similar3?.trim() ?? '',
      row.id,
    )
    console.log(`${row.word}\t${POS_LABEL[row.pos]}\t${entry.meaning_zh}\t${entry.example_en}`)
  }

  syncCache(db, rows.map((r) => r.word))
  console.log('\n完成')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
