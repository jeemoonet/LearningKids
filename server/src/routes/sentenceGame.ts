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

  const questions = getSentenceQuestions(levelId, count && count > 0 ? count : undefined)
  if (questions.length === 0) {
    return c.json({ error: '未找到该关卡题目' }, 404)
  }

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
