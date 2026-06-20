import { Hono } from 'hono'
import type { AdminUser } from '../adminAuth.js'
import { requireAdminAuth } from '../adminAuth.js'
import { getDb } from '../db.js'
import { buildRandomGroups } from '../lib/buildRandomGroups.js'
import { buildBeginnerThemeGroups } from '../lib/buildBeginnerThemeGroups.js'
import { clearGameGroups, mapWordRow, saveGameGroups } from '../lib/gameGroups.js'
import { generateAllThemePassages, generateThemePassage } from '../lib/generateThemePassage.js'
import { regenerateWordContent } from '../lib/regenerateWordContent.js'

type AppEnv = { Variables: { admin: AdminUser } }

export const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', requireAdminAuth)

adminRoutes.get('/game-settings', (c) => {
  return c.json({
    settings: [
      {
        id: 'vocab',
        label: '单词记忆',
        description: '大组选择与小组随机分组（名词40%·动词30%·其他30%）',
        available: true,
      },
      {
        id: 'graph',
        label: '函数图像',
        description: '函数图像训练参数（即将开放）',
        available: false,
      },
      {
        id: 'sign-training',
        label: '正负训练营',
        description: '正负号训练参数（即将开放）',
        available: false,
      },
    ],
  })
})

adminRoutes.get('/vocab/tier-groups', (c) => {
  const tierId = c.req.query('tierId')
  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)

  const db = getDb()
  const tier = db
    .prepare('SELECT id, label, word_count FROM tiers WHERE id = ?')
    .get(tierId) as { id: string; label: string; word_count: number } | undefined
  if (!tier) return c.json({ error: '大组不存在' }, 404)

  const groupRows = db
    .prepare(
      `
      SELECT tier_id, group_index, title, group_size, created_at, passage_en, passage_zh
      FROM game_tier_groups
      WHERE tier_id = ?
      ORDER BY group_index
      `,
    )
    .all(tierId) as Array<{
    tier_id: string
    group_index: number
    title: string
    group_size: number
    created_at: number
    passage_en: string
    passage_zh: string
  }>

  const assignmentRows = db
    .prepare(
      `
      SELECT w.*, a.group_index
      FROM game_word_assignments a
      INNER JOIN words w ON w.id = a.word_id
      WHERE a.tier_id = ?
      ORDER BY a.group_index, w.sort_order, w.id
      `,
    )
    .all(tierId) as Array<Record<string, unknown>>

  const wordsByGroup = new Map<number, ReturnType<typeof mapWordRow>[]>()
  for (const row of assignmentRows) {
    const groupIndex = Number(row.group_index)
    const mapped = mapWordRow(row)
    const bucket = wordsByGroup.get(groupIndex) ?? []
    bucket.push(mapped)
    wordsByGroup.set(groupIndex, bucket)
  }

  const groups = groupRows.map((row) => ({
    groupIndex: row.group_index,
    title: row.title,
    groupSize: row.group_size,
    passageEn: row.passage_en ?? '',
    passageZh: row.passage_zh ?? '',
    wordCount: wordsByGroup.get(row.group_index)?.length ?? 0,
    words: wordsByGroup.get(row.group_index) ?? [],
  }))

  const assignedCount = assignmentRows.length

  return c.json({
    tier: {
      id: tier.id,
      label: tier.label,
      wordCount: tier.word_count,
    },
    groupSize: groupRows[0]?.group_size ?? 8,
    groups,
    stats: {
      totalWords: tier.word_count,
      assignedWords: assignedCount,
      unassignedWords: Math.max(0, tier.word_count - assignedCount),
      groupCount: groups.length,
    },
  })
})

adminRoutes.post('/vocab/auto-group', async (c) => {
  const body = await c.req.json<{ tierId?: string; groupSize?: number }>()
  const tierId = body.tierId
  const groupSize = Number(body.groupSize ?? 8)

  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)
  if (!Number.isInteger(groupSize) || groupSize < 5 || groupSize > 10) {
    return c.json({ error: 'groupSize 必须是 5-10 的整数' }, 400)
  }

  const db = getDb()
  const tier = db.prepare('SELECT id FROM tiers WHERE id = ?').get(tierId) as { id: string } | undefined
  if (!tier) return c.json({ error: '大组不存在' }, 404)

  const words = db
    .prepare('SELECT id, pos FROM words WHERE tier_id = ? ORDER BY sort_order, id')
    .all(tierId) as Array<{ id: number; pos: string }>

  if (words.length === 0) return c.json({ error: '该大组暂无单词' }, 400)

  const groupWordIds = buildRandomGroups(words, groupSize)
  const now = Date.now()

  db.exec('BEGIN IMMEDIATE')
  try {
    const saved = saveGameGroups(
      db,
      tierId,
      groupWordIds.map((wordIds, index) => ({
        title: `第 ${index + 1} 组`,
        wordIds,
        groupSize,
      })),
    )

    db.exec('COMMIT')
    return c.json({
      ok: true,
      groupCount: saved.groupCount,
      wordCount: saved.wordCount,
      groupSize,
    })
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
})

adminRoutes.post('/vocab/theme-passages/generate', async (c) => {
  const body = await c.req.json<{ tierId?: string; force?: boolean }>()
  const tierId = body.tierId
  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)

  const db = getDb()
  const tier = db.prepare('SELECT id FROM tiers WHERE id = ?').get(tierId) as { id: string } | undefined
  if (!tier) return c.json({ error: '大组不存在' }, 404)

  const results = await generateAllThemePassages(db, tierId, {
    force: body.force === true,
    delayMs: 300,
  })

  return c.json({ ok: true, count: results.length, results })
})

