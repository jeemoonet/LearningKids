import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from '../gameGroups.js'
import { addKnownWords } from './knownWords.js'
import { buildConstrainedPassage } from './contentScope.js'

export interface ClozePayload {
  sectionId: string
  words: ReturnType<typeof mapWordRow>[]
  passageEn: string
  passageZh: string
}

/** 生成完形填空所需数据：本节单词 + 受白名单约束的短文 */
export function buildSectionCloze(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): ClozePayload {
  const words = (
    db
      .prepare(
        `SELECT w.* FROM section_words sw
         INNER JOIN words w ON w.id = sw.word_id
         WHERE sw.section_id = ?
         ORDER BY w.sort_order, w.id`,
      )
      .all(sectionId) as Array<Record<string, unknown>>
  ).map(mapWordRow)

  const { passageEn, passageZh } = buildConstrainedPassage(db, userId, sectionId)
  return { sectionId, words, passageEn, passageZh }
}

export interface SubmitResult {
  passed: boolean
  correct: number
  total: number
  addedToKnown: number
  unlockedSectionId: string | null
  setCompleted: boolean
}

/** 提交测评：判定通过、纳入我的库、解锁下一节 */
export function submitAssessment(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
  correct: number,
  total: number,
): SubmitResult {
  const section = db
    .prepare('SELECT * FROM learning_sections WHERE id = ? AND user_id = ?')
    .get(sectionId, userId) as
    | { id: string; set_id: string; seq: number; status: string }
    | undefined
  if (!section) throw new Error('小节不存在')

  const safeTotal = Math.max(0, Math.round(total))
  const safeCorrect = Math.max(0, Math.min(safeTotal, Math.round(correct)))
  const passed = safeTotal > 0 && safeCorrect === safeTotal

  const now = Date.now()
  db.prepare(
    `INSERT INTO section_assessments (id, section_id, user_id, total, correct, passed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(`asm-${randomBytes(8).toString('hex')}`, sectionId, userId, safeTotal, safeCorrect, passed ? 1 : 0, now)

  if (!passed) {
    return {
      passed: false,
      correct: safeCorrect,
      total: safeTotal,
      addedToKnown: 0,
      unlockedSectionId: null,
      setCompleted: false,
    }
  }

  // 纳入我的库
  const sectionWords = db
    .prepare(
      `SELECT w.word, w.pos FROM section_words sw
       INNER JOIN words w ON w.id = sw.word_id
       WHERE sw.section_id = ?`,
    )
    .all(sectionId) as Array<{ word: string; pos: string }>
  const addedToKnown = addKnownWords(db, userId, sectionWords, 'section_pass')

  db.prepare("UPDATE learning_sections SET status = 'passed', passed_at = ? WHERE id = ?").run(
    now,
    sectionId,
  )

  // 解锁下一节
  const next = db
    .prepare(
      "SELECT id FROM learning_sections WHERE set_id = ? AND seq = ? AND status = 'locked'",
    )
    .get(section.set_id, section.seq + 1) as { id: string } | undefined
  let unlockedSectionId: string | null = null
  if (next) {
    db.prepare("UPDATE learning_sections SET status = 'learning' WHERE id = ?").run(next.id)
    unlockedSectionId = next.id
  }

  // 学习集是否完成
  const remaining = db
    .prepare("SELECT COUNT(*) AS count FROM learning_sections WHERE set_id = ? AND status != 'passed'")
    .get(section.set_id) as { count: number }
  let setCompleted = false
  if ((remaining?.count ?? 0) === 0) {
    db.prepare("UPDATE learning_sets SET status = 'completed', completed_at = ? WHERE id = ?").run(
      now,
      section.set_id,
    )
    setCompleted = true
  }

  return {
    passed: true,
    correct: safeCorrect,
    total: safeTotal,
    addedToKnown,
    unlockedSectionId,
    setCompleted,
  }
}
