/**
 * 使用 Google Gemini（Nano Banana）生成单词小组配图
 * 备选方案；默认出图方式见 DOC-DEV-002 §6.1（Cursor GenerateImage）。
 *
 * 用法:
 *   node scripts/generate-group-cover-gemini.mjs beginner 11
 *   node scripts/generate-group-cover-gemini.mjs beginner 11 --sync
 *
 * API Key 优先级: GEMINI_API_KEY 环境变量 > Servers.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { buildGroupCoverPrompt, groupCoverMetaFromGroup } from '../server/dist/lib/groupCoverPrompt.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const tierId = process.argv[2]
const groupIndexArg = process.argv[3]
const shouldSync = process.argv.includes('--sync')
const serversMd = process.env.SERVERS_MD ?? 'd:\\Dev\\server\\Servers.md'
const defaultProxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY ?? 'http://127.0.0.1:7897'

function readModelFromServers() {
  if (!existsSync(serversMd)) return 'gemini-3.1-flash-image-preview'
  const text = readFileSync(serversMd, 'utf8')
  const match = text.match(/图片生成模型[：:]\s*(\S+)/)
  return match?.[1] ?? 'gemini-3.1-flash-image-preview'
}

const model = process.env.GEMINI_IMAGE_MODEL ?? readModelFromServers()

if (!tierId || !groupIndexArg) {
  console.error('用法: node scripts/generate-group-cover-gemini.mjs <tierId> <groupIndex> [--sync]')
  process.exit(1)
}

const groupIndex = Number(groupIndexArg)
if (!Number.isInteger(groupIndex) || groupIndex < 1) {
  console.error('groupIndex 必须是正整数')
  process.exit(1)
}

function loadApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim()
  if (!existsSync(serversMd)) {
    throw new Error(`未设置 GEMINI_API_KEY，且找不到 ${serversMd}`)
  }
  const text = readFileSync(serversMd, 'utf8')
  const match = text.match(/## Google Gemini[\s\S]*?API KEY[：:]\s*(\S+)/i)
  if (!match) throw new Error('在 Servers.md 中未找到 Gemini API KEY')
  return match[1].trim()
}

function loadGroupMeta() {
  const db = new DatabaseSync(join(root, 'server/data/app.db'))
  const group = db
    .prepare('SELECT group_index, title FROM game_tier_groups WHERE tier_id = ? AND group_index = ?')
    .get(tierId, groupIndex)
  if (!group) throw new Error(`未找到 ${tierId} 第 ${groupIndex} 组`)

  const words = db
    .prepare(
      `SELECT w.word, w.pos FROM game_word_assignments a
       JOIN words w ON w.id = a.word_id
       WHERE a.tier_id = ? AND a.group_index = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(tierId, groupIndex)

  return groupCoverMetaFromGroup(tierId, groupIndex, group.title, words)
}

async function generateImage(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '16:9' },
    },
  }

  const proxy = defaultProxy
  const tmpJson = join(root, 'scripts', `.gemini-req-${groupIndex}.json`)
  const tmpOut = join(root, 'scripts', `.gemini-res-${groupIndex}.json`)
  writeFileSync(tmpJson, JSON.stringify(body), 'utf8')

  const curlArgs = [
    '-sS',
    '-X', 'POST',
    url,
    '-H', 'Content-Type: application/json',
    '-H', `x-goog-api-key: ${apiKey}`,
    '--data-binary', `@${tmpJson}`,
    '-o', tmpOut,
    '-w', '%{http_code}',
  ]
  if (proxy) curlArgs.splice(1, 0, '-x', proxy)

  const status = execFileSync('curl', curlArgs, { encoding: 'utf8' }).trim()
  const data = JSON.parse(readFileSync(tmpOut, 'utf8'))

  if (status !== '200') {
    const msg = data.error?.message ?? JSON.stringify(data)
    if (status === '429' && /limit:\s*0/i.test(msg)) {
      throw new Error(
        `Gemini 图像模型免费配额为 0，需在 Google AI Studio 开通计费后重试。\n${msg.slice(0, 200)}`,
      )
    }
    throw new Error(`Gemini API ${status}: ${msg}`)
  }

  const parts = data.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data
    if (inline?.data) {
      return Buffer.from(inline.data, 'base64')
    }
  }

  throw new Error(`响应中无图片: ${JSON.stringify(data).slice(0, 500)}`)
}

async function main() {
  const apiKey = loadApiKey()
  const meta = loadGroupMeta()
  const prompt = buildGroupCoverPrompt(meta)
  const outDir = join(root, 'src/public/images/vocab-groups', tierId)
  const outFile = join(outDir, `${groupIndex}.png`)

  console.log(`# ${meta.title} (${meta.words.length} words)`)
  console.log(`单词: ${meta.words.map((w) => `${w.word}(${w.pos})`).join(', ')}`)
  console.log(`模型: ${model}`)
  console.log(`生成中...`)

  mkdirSync(outDir, { recursive: true })
  const imageBuffer = await generateImage(apiKey, prompt)
  writeFileSync(outFile, imageBuffer)

  console.log(`已保存: ${outFile} (${imageBuffer.length} bytes)`)

  if (shouldSync) {
    const { execSync } = await import('node:child_process')
    execSync('node scripts/sync-group-cover-manifest.mjs', { cwd: root, stdio: 'inherit' })
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