adminRoutes.post('/vocab/theme-passages/:tierId/:groupIndex/regenerate', async (c) => {
  const tierId = c.req.param('tierId')
  const groupIndex = Number(c.req.param('groupIndex'))
  if (!tierId || !groupIndex) return c.json({ error: '参数无效' }, 400)

  const db = getDb()
  try {
    const result = await generateThemePassage(db, tierId, groupIndex, { force: true, preferLlm: true })
    return c.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : '短文生成失败'
    return c.json({ error: message }, 400)
  }
})

adminRoutes.post('/vocab/theme-group', async (c) => {
  const body = await c.req.json<{ tierId?: string }>()
  const tierId = body.tierId

  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)
  if (tierId !== 'beginner') {
    return c.json({ error: '场景分组目前仅支持初级组' }, 400)
  }

  const db = getDb()
  const tier = db.prepare('SELECT id FROM tiers WHERE id = ?').get(tierId) as { id: string } | undefined
  if (!tier) return c.json({ error: '大组不存在' }, 404)

  const words = db
    .prepare('SELECT id, word, pos FROM words WHERE tier_id = ? ORDER BY sort_order, id')
    .all(tierId) as Array<{ id: number; word: string; pos: string }>

  if (words.length === 0) return c.json({ error: '该大组暂无单词' }, 400)

  const themeGroups = buildBeginnerThemeGroups(words)

  db.exec('BEGIN IMMEDIATE')
  try {
    const saved = saveGameGroups(
      db,
      tierId,
      themeGroups.map((group) => ({
        title: group.title,
        wordIds: group.wordIds,
        groupSize: group.wordIds.length,
      })),
    )

    db.exec('COMMIT')
    return c.json({
      ok: true,
      groupCount: saved.groupCount,
      wordCount: saved.wordCount,
      groups: themeGroups.map((group) => ({
        title: group.title,
        wordCount: group.wordIds.length,
      })),
    })
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
})

adminRoutes.delete('/vocab/tier-groups', (c) => {
  const tierId = c.req.query('tierId')
  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)

  const db = getDb()
  db.exec('BEGIN IMMEDIATE')
  try {
    clearGameGroups(db, tierId)
    db.exec('COMMIT')
    return c.json({ ok: true })
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
})

const POS_LABEL: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adj: '形容词',
  adv: '副词',
  other: '其他',
}

const VALID_POS = new Set(Object.keys(POS_LABEL))

adminRoutes.patch('/vocab/words/:wordId', async (c) => {
  const wordId = Number(c.req.param('wordId'))
  if (!wordId) return c.json({ error: '无效的 wordId' }, 400)

  const body = await c.req.json<{
    meaningZh?: string
    exampleEn?: string
    exampleZh?: string
    pos?: string
  }>()

  const hasMeaning = typeof body.meaningZh === 'string'
  const hasExampleEn = typeof body.exampleEn === 'string'
  const hasExampleZh = typeof body.exampleZh === 'string'
  const hasPos = typeof body.pos === 'string'

  if (!hasMeaning && !hasExampleEn && !hasExampleZh && !hasPos) {
    return c.json({ error: '请提供 meaningZh、exampleEn、exampleZh 或 pos' }, 400)
  }

  if (hasMeaning && !body.meaningZh!.trim()) {
    return c.json({ error: '释义不能为空' }, 400)
  }

  if (hasPos && !VALID_POS.has(body.pos!)) {
    return c.json({ error: '无效的词性' }, 400)
  }

  const db = getDb()
  const existing = db
    .prepare('SELECT id FROM words WHERE id = ?')
    .get(wordId) as { id: number } | undefined
  if (!existing) return c.json({ error: '单词不存在' }, 404)

  const updates: string[] = []
  const values: string[] = []

  if (hasMeaning) {
    updates.push('meaning_zh = ?')
    values.push(body.meaningZh!.trim())
  }
  if (hasExampleEn) {
    updates.push('example_en = ?')
    values.push(body.exampleEn!.trim())
  }
  if (hasExampleZh) {
    updates.push('example_zh = ?')
    values.push(body.exampleZh!.trim())
  }
  if (hasPos) {
    updates.push('pos = ?', 'pos_label = ?')
    values.push(body.pos!, POS_LABEL[body.pos!] ?? '其他')
  }

  db.prepare(`UPDATE words SET ${updates.join(', ')} WHERE id = ?`).run(...values, wordId)

  const row = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as Record<string, unknown>
  return c.json({ word: mapWordRow(row) })
})

adminRoutes.post('/vocab/words/:wordId/regenerate', async (c) => {
  const wordId = Number(c.req.param('wordId'))
  if (!wordId) return c.json({ error: '无效的 wordId' }, 400)

  const db = getDb()
  const existing = db
    .prepare('SELECT id FROM words WHERE id = ?')
    .get(wordId) as { id: number } | undefined
  if (!existing) return c.json({ error: '单词不存在' }, 404)

  try {
    const word = await regenerateWordContent(db, wordId)
    return c.json({ word })
  } catch (error) {
    const message = error instanceof Error ? error.message : '重新生成失败'
    return c.json({ error: message }, 502)
  }
})
