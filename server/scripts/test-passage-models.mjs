/**
 * 对比测试 Servers.md 里各大模型生成"战前完形填空"的速度与质量。
 * 运行：node server/scripts/test-passage-models.mjs
 * Key 从 ~/DEV/server/Servers.md 实时读取，不硬编码。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// ── 读取 Servers.md，按 ## 分段提取各模型 Key ──
function loadServersMd() {
  const candidates = [
    process.env.SERVERS_MD,
    path.join(os.homedir(), 'DEV/server/Servers.md'),
  ].filter(Boolean)
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  }
  throw new Error('找不到 Servers.md')
}

function sectionText(md, heading) {
  const re = new RegExp(`##\\s*${heading}[\\s\\S]*?(?=\\n##\\s|$)`, 'i')
  return md.match(re)?.[0] ?? ''
}

const md = loadServersMd()
const minimaxKey = sectionText(md, 'Minimax').match(/sk-[A-Za-z0-9\-_]{20,}/)?.[0]
const geminiKey = sectionText(md, 'Gemini').match(/AIza[A-Za-z0-9_\-]+/)?.[0]
const qwenKey = sectionText(md, 'Qwen').match(/sk-[0-9a-f]{32}/)?.[0]
const deepseekKey = sectionText(md, 'DeepSeek').match(/sk-[0-9a-f]{32}/)?.[0]

// ── 测试数据：10 个目标词 + 允许词库 ──
const targetWords = [
  { word: 'note', meaning: '笔记', pos: 'noun', squad: 'recent' },
  { word: 'sky', meaning: '天空', pos: 'noun', squad: 'recent' },
  { word: 'metal', meaning: '金属', pos: 'noun', squad: 'recent' },
  { word: 'tray', meaning: '托盘', pos: 'noun', squad: 'recent' },
  { word: 'until', meaning: '直到', pos: 'prep', squad: 'recent' },
  { word: 'activity', meaning: '活动', pos: 'noun', squad: 'recommended' },
  { word: 'skill', meaning: '技能', pos: 'noun', squad: 'recommended' },
  { word: 'human', meaning: '人类', pos: 'noun', squad: 'recommended' },
  { word: 'picture', meaning: '图片', pos: 'noun', squad: 'recommended' },
  { word: 'school', meaning: '学校', pos: 'noun', squad: 'recommended' },
]

const allowedVocab = [
  'ruler', 'book', 'blue', 'today', 'like', 'store', 'open', 'friend', 'important',
  'story', 'class', 'english', 'talk', 'meaning', 'student', 'know', 'write', 'use',
  'carry', 'food', 'plastic', 'play', 'role', 'learn', 'find', 'teacher', 'show',
  'early', 'weather', 'water', 'drink', 'hot', 'cold', 'field', 'camp', 'join',
  'star', 'watch', 'night', 'dark', 'morning', 'day', 'time', 'people', 'work',
  'help', 'good', 'new', 'old', 'big', 'small', 'happy', 'love', 'want', 'need',
  'put', 'make', 'take', 'see', 'look', 'read', 'every', 'outdoor', 'paper',
]

const BASE_FUNCTION = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'some', 'any', 'no', 'every',
  'each', 'all', 'one', 'two', 'three', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did',
  'have', 'has', 'had', 'will', 'would', 'can', 'could', 'may', 'might', 'must',
  'in', 'on', 'at', 'to', 'of', 'for', 'with', 'from', 'by', 'as', 'about', 'into',
  'up', 'down', 'out', 'after', 'before', 'and', 'or', 'but', 'so', 'because', 'if',
  'when', 'while', 'then', 'than', 'also', 'too', 'very', 'just', 'not', 'here',
  'there', 'now', 'today', 'again',
])

const BLANK = '___'

function buildPrompt() {
  const wordLines = targetWords
    .map((w) => `- ${w.word} [${w.pos}] ${w.meaning}`)
    .join('\n')
  return `你是初中英语阅读老师，正在为"单词猎人"游戏即时生成一段【战前短文完形填空】。

## 必须用到的目标单词（共 ${targetWords.length} 个，全部要挖空）
${wordLines}

## 允许使用的词库（实词只能从这里选，可做单复数 / 时态 / 比较级等词形变化）
${allowedVocab.join(', ')}

## 用词规则
1. 短文里出现的实词必须来自"目标单词"或"允许使用的词库"，可变形。
2. 冠词、介词、连词、be/助动词、代词等功能词可自由使用。
3. 人名可自拟，优先用 he / she / they。不要使用范围外生僻实词。

## 要求
1. 写一段连贯、适合初中生的英文短文，每个目标单词只出现一次，位置写成 "${BLANK}"。
2. 提供完整中文翻译。
3. answers 按 "${BLANK}" 出现顺序列出目标单词原形。

## 严格输出 JSON（不要 markdown）
{"passageEn":"...","passageZh":"...","answers":["word1"]}`
}

// ── 质量校验：超纲率、空位数、答案覆盖 ──
function stripJsonFence(s) {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
}

function check(result) {
  const allowed = new Set([...BASE_FUNCTION, ...allowedVocab, ...targetWords.map((w) => w.word)])
  const text = result.passageEn || ''
  const blanks = text.split(BLANK).length - 1
  const tokens = text
    .replace(new RegExp(BLANK, 'g'), ' ')
    .replace(/[^A-Za-z'\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[-']+|[-']+$/g, ''))
    .filter(Boolean)
  let oov = 0
  const oovWords = new Set()
  for (const raw of tokens) {
    const w = raw.toLowerCase()
    if (allowed.has(w)) continue
    if (/^[A-Z]/.test(raw)) continue
    const bases = [w, w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ed$/, ''),
      w.replace(/d$/, ''), w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/ies$/, 'y')]
    if (bases.some((b) => allowed.has(b))) continue
    oov += 1
    oovWords.add(w)
  }
  const answers = Array.isArray(result.answers) ? result.answers.map((a) => String(a).toLowerCase()) : []
  const targetSet = new Set(targetWords.map((w) => w.word))
  const missing = [...targetSet].filter((w) => !answers.includes(w))
  return {
    blanks,
    totalTokens: tokens.length,
    oovRatio: tokens.length ? oov / tokens.length : 1,
    oovWords: [...oovWords],
    answersOk: blanks === answers.length && missing.length === 0,
    missing,
  }
}

// ── OpenAI 兼容调用 ──
async function callOpenAI({ url, key, model, extraHeaders = {}, useJsonFormat = true }) {
  const body = {
    model,
    messages: [{ role: 'user', content: buildPrompt() }],
    temperature: 1,
  }
  if (useJsonFormat) body.response_format = { type: 'json_object' }
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`)
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error(`无内容: ${JSON.stringify(json).slice(0, 200)}`)
  return JSON.parse(stripJsonFence(content))
}

// ── Gemini 调用 ──
async function callGemini({ key, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt() }] }],
      generationConfig: { temperature: 1, responseMimeType: 'application/json' },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`)
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error(`无内容: ${JSON.stringify(json).slice(0, 200)}`)
  return JSON.parse(stripJsonFence(content))
}

const MODELS = [
  {
    label: 'MiniMax (MiniMax-M2.7-highspeed)',
    run: () => callOpenAI({
      url: 'https://api.minimaxi.com/v1/chat/completions',
      key: minimaxKey,
      model: 'MiniMax-M2.7-highspeed',
    }),
    enabled: Boolean(minimaxKey),
  },
  {
    label: 'Gemini (gemini-2.5-flash)',
    run: () => callGemini({ key: geminiKey, model: 'gemini-2.5-flash' }),
    enabled: Boolean(geminiKey),
  },
  {
    label: 'Qwen (qwen3.6-plus)',
    run: () => callOpenAI({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      key: qwenKey,
      model: 'qwen3.6-plus',
    }),
    enabled: Boolean(qwenKey),
  },
  {
    label: 'DeepSeek (deepseek-v4-flash)',
    run: () => callOpenAI({
      url: 'https://api.deepseek.com/v1/chat/completions',
      key: deepseekKey,
      model: 'deepseek-v4-flash',
    }),
    enabled: Boolean(deepseekKey),
  },
]

async function main() {
  console.log('目标词:', targetWords.map((w) => w.word).join(', '))
  console.log('允许词库:', allowedVocab.length, '词 + 功能词\n')
  const summary = []
  for (const m of MODELS) {
    if (!m.enabled) {
      console.log(`\n========== ${m.label} ==========\n[跳过] 未找到 API Key`)
      summary.push({ model: m.label, status: 'no-key' })
      continue
    }
    console.log(`\n========== ${m.label} ==========`)
    const t0 = Date.now()
    try {
      const result = await m.run()
      const ms = Date.now() - t0
      const c = check(result)
      console.log(`耗时: ${(ms / 1000).toFixed(1)}s`)
      console.log(`空位: ${c.blanks}/10  答案覆盖: ${c.answersOk ? 'OK' : '缺失 ' + c.missing.join(',')}`)
      console.log(`超纲率: ${(c.oovRatio * 100).toFixed(1)}%  超纲词: ${c.oovWords.join(', ') || '无'}`)
      console.log(`英文: ${result.passageEn}`)
      console.log(`中文: ${result.passageZh}`)
      summary.push({
        model: m.label,
        sec: (ms / 1000).toFixed(1),
        oov: (c.oovRatio * 100).toFixed(1) + '%',
        answersOk: c.answersOk,
        status: 'ok',
      })
    } catch (err) {
      const ms = Date.now() - t0
      console.log(`耗时: ${(ms / 1000).toFixed(1)}s  [失败] ${err.message}`)
      summary.push({ model: m.label, sec: (ms / 1000).toFixed(1), status: 'error', err: err.message })
    }
  }
  console.log('\n\n================ 汇总 ================')
  console.table(summary)
}

main()
