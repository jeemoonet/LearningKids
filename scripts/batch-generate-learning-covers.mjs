/**
 * 批量重新生成「学习」场景小组配图（默认跳过 group 2）
 *
 * 用法:
 *   node scripts/batch-generate-learning-covers.mjs
 *   node scripts/batch-generate-learning-covers.mjs --groups 1,3,4
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { buildGroupCoverPrompt, groupCoverMetaFromGroup } from '../server/dist/lib/groupCoverPrompt.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const tierId = 'beginner'
const skipDefault = new Set([2])
const pyScript = join(
  process.env.USERPROFILE ?? '',
  '.agents/skills/autoglm-generate-image/generate-image.py',
)

const groupsArg = process.argv.find((a) => a.startsWith('--groups='))
const groupList = groupsArg
  ? groupsArg
      .slice('--groups='.length)
      .split(',')
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
  : [1, 3, 4, 5, 6, 7, 8, 9, 10]

const db = new DatabaseSync(join(root, 'server/data/app.db'))

function loadMeta(groupIndex) {
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

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function generateViaAutoGlm(prompt) {
  if (!existsSync(pyScript)) {
    throw new Error(`找不到 AutoGLM 脚本: ${pyScript}`)
  }
  const stdout = execFileSync('python', [pyScript, prompt], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  const result = JSON.parse(stdout)
  if (result.code !== 0 || !result.data?.image_url) {
    throw new Error(result.msg ?? JSON.stringify(result).slice(0, 300))
  }
  return result.data.image_url
}

function downloadImage(url, outFile) {
  execFileSync(
    'curl',
    ['-sS', '-L', url, '-o', outFile],
    { encoding: 'utf8' },
  )
}

async function main() {
  const outDir = join(root, 'src/public/images/vocab-groups', tierId)
  mkdirSync(outDir, { recursive: true })

  const results = []
  for (const groupIndex of groupList) {
    if (!groupsArg && skipDefault.has(groupIndex)) {
      console.log(`跳过 ${groupIndex}（已保留现有配图）`)
      continue
    }

    const meta = loadMeta(groupIndex)
    const prompt = buildGroupCoverPrompt(meta)
    const outFile = join(outDir, `${groupIndex}.png`)

    console.log(`\n[${groupIndex}] ${meta.title}`)
    console.log(`单词: ${meta.words.map((w) => `${w.word}(${w.pos})`).join(', ')}`)
    console.log('生成中...')

    try {
      const imageUrl = generateViaAutoGlm(prompt)
      downloadImage(imageUrl, outFile)
      const size = readFileSync(outFile).length
      console.log(`已保存: ${outFile} (${size} bytes)`)
      results.push({ groupIndex, title: meta.title, ok: true })
      sleep(3000)
    } catch (err) {
      console.error(`失败: ${err.message}`)
      results.push({ groupIndex, title: meta.title, ok: false, error: err.message })
    }
  }

  execFileSync('node', ['scripts/sync-group-cover-manifest.mjs'], { cwd: root, stdio: 'inherit' })

  const ok = results.filter((r) => r.ok).length
  console.log(`\n完成: ${ok}/${results.length} 张`)
  if (ok < results.length) process.exit(1)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
