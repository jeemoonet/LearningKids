/**
 * 扫描 src/public/images/vocab-groups/{tierId}/*.png，同步 covers.json 与 src/data/vocabGroupCovers.json
 *
 * 用法: node scripts/sync-group-cover-manifest.mjs
 */

import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = 'src/public/images/vocab-groups'
const tiers = existsSync(root)
  ? readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : []

const manifest = {}

for (const tierId of tiers) {
  const dir = join(root, tierId)
  const indices = readdirSync(dir)
    .filter((name) => /^\d+\.png$/i.test(name))
    .map((name) => Number(name.replace(/\.png$/i, '')))
    .filter((index) => Number.isInteger(index) && index > 0)
    .sort((a, b) => a - b)
  if (indices.length > 0) manifest[tierId] = indices
}

const json = `${JSON.stringify(manifest, null, 2)}\n`
writeFileSync(join(root, 'covers.json'), json, 'utf8')
writeFileSync('src/data/vocabGroupCovers.json', json, 'utf8')
console.log('Synced group cover manifest:', manifest)
