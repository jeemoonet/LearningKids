import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import {
  DEFAULT_INIT_TIER,
  drawInitWords,
  getInitStatus,
  keepInitWords,
} from '../lib/freeVocabInit.js'
import { SENTENCE_PATTERN_LIST } from '../lib/freeVocabPatterns.js'
import type { SentencePattern } from '../lib/freeVocabPatterns.js'
import type { SentenceRole } from '../lib/sentenceTemplates.js'
import {
  abandonActiveBatch,
  createBatch,
  getActiveBatch,
  getFreeVocabProgress,
  selectWordsForPattern,
} from '../lib/freeVocabSelect.js'

type AppEnv = { Variables: { user: AuthUser } }

export const freeVocabRoutes = new Hono<AppEnv>()

freeVocabRoutes.use('*', requireAuth)

function resolveTierId(raw: string | undefined): string {
  const tierId = raw?.trim()
  return tierId || DEFAULT_INIT_TIER
}

function isSentencePattern(value: string): value is SentencePattern {
  return SENTENCE_PATTERN_LIST.some((item) => item.id === value)
}

freeVocabRoutes.get('/init/status', (c) => {
  const userId = c.get('user').id
  const tierId = resolveTierId(c.req.query('tierId'))
  const status = getInitStatus(getDb(), userId, tierId)
  return c.json(status)
})

freeVocabRoutes.post('/init/draw', async (c) => {
  const userId = c.get('user').id
  let tierId = DEFAULT_INIT_TIER
  try {
    const body = await c.req.json<{ tierId?: string }>()
    tierId = resolveTierId(body.tierId)
  } catch {
    // use default tier
  }

  const { words, status } = drawInitWords(getDb(), userId, tierId)
  if (status.initialized) {
    return c.json({ error: '初始化已完成', status }, 400)
  }
  if (words.length === 0) {
    return c.json({ error: '词库中暂无可用单词，无法继续抽题', status }, 400)
  }

  return c.json({ words, status })
})

freeVocabRoutes.post('/init/keep', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ tierId?: string; words?: string[] }>()
  const tierId = resolveTierId(body.tierId)
  const words = Array.isArray(body.words) ? body.words : []

  if (words.length === 0) {
    return c.json({ error: '请至少保留一个认识的单词' }, 400)
  }

  const result = keepInitWords(getDb(), userId, tierId, words)
  return c.json(result)
})

freeVocabRoutes.get('/patterns', (c) => {
  return c.json({
    patterns: SENTENCE_PATTERN_LIST.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      unlockOrder: item.unlockOrder,
      slots: item.slots.map((slot) => ({
        role: slot.role,
        roleLabel: slot.roleLabel,
        posHints: slot.posHints,
        minWords: slot.minWords,
      })),
    })),
  })
})

freeVocabRoutes.get('/progress', (c) => {
  const userId = c.get('user').id
  const tierId = resolveTierId(c.req.query('tierId'))
  return c.json(getFreeVocabProgress(getDb(), userId, tierId))
})

freeVocabRoutes.post('/select', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{
    tierId?: string
    pattern?: string
    count?: number
    excludeWords?: string[]
  }>()

  const tierId = resolveTierId(body.tierId)
  const pattern = body.pattern?.trim() ?? ''
  if (!isSentencePattern(pattern)) {
    return c.json({ error: '无效句型' }, 400)
  }

  try {
    const result = await selectWordsForPattern(
      getDb(),
      userId,
      tierId,
      pattern,
      body.count,
      Array.isArray(body.excludeWords) ? body.excludeWords : [],
    )
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '选词失败' }, 400)
  }
})

freeVocabRoutes.post('/batch', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{
    tierId?: string
    pattern?: string
    words?: Array<{ word: string; role?: string | null }>
  }>()

  const tierId = resolveTierId(body.tierId)
  const pattern = body.pattern?.trim() ?? ''
  if (!isSentencePattern(pattern)) {
    return c.json({ error: '无效句型' }, 400)
  }

  const words = Array.isArray(body.words) ? body.words : []
  if (words.length === 0) {
    return c.json({ error: '请选择要学习的单词' }, 400)
  }

  try {
    const batch = createBatch(
      getDb(),
      userId,
      tierId,
      pattern,
      words.map((item) => ({
        word: item.word,
        role: item.role as SentenceRole | null | undefined,
      })),
    )
    return c.json({ batch, progress: getFreeVocabProgress(getDb(), userId, tierId) })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '创建批次失败' }, 400)
  }
})

freeVocabRoutes.get('/batch/active', (c) => {
  const userId = c.get('user').id
  const batch = getActiveBatch(getDb(), userId)
  return c.json({ batch })
})

freeVocabRoutes.post('/batch/abandon', (c) => {
  const userId = c.get('user').id
  abandonActiveBatch(getDb(), userId)
  return c.json({ ok: true })
})
