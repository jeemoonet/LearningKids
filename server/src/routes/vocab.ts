import { Hono } from 'hono'
import fs from 'node:fs'
import type { AuthUser } from '../auth.js'
import { getUserFromSession, requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { hasGameGroups, mapWordRow } from '../lib/gameGroups.js'
import { getOrCreatePassageAudio } from '../lib/passageAudioCache.js'

type AppEnv = { Variables: { user: AuthUser } }

export const vocabRoutes = new Hono<AppEnv>()

vocabRoutes.get('/tiers', (c) => {
  const rows = getDb()
    .prepare('SELECT id, label, word_count, group_count, group_size FROM tiers ORDER BY rowid')
    .all() as Array<{
    id: string
    label: string
    word_count: number
    group_count: number
    group_size: number
  }>

  return c.json({
    tiers: rows.map((row) => ({
      id: row.id,
      label: row.label,
      wordCount: row.word_count,
      groupCount: row.group_count,
      groupSize: row.group_size,
    })),
  })
})

vocabRoutes.get('/groups', requireAuth, (c) => {
  const tierId = c.req.query('tierId')
  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)

  const db = getDb()
  const userId = c.get('user').id

  if (hasGameGroups(db, tierId)) {
    const rows = db
      .prepare(
        `
        SELECT g.tier_id, g.group_index, g.title, g.passage_en, g.passage_zh,
               COUNT(a.word_id) AS word_count
        FROM game_tier_groups g
        LEFT JOIN game_word_assignments a
          ON a.tier_id = g.tier_id
          AND a.group_index = g.group_index
        WHERE g.tier_id = ?
        GROUP BY g.tier_id, g.group_index
        ORDER BY g.group_index
        `,
      )
      .all(tierId) as Array<{
      tier_id: string
      group_index: number
      title: string
      passage_en: string
      passage_zh: string
      word_count: number
    }>

    return c.json({
      groups: rows.map((row) => ({
        id: row.group_index,
        tierId: row.tier_id,
        groupIndex: row.group_index,
        theme: '',
        title: row.title,
        passageEn: row.passage_en ?? '',
        passageZh: row.passage_zh ?? '',
        wordCount: row.word_count,
        source: 'game',
      })),
      hasGameGroups: true,
    })
  }

  const rows = db
    .prepare(
      `
      SELECT g.tier_id, g.group_index, g.title, COUNT(a.word_id) AS word_count
      FROM user_tier_groups g
      LEFT JOIN user_word_assignments a
        ON a.user_id = g.user_id
        AND a.tier_id = g.tier_id
        AND a.group_index = g.group_index
      WHERE g.user_id = ? AND g.tier_id = ?
      GROUP BY g.tier_id, g.group_index
      ORDER BY g.group_index
      `,
    )
    .all(userId, tierId) as Array<{
    tier_id: string
    group_index: number
    title: string
    word_count: number
  }>

  return c.json({
    groups: rows.map((row) => ({
      id: row.group_index,
      tierId: row.tier_id,
      groupIndex: row.group_index,
      theme: '',
      title: row.title,
      wordCount: row.word_count,
      source: 'user',
    })),
    hasGameGroups: false,
  })
})

vocabRoutes.get('/words', (c) => {
  const tierId = c.req.query('tierId')
  const groupIndexRaw = c.req.query('groupIndex')
  const groupIndex = groupIndexRaw ? Number(groupIndexRaw) : 0

  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)

  const db = getDb()
  const user = getUserFromSession(c)

  let rows: Array<Record<string, unknown>>

  if (groupIndex > 0) {
    if (!user) return c.json({ error: '请先登录' }, 401)
    if (hasGameGroups(db, tierId)) {
      rows = db
        .prepare(
          `
          SELECT w.* FROM words w
          INNER JOIN game_word_assignments a ON a.word_id = w.id
          WHERE a.tier_id = ? AND a.group_index = ?
          ORDER BY w.sort_order, w.id
          `,
        )
        .all(tierId, groupIndex) as Array<Record<string, unknown>>
    } else {
      rows = db
        .prepare(
          `
          SELECT w.* FROM words w
          INNER JOIN user_word_assignments a ON a.word_id = w.id
          WHERE a.user_id = ? AND a.tier_id = ? AND a.group_index = ?
          ORDER BY w.sort_order, w.id
          `,
        )
        .all(user.id, tierId, groupIndex) as Array<Record<string, unknown>>
    }
  } else {
    rows = db
      .prepare('SELECT * FROM words WHERE tier_id = ? ORDER BY sort_order, id')
      .all(tierId) as Array<Record<string, unknown>>
  }

  const corrections = user
    ? loadCorrectionsForWords(db, user.id, rows.map((row) => Number(row.id)))
    : new Map()

  return c.json({
    words: rows.map((row) => applyCorrection(mapWordRow(row), corrections.get(Number(row.id)))),
  })
})

