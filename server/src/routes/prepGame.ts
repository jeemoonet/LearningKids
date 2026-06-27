import { Hono } from 'hono'
import { getDb } from '../db.js'
import { getPrepLevelRule, getPrepQuestions, listPrepLevels } from '../lib/prepGame.js'

export const prepGameRoutes = new Hono()

prepGameRoutes.get('/levels', (c) => {
  const db = getDb()
  const levels = listPrepLevels(db)
  return c.json({ levels })
})

prepGameRoutes.get('/questions', (c) => {
  const levelId = c.req.query('levelId')
  const countRaw = c.req.query('count')
  const count = countRaw ? Number(countRaw) : undefined
  if (!levelId) return c.json({ error: '缺少 levelId' }, 400)

  const db = getDb()
  const questions = getPrepQuestions(db, levelId, count && count > 0 ? count : undefined)
  if (questions.length === 0) {
    return c.json({ error: '未找到该关卡题目' }, 404)
  }

  return c.json({
    levelId,
    ruleSummary: getPrepLevelRule(db, levelId),
    questions,
  })
})
