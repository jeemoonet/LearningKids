import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { applyPlanetReview,
  buildBossLevel,
  buildForestLevel,
  buildPlanetSession,
  buildReadingLevel,
  buildRecruitLevel,
  buildReviewLevel,
  completeBossLevel,
  completeForestLevel,
  completeReadingLevel,
  importCurrentTargetWords,
  completeRecruitLevel,
  completeReviewLevel,
  resetKingdomProgress,
} from '../lib/learning/conquerPlanet.js'
import { applyBossMicroGain, setPlanetWordFamiliarity } from '../lib/learning/planetFamiliarity.js'
import { aiNameMapNodes, aiNameSingleMapNode } from '../lib/learning/mapNodeNaming.js'
import { buildPlanetConfigPayload } from '../lib/learning/planetKingdomSettings.js'
import { generateWordlistReading } from '../lib/learning/generateWordlistReading.js'
import { getKnownWordSet } from '../lib/learning/knownWords.js'

type AppEnv = { Variables: { user: AuthUser } }

export const conquerPlanetRoutes = new Hono<AppEnv>()

conquerPlanetRoutes.use('*', requireAuth)

conquerPlanetRoutes.get('/config', (c) => {
  return c.json(buildPlanetConfigPayload(getDb()))
})

conquerPlanetRoutes.get('/session', (c) => {
  const userId = c.get('user').id
  const session = buildPlanetSession(getDb(), userId)
  return c.json({ session })
})

conquerPlanetRoutes.get('/levels/:id/recruit', (c) => {
  const userId = c.get('user').id
  const payload = buildRecruitLevel(getDb(), userId, c.req.param('id'))
  if (!payload) return c.json({ error: '关卡不存在' }, 404)
  return c.json(payload)
})

