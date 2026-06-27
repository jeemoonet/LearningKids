import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { buildSectionQuiz, getSectionWhitelist } from '../lib/learning/contentScope.js'
import { getSectionDetail } from '../lib/learning/learningSet.js'
import { applyWordHunterVictory, buildWordHunterSession } from '../lib/learning/wordHunter.js'
import {
  generateBattlePassage,
  type PassageWordInput,
} from '../lib/learning/wordHunterPassage.js'

type AppEnv = { Variables: { user: AuthUser } }

export const coursewareRoutes = new Hono<AppEnv>()

coursewareRoutes.use('*', requireAuth)

coursewareRoutes.get('/section/:id/cards', (c) => {
  const userId = c.get('user').id
  const detail = getSectionDetail(getDb(), userId, c.req.param('id'))
  if (!detail) return c.json({ error: '小节不存在' }, 404)
  return c.json({ words: detail.words })
})

coursewareRoutes.get('/section/:id/quiz', (c) => {
  const userId = c.get('user').id
  const detail = getSectionDetail(getDb(), userId, c.req.param('id'))
  if (!detail) return c.json({ error: '小节不存在' }, 404)
  return c.json({ questions: buildSectionQuiz(getDb(), userId, c.req.param('id')) })
})

coursewareRoutes.get('/section/:id/word-hunter', (c) => {
  const userId = c.get('user').id
  const sectionId = c.req.param('id')
  const session = buildWordHunterSession(getDb(), userId, sectionId)
  if (!session) return c.json({ error: '小节不存在或暂无单词' }, 404)
  return c.json({ session })
})

coursewareRoutes.post('/section/:id/word-hunter/passage', async (c) => {
  const userId = c.get('user').id
  const sectionId = c.req.param('id')
  let body: {
    words?: unknown
    extraAllowedWords?: unknown
    refreshKey?: unknown
    singleAttempt?: unknown
    retryHint?: unknown
    attemptIndex?: unknown
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: '请求体格式错误' }, 400)
  }

  const rawWords = Array.isArray(body.words) ? body.words : []
  const words: PassageWordInput[] = rawWords
    .map((item) => {
      const w = item as Record<string, unknown>
      return {
        word: String(w.word ?? '').trim(),
        meaning: String(w.meaning ?? '').trim(),
        pos: w.pos ? String(w.pos).trim() : undefined,
        squad: w.squad === 'recommended' ? 'recommended' : 'recent',
      } as PassageWordInput
    })
    .filter((w) => w.word)

  if (words.length === 0) return c.json({ error: '缺少目标单词' }, 400)

  const rawExtra = Array.isArray(body.extraAllowedWords) ? body.extraAllowedWords : []
  const extraAllowed = rawExtra
    .map((w) => String(w).trim().toLowerCase())
    .filter(Boolean)

  try {
    const whitelist = getSectionWhitelist(getDb(), userId, sectionId)
    for (const w of extraAllowed) whitelist.add(w)
    for (const w of words) whitelist.add(w.word.trim().toLowerCase())
    const singleAttempt = body.singleAttempt === true
    const retryHint = typeof body.retryHint === 'string' ? body.retryHint.trim() : undefined
    const result = await generateBattlePassage(words, whitelist, {
      maxAttemptsPerProvider: singleAttempt ? 1 : undefined,
      retryHint: retryHint || undefined,
    })
    return c.json({
      passage: {
        passageEn: result.passageEn,
        passageZh: result.passageZh,
        answers: result.answers,
      },
      meta: result.meta,
      clientAttempt: typeof body.attemptIndex === 'number' ? body.attemptIndex : undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI 生成短文失败'
    return c.json({ error: msg }, 502)
  }
})

coursewareRoutes.post('/section/:id/word-hunter/complete', (c) => {
  const userId = c.get('user').id
  const sectionId = c.req.param('id')
  try {
    const result = applyWordHunterVictory(getDb(), userId, sectionId)
    return c.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : '保存失败'
    return c.json({ error: msg }, 400)
  }
})
