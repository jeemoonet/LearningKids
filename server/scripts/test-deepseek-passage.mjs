/**
 * 用生产同款 prompt 测试 DeepSeek 生成战前短文效果。
 * 运行：node server/scripts/test-deepseek-passage.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildBlanksFromPassage,
  checkPassageVocabulary,
} from '../dist/lib/learning/wordHunterPassage.js'

const md = fs.readFileSync(
  process.env.SERVERS_MD || path.join(os.homedir(), 'DEV/server/Servers.md'),
  'utf8',
)

const deepseekSection = md.match(/##\s*DeepSeek[\s\S]*?(?=\n##\s|$)/i)?.[0] ?? ''
const deepseekKey = deepseekSection.match(/sk-[0-9a-f]{32}/i)?.[0]
const qwenKey = md.match(/##\s*Qwen[\s\S]*?(?=\n##\s|$)/i)?.[0].match(/sk-[0-9a-f]{32}/)?.[0]

const targetWords = [
  { word: 'note', meaning: '笔记', pos: 'noun' },
  { word: 'sky', meaning: '天空', pos: 'noun' },
  { word: 'metal', meaning: '金属', pos: 'noun' },
  { word: 'tray', meaning: '托盘', pos: 'noun' },
  { word: 'until', meaning: '直到', pos: 'prep' },
  { word: 'activity', meaning: '活动', pos: 'noun' },
  { word: 'skill', meaning: '技能', pos: 'noun' },
  { word: 'human', meaning: '人类', pos: 'noun' },
  { word: 'picture', meaning: '图片', pos: 'noun' },
  { word: 'school', meaning: '学校', pos: 'noun' },
]

const allowedVocab = [
  'ruler', 'book', 'blue', 'today', 'like', 'store', 'open', 'friend', 'important',
  'story', 'class', 'english', 'talk', 'meaning', 'student', 'know', 'write', 'use',
  'carry', 'food', 'plastic', 'play', 'role', 'learn', 'find', 'teacher', 'show',
  'early', 'weather', 'water', 'drink', 'hot', 'cold', 'field', 'camp', 'join',
  'star', 'watch', 'night', 'dark', 'morning', 'day', 'time', 'people', 'work',
  'help', 'good', 'new', 'old', 'big', 'small', 'happy', 'love', 'want', 'need',
  'put', 'make', 'take', 'see', 'look', 'read', 'every', 'outdoor', 'paper',
  'sunny', 'rain', 'tree', 'park', 'home', 'room', 'table', 'chair', 'pen',
]

function buildProductionPrompt() {
  const wordLines = targetWords
    .map((w) => `- ${w.word} [${w.pos}] ${w.meaning}`)
    .join('\n')
  const targetList = targetWords.map((w) => w.word).join(', ')
  return `你是初中英语阅读老师，正在为"单词猎人"游戏即时生成一段【战前短文】，稍后由系统把目标单词挖空做完形填空。

## 必须用到的目标单词（共 ${targetWords.length} 个）
${wordLines}

## 允许使用的词库（实词只能从这里选，可做单复数 / 时态 / 比较级等词形变化）
${allowedVocab.join(', ')}

## 用词规则（非常重要）
1. 短文里出现的【实词】必须来自"目标单词"或"允许使用的词库"，可变形。
2. 冠词、介词、连词、be/助动词、代词等功能词可自由使用。
3. 人名可自拟，优先用 he/she/they。不要使用范围外生僻实词。

## 写作要求（务必遵守）
1. 写一段连贯、适合初中生的英文短文，围绕一个小场景展开。
2. 每个目标单词【必须使用原形、只出现一次】。目标词：${targetList}
3. 【正常写出所有单词，不要挖空、不要下划线、不要编号】。
4. 提供完整中文翻译。

## 只输出 JSON：{"passageEn":"...","passageZh":"..."}`
}

function buildAllowedSet() {
  const allowed = new Set(allowedVocab.map((w) => w.toLowerCase()))
  for (const w of targetWords) allowed.add(w.word.toLowerCase())
  return allowed
}

async function callOpenAI({ url, key, model, extra = {} }) {
  const t0 = Date.now()
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: buildProductionPrompt() }],
      temperature: 1,
      response_format: { type: 'json_object' },
      ...extra,
    }),
  })
  const json = await res.json()
  const ms = Date.now() - t0
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 250)}`)
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('无内容')
  return { ms, raw: JSON.parse(content) }
}

async function evaluate(label, fn) {
  console.log(`\n========== ${label} ==========`)
  try {
    const { ms, raw } = await fn()
    const blanked = buildBlanksFromPassage(raw.passageEn, targetWords)
    const allowed = buildAllowedSet()
    const check = blanked
      ? checkPassageVocabulary(blanked.passageEn.replace(/___/g, ' '), allowed)
      : { ratio: 1, oov: ['N/A'] }

    console.log(`耗时: ${(ms / 1000).toFixed(1)}s`)
    if (!blanked) {
      console.log('挖空: 失败（目标词未全部恰好出现一次）')
      console.log('原文:', raw.passageEn)
    } else {
      const blanks = blanked.passageEn.split('___').length - 1
      console.log(`挖空: ${blanks}/10  超纲率: ${(check.ratio * 100).toFixed(1)}%  超纲词: ${check.oov.join(', ') || '无'}`)
      console.log('挖空后:', blanked.passageEn)
      console.log('答案顺序:', blanked.answers.join(', '))
    }
    console.log('中文:', raw.passageZh)
    return { label, sec: (ms / 1000).toFixed(1), ok: Boolean(blanked), oov: `${(check.ratio * 100).toFixed(1)}%` }
  } catch (err) {
    console.log(`[失败] ${err.message}`)
    return { label, status: 'error', err: err.message }
  }
}

const cases = []

if (deepseekKey) {
  cases.push([
    'DeepSeek (deepseek-v4-flash)',
    () =>
      callOpenAI({
        url: 'https://api.deepseek.com/v1/chat/completions',
        key: deepseekKey,
        model: 'deepseek-v4-flash',
      }),
  ])
  cases.push([
    'DeepSeek (deepseek-v4-pro)',
    () =>
      callOpenAI({
        url: 'https://api.deepseek.com/v1/chat/completions',
        key: deepseekKey,
        model: 'deepseek-v4-pro',
      }),
  ])
  // 兼容旧模型名，便于对比
  cases.push([
    'DeepSeek (deepseek-chat 对照)',
    () =>
      callOpenAI({
        url: 'https://api.deepseek.com/v1/chat/completions',
        key: deepseekKey,
        model: 'deepseek-chat',
      }),
  ])
} else {
  console.log('未找到 DeepSeek API Key')
}

if (qwenKey) {
  cases.push([
    'Qwen (qwen3.6-plus 对照)',
    () =>
      callOpenAI({
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        key: qwenKey,
        model: 'qwen3.6-plus',
        extra: { enable_thinking: false },
      }),
  ])
}

const summary = []
for (const [label, fn] of cases) {
  summary.push(await evaluate(label, fn))
}

console.log('\n\n================ 汇总 ================')
console.table(summary)
