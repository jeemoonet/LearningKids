import { Hono } from 'hono'
import {
  getSentenceLevelRule,
  getSentenceQuestions,
  listSentenceLevels,
} from '../lib/sentenceGame.js'
import {
  generateStructureSession,
  getStructureLevelRule,
} from '../lib/sentenceStructureGame.js'

export const sentenceGameRoutes = new Hono()

sentenceGameRoutes.get('/levels', (c) => {
  const levels = listSentenceLevels()
  return c.json({ levels })
})

sentenceGameRoutes.get('/questions', (c) => {
  const levelId = c.req.query('levelId')
  const countRaw = c.req.query('count')
  const count = countRaw ? Number(countRaw) : undefined
  if (!levelId) return c.json({ error: '缺少 levelId' }, 400)

  let excludeKeys: string[] = []
  const excludeRaw = c.req.query('exclude')
  if (excludeRaw) {
    try {
      const parsed = JSON.parse(excludeRaw) as unknown
      if (Array.isArray(parsed)) {
        excludeKeys = parsed.filter((item): item is string => typeof item === 'string')
      }
    } catch {
      excludeKeys = []
    }
  }
  // 兼容 sentence 中 {blank} / ______ 两种占位符
  excludeKeys = excludeKeys.map((key) => key.replace('{blank}', '______'))

  const questions = getSentenceQuestions(
    levelId,
    count && count > 0 ? count : undefined,
    excludeKeys,
  )
  if (questions.length === 0) {
    return c.json({ error: '未找到该关卡题目' }, 404)
  }

  c.header('Cache-Control', 'no-store')
  return c.json({
    levelId,
    ruleSummary: getSentenceLevelRule(levelId),
    questions,
  })
})

sentenceGameRoutes.get('/structure-puzzles', (c) => {
  const levelId = c.req.query('levelId')
  const countRaw = c.req.query('count')
  const count = countRaw ? Number(countRaw) : undefined
  if (!levelId) return c.json({ error: '缺少 levelId' }, 400)

  const puzzles = generateStructureSession(levelId, count && count > 0 ? count : undefined)
  if (puzzles.length === 0) {
    return c.json({ error: '未找到该关卡句子' }, 404)
  }

  return c.json({
    levelId,
    ruleSummary: getStructureLevelRule(levelId),
    puzzles,
  })
})