conquerPlanetRoutes.post('/levels/:id/recruit', async (c) => {
  const userId = c.get('user').id
  const levelId = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { words?: string[] }
  if (!Array.isArray(body.words)) {
    return c.json({ error: '缺少 words' }, 400)
  }
  try {
    const result = completeRecruitLevel(getDb(), userId, levelId, body.words)
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

conquerPlanetRoutes.get('/levels/:id/boss', (c) => {
  const userId = c.get('user').id
  const payload = buildBossLevel(getDb(), userId, c.req.param('id'))
  if (!payload) return c.json({ error: '关卡不存在' }, 404)
  return c.json(payload)
})

conquerPlanetRoutes.post('/levels/:id/boss', async (c) => {
  const userId = c.get('user').id
  const levelId = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { words?: string[] }
  try {
    const result = completeBossLevel(getDb(), userId, levelId, body.words)
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

conquerPlanetRoutes.get('/levels/:id/review', (c) => {
  const userId = c.get('user').id
  const payload = buildReviewLevel(getDb(), userId, c.req.param('id'))
  if (!payload) return c.json({ error: '关卡不存在' }, 404)
  return c.json(payload)
})

conquerPlanetRoutes.post('/review', async (c) => {
  const userId = c.get('user').id
  const body = (await c.req.json().catch(() => ({}))) as { word?: string; correct?: boolean }
  if (!body.word || typeof body.correct !== 'boolean') {
    return c.json({ error: '缺少 word 或 correct' }, 400)
  }
  const result = applyPlanetReview(getDb(), userId, body.word, body.correct)
  return c.json(result)
})

conquerPlanetRoutes.post('/boss-micro-gain', async (c) => {
  const userId = c.get('user').id
  const body = (await c.req.json().catch(() => ({}))) as { word?: string }
  if (!body.word?.trim()) {
    return c.json({ error: '缺少 word' }, 400)
  }
  const result = applyBossMicroGain(getDb(), userId, body.word)
  return c.json(result)
})

conquerPlanetRoutes.post('/familiarity', async (c) => {
  const userId = c.get('user').id
  const body = (await c.req.json().catch(() => ({}))) as { word?: string; familiarity?: number }
  if (!body.word?.trim()) {
    return c.json({ error: '缺少 word' }, 400)
  }
  if (typeof body.familiarity !== 'number') {
    return c.json({ error: '缺少 familiarity' }, 400)
  }
  try {
    const result = setPlanetWordFamiliarity(getDb(), userId, body.word, body.familiarity)
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '设置熟悉度失败' }, 400)
  }
})

conquerPlanetRoutes.post('/import-target', async (c) => {
  const userId = c.get('user').id
  const body = (await c.req.json().catch(() => ({}))) as { limit?: number; familiarity?: number }
  const limit = typeof body.limit === 'number' ? body.limit : 30
  const familiarity = typeof body.familiarity === 'number' ? body.familiarity : 2
  try {
    const result = importCurrentTargetWords(getDb(), userId, limit, familiarity)
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '导入失败' }, 400)
  }
})

conquerPlanetRoutes.post('/levels/:id/review-complete', (c) => {
  const userId = c.get('user').id
  const levelId = c.req.param('id')
  try {
    const session = completeReviewLevel(getDb(), userId, levelId)
    return c.json({ session })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

conquerPlanetRoutes.get('/levels/:id/reading', (c) => {
  const userId = c.get('user').id
  const payload = buildReadingLevel(getDb(), userId, c.req.param('id'))
  if (!payload) return c.json({ error: '关卡不存在' }, 404)
  return c.json(payload)
})

conquerPlanetRoutes.post('/levels/:id/reading-complete', async (c) => {
  const userId = c.get('user').id
  const levelId = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { words?: string[] }
  try {
    const session = completeReadingLevel(
      getDb(),
      userId,
      levelId,
      Array.isArray(body.words) ? body.words : undefined,
    )
    return c.json({ session })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

conquerPlanetRoutes.get('/levels/:id/forest', (c) => {
  const userId = c.get('user').id
  const payload = buildForestLevel(getDb(), userId, c.req.param('id'))
  if (!payload) return c.json({ error: '关卡不存在' }, 404)
  return c.json(payload)
})

conquerPlanetRoutes.post('/levels/:id/forest-complete', (c) => {
  const userId = c.get('user').id
  const levelId = c.req.param('id')
  try {
    const session = completeForestLevel(getDb(), userId, levelId)
    return c.json({ session })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

conquerPlanetRoutes.post('/kingdoms/:kingdomId/reset', (c) => {
  const userId = c.get('user').id
  const kingdomId = c.req.param('kingdomId')
  try {
    const session = resetKingdomProgress(getDb(), userId, kingdomId)
    return c.json({ session })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '重置失败' }, 400)
  }
})

conquerPlanetRoutes.post('/wordlist-reading/generate', async (c) => {
  const userId = c.get('user').id
  const body = (await c.req.json().catch(() => ({}))) as {
    words?: unknown
  }

  const rawWords = Array.isArray(body.words) ? body.words : []
  const words = rawWords
    .map((item) => {
      const row = item as Record<string, unknown>
      return {
        word: String(row.word ?? '').trim(),
        meaning: String(row.meaning ?? '').trim(),
        pos: row.pos ? String(row.pos).trim() : undefined,
        exampleEn: row.exampleEn ? String(row.exampleEn).trim() : undefined,
        exampleZh: row.exampleZh ? String(row.exampleZh).trim() : undefined,
      }
    })
    .filter((item) => item.word && item.meaning)

  if (words.length < 5) {
    return c.json({ error: '至少需要 5 个单词才能生成阅读短文' }, 400)
  }

  try {
    const allowedVocab = getKnownWordSet(getDb(), userId)
    const reading = await generateWordlistReading(words, allowedVocab)
    return c.json({ reading })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '生成失败' }, 502)
  }
})

conquerPlanetRoutes.post('/map-nodes/ai-name', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    kingdomName?: string
    node?: { id: string; terrain: string; x: number; y: number; currentLabel?: string }
    nodes?: Array<{ id: string; terrain: string; x: number; y: number; currentLabel?: string }>
  }

  const kingdomName = body.kingdomName?.trim() || '微光王国'

  try {
    if (body.node) {
      const named = await aiNameSingleMapNode(kingdomName, body.node)
      return c.json({ nodes: { [body.node.id]: named } })
    }

    if (Array.isArray(body.nodes) && body.nodes.length > 0) {
      const named = await aiNameMapNodes(kingdomName, body.nodes)
      return c.json({ nodes: named })
    }

    return c.json({ error: '缺少 node 或 nodes' }, 400)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'AI 命名失败' }, 502)
  }
})
