/** 对比 qwen3.6-plus vs qwen3.7-plus 速度与质量 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildBlanksFromPassage,
  checkPassageVocabulary,
} from '../dist/lib/learning/wordHunterPassage.js'
import { loadQwenConfig, buildQwenChatUrl } from '../dist/lib/loadQwenApiKey.js'

const md = fs.readFileSync(
  process.env.SERVERS_MD || path.join(os.homedir(), 'DEV/server/Servers.md'),
  'utf8',
)
const qwenSection = md.match(/##\s*Qwen[\s\S]*?(?=\n##\s|$)/i)?.[0] ?? ''
const apiKey =
  qwenSection.match(/^(sk-[^\s\n]+)/m)?.[1]?.trim() ??
  qwenSection.match(/(sk-[A-Za-z0-9._\-]+)/)?.[1]
const baseUrl = (() => {
  const m = qwenSection.match(/OpenAI\s*兼容地址[^\n]*\n\s*(https?:\/\/[^\s\n]+)/i)
  return m ? m[1].trim() : loadQwenConfig().baseUrl
})()

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
  'ruler', 'book', 'blue', 'today', 'store', 'open', 'friend', 'class', 'student',
  'write', 'food', 'learn', 'teacher', 'paper', 'work', 'every', 'outdoor', 'field',
  'tree', 'park', 'home', 'pen', 'happy', 'good', 'day', 'time', 'people', 'help',
]

function buildPrompt() {
  const targetList = targetWords.map((w) => w.word).join(', ')
  return `写一段初中英文短文+中文翻译，JSON: {passageEn, passageZh}。
目标词各用原形且只出现一次：${targetList}
其他实词从：${allowedVocab.join(', ')}。不要挖空。`
}

async function testModel(model) {
  const t0 = Date.now()
  const res = await fetch(buildQwenChatUrl(baseUrl), {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: buildPrompt() }],
      temperature: 1,
      response_format: { type: 'json_object' },
      enable_thinking: false,
    }),
  })
  const json = await res.json()
  const ms = Date.now() - t0
  if (!res.ok) return { model, ms, error: JSON.stringify(json).slice(0, 150) }
  const raw = JSON.parse(json.choices[0].message.content)
  const blanked = buildBlanksFromPassage(raw.passageEn, targetWords)
  const allowed = new Set([...allowedVocab, ...targetWords.map((w) => w.word)])
  const check = blanked
    ? checkPassageVocabulary(blanked.passageEn.replace(/___/g, ' '), allowed)
    : { ratio: 1 }
  return {
    model,
    ms,
    ok: Boolean(blanked),
    oov: `${(check.ratio * 100).toFixed(0)}%`,
    en: blanked?.passageEn ?? raw.passageEn?.slice(0, 120),
  }
}

for (const model of ['qwen3.6-plus', 'qwen3.7-plus']) {
  const r = await testModel(model)
  console.log('\n===', model, '===')
  if (r.error) console.log(`${(r.ms / 1000).toFixed(1)}s FAIL`, r.error)
  else console.log(`${(r.ms / 1000).toFixed(1)}s`, r.ok ? '挖空OK' : '挖空FAIL', '超纲', r.oov, '\n', r.en)
}
