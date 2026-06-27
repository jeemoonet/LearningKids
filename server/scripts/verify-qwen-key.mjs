/** 验证更新后的 Qwen Key + Qwen→DeepSeek 降级链路 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateBattlePassage } from '../dist/lib/learning/wordHunterPassage.js'

const md = fs.readFileSync(
  process.env.SERVERS_MD || path.join(os.homedir(), 'DEV/server/Servers.md'),
  'utf8',
)
const qwenSection = md.match(/##\s*Qwen[\s\S]*?(?=\n##\s|$)/i)?.[0] ?? ''
const qwenKey = qwenSection.match(/sk-[0-9a-f]{32}/i)?.[0]
console.log('Qwen Key:', qwenKey ? `${qwenKey.slice(0, 8)}…${qwenKey.slice(-4)}` : '未找到')

const words = [
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

const allowed = [
  'ruler', 'book', 'blue', 'today', 'store', 'open', 'friend', 'class', 'student',
  'write', 'food', 'learn', 'teacher', 'paper', 'work', 'every', 'outdoor', 'field',
  'tree', 'park', 'home', 'pen', 'happy', 'good', 'day', 'time', 'people', 'help',
  'make', 'take', 'see', 'look', 'read', 'join', 'watch', 'night', 'morning', 'hot',
  'cold', 'water', 'carry', 'play', 'find', 'show', 'early', 'weather', 'important',
  'story', 'english', 'talk', 'meaning', 'know', 'use', 'plastic', 'role', 'star',
]

for (let i = 1; i <= 2; i += 1) {
  const t0 = Date.now()
  try {
    const r = await generateBattlePassage(words, allowed)
    const ms = Date.now() - t0
    const blanks = r.passageEn.split('___').length - 1
    console.log(`\n#${i} 成功 ${(ms / 1000).toFixed(1)}s  空位${blanks}/10`)
    console.log('英文:', r.passageEn)
    console.log('中文:', r.passageZh)
    console.log('答案:', r.answers.join(', '))
  } catch (e) {
    console.log(`\n#${i} 失败 ${((Date.now() - t0) / 1000).toFixed(1)}s`, e.message)
  }
}

// 单独探测 Qwen 原始响应（确认是否仍走 DeepSeek）
import { getLlmProviders } from '../dist/lib/llmJsonChat.js'
const providers = getLlmProviders()
console.log('\n可用提供商:', providers.map((p) => p.label).join(' → '))

const prompt = '返回JSON: {"ok":true,"provider":"test"}'
for (const p of providers) {
  const t0 = Date.now()
  try {
    const content = await p.call(prompt)
    console.log(`\n[${p.label}] ${((Date.now() - t0) / 1000).toFixed(1)}s OK`, content.slice(0, 80))
  } catch (e) {
    console.log(`\n[${p.label}] ${((Date.now() - t0) / 1000).toFixed(1)}s FAIL`, e.message.slice(0, 120))
  }
}