vocabRoutes.put('/words/:wordId', requireAuth, async (c) => {
  const userId = c.get('user').id
  const wordId = Number(c.req.param('wordId'))
  if (!wordId) return c.json({ error: '无效的 wordId' }, 400)

  const body = await c.req.json<{ word?: string; meaningZh?: string }>()
  const hasWord = typeof body.word === 'string'
  const hasMeaning = typeof body.meaningZh === 'string'
  if (!hasWord && !hasMeaning) {
    return c.json({ error: '请提供 word 或 meaningZh' }, 400)
  }

  const db = getDb()
  const existing = db
    .prepare('SELECT id FROM words WHERE id = ?')
    .get(wordId) as { id: number } | undefined
  if (!existing) return c.json({ error: '单词不存在' }, 404)

  const current = db
    .prepare('SELECT word, meaning_zh FROM user_word_corrections WHERE user_id = ? AND word_id = ?')
    .get(userId, wordId) as { word: string | null; meaning_zh: string | null } | undefined

  const nextWord = hasWord ? body.word!.trim() : current?.word ?? null
  const nextMeaning = hasMeaning ? body.meaningZh!.trim() : current?.meaning_zh ?? null

  db.prepare(
    `
    INSERT INTO user_word_corrections (user_id, word_id, word, meaning_zh, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word_id) DO UPDATE SET
      word = COALESCE(excluded.word, user_word_corrections.word),
      meaning_zh = COALESCE(excluded.meaning_zh, user_word_corrections.meaning_zh),
      updated_at = excluded.updated_at
    `,
  ).run(userId, wordId, nextWord, nextMeaning, Date.now())

  const base = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as Record<string, unknown>
  const correction = db
    .prepare('SELECT word, meaning_zh FROM user_word_corrections WHERE user_id = ? AND word_id = ?')
    .get(userId, wordId) as { word: string | null; meaning_zh: string | null }

  return c.json({ word: applyCorrection(mapWordRow(base), correction) })
})

vocabRoutes.get('/quiz-options', (c) => {
  const wordId = Number(c.req.query('wordId'))
  const tierId = c.req.query('tierId')
  const groupIndex = Number(c.req.query('groupIndex'))
  const distractorCount = 3

  if (!wordId || !tierId) return c.json({ error: '缺少 wordId 或 tierId' }, 400)

  const db = getDb()
  const user = getUserFromSession(c)
  const word = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as Record<string, unknown> | undefined
  if (!word) return c.json({ error: '单词不存在' }, 404)

  const mapped = applyCorrection(
    mapWordRow(word),
    getCorrectionForWord(db, user?.id ?? null, wordId),
  )
  const used = new Set<string>([mapped.meaningZh])
  const distractors: string[] = []

  const randomRows = db
    .prepare(
      `
      SELECT meaning_zh FROM words
      WHERE tier_id = ? AND id != ? AND meaning_zh != ''
      ORDER BY RANDOM()
      LIMIT ?
      `,
    )
    .all(mapped.tierId, wordId, distractorCount * 3) as Array<{ meaning_zh: string }>

  for (const row of randomRows) {
    if (!row.meaning_zh || used.has(row.meaning_zh)) continue
    used.add(row.meaning_zh)
    distractors.push(row.meaning_zh)
    if (distractors.length >= distractorCount) break
  }

  if (distractors.length < distractorCount && user && groupIndex > 0) {
    const groupRows = hasGameGroups(db, tierId)
      ? (db
          .prepare(
            `
            SELECT w.meaning_zh FROM words w
            INNER JOIN game_word_assignments a ON a.word_id = w.id
            WHERE a.tier_id = ? AND a.group_index = ? AND w.id != ? AND w.meaning_zh != ''
            `,
          )
          .all(tierId, groupIndex, wordId) as Array<{ meaning_zh: string }>)
      : (db
          .prepare(
            `
            SELECT w.meaning_zh FROM words w
            INNER JOIN user_word_assignments a ON a.word_id = w.id
            WHERE a.user_id = ? AND a.tier_id = ? AND a.group_index = ? AND w.id != ? AND w.meaning_zh != ''
            `,
          )
          .all(user.id, tierId, groupIndex, wordId) as Array<{ meaning_zh: string }>)

    for (const row of groupRows.sort(() => Math.random() - 0.5)) {
      if (!row.meaning_zh || used.has(row.meaning_zh)) continue
      used.add(row.meaning_zh)
      distractors.push(row.meaning_zh)
      if (distractors.length >= distractorCount) break
    }
  }

  const options = [
    { id: mapped.id, label: mapped.meaningZh || mapped.word, isCorrect: true },
    ...distractors.slice(0, distractorCount).map((meaning, index) => ({
      id: mapped.id * 100 + index + 1,
      label: meaning,
      isCorrect: false,
    })),
  ]

  return c.json({ options })
})

/** 小组场景短文 TTS（百炼 Qwen-TTS，本地缓存） */
vocabRoutes.get('/passage-audio', requireAuth, async (c) => {
  const tierId = c.req.query('tierId')
  const groupIndex = Number(c.req.query('groupIndex'))

  if (!tierId || !groupIndex) {
    return c.json({ error: '缺少 tierId 或 groupIndex' }, 400)
  }

  const db = getDb()
  const row = db
    .prepare(
      'SELECT passage_en FROM game_tier_groups WHERE tier_id = ? AND group_index = ?',
    )
    .get(tierId, groupIndex) as { passage_en: string } | undefined

  if (!row?.passage_en?.trim()) {
    return c.json({ error: '本组暂无场景短文' }, 404)
  }

  try {
    const cachePath = await getOrCreatePassageAudio(tierId, groupIndex, row.passage_en.trim())
    const audio = fs.readFileSync(cachePath)
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '语音合成失败'
    return c.json({ error: message }, 502)
  }
})

function loadCorrectionsForWords(
  db: ReturnType<typeof getDb>,
  userId: string,
  wordIds: number[],
): Map<number, { word: string | null; meaning_zh: string | null }> {
  const map = new Map<number, { word: string | null; meaning_zh: string | null }>()
  if (wordIds.length === 0) return map

  const placeholders = wordIds.map(() => '?').join(', ')
  const rows = db
    .prepare(
      `SELECT word_id, word, meaning_zh FROM user_word_corrections WHERE user_id = ? AND word_id IN (${placeholders})`,
    )
    .all(userId, ...wordIds) as Array<{ word_id: number; word: string | null; meaning_zh: string | null }>

  for (const row of rows) {
    map.set(row.word_id, { word: row.word, meaning_zh: row.meaning_zh })
  }
  return map
}

function getCorrectionForWord(
  db: ReturnType<typeof getDb>,
  userId: string | null,
  wordId: number,
): { word: string | null; meaning_zh: string | null } | undefined {
  if (!userId) return undefined
  return db
    .prepare('SELECT word, meaning_zh FROM user_word_corrections WHERE user_id = ? AND word_id = ?')
    .get(userId, wordId) as { word: string | null; meaning_zh: string | null } | undefined
}

function applyCorrection<T extends { word: string; meaningZh: string }>(
  base: T,
  correction?: { word: string | null; meaning_zh: string | null } | null,
): T {
  if (!correction) return base
  return {
    ...base,
    word: correction.word ?? base.word,
    meaningZh: correction.meaning_zh ?? base.meaningZh,
  }
}
