import type { DatabaseSync } from 'node:sqlite'
import { getKnownWordSet } from './knownWords.js'

/** 当前小节的内容白名单 = 我的库全部词 ∪ 本节单词 */
export function getSectionWhitelist(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): Set<string> {
  const known = getKnownWordSet(db, userId)
  const sectionWords = db
    .prepare('SELECT word FROM section_words WHERE section_id = ?')
    .all(sectionId) as Array<{ word: string }>
  for (const row of sectionWords) known.add(row.word.trim().toLowerCase())
  return known
}

function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[-']+|[-']+$/g, ''))
    .filter(Boolean)
}

/** 仅保留所有用词都落在白名单内的例句，拼成测评短文 */
export function buildConstrainedPassage(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): { passageEn: string; passageZh: string } {
  const whitelist = getSectionWhitelist(db, userId, sectionId)
  const rows = db
    .prepare(
      `SELECT w.example_en, w.example_zh FROM section_words sw
       INNER JOIN words w ON w.id = sw.word_id
       WHERE sw.section_id = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(sectionId) as Array<{ example_en: string; example_zh: string }>

  const enParts: string[] = []
  const zhParts: string[] = []
  for (const row of rows) {
    const en = (row.example_en ?? '').trim()
    if (!en) continue
    const tokens = tokenize(en)
    if (tokens.length === 0) continue
    const allInScope = tokens.every((token) => whitelist.has(token))
    if (!allInScope) continue
    enParts.push(en)
    const zh = (row.example_zh ?? '').trim()
    if (zh) zhParts.push(zh)
  }

  return { passageEn: enParts.join(' '), passageZh: zhParts.join('') }
}

export interface QuizQuestion {
  wordId: number
  word: string
  phonetic: string
  options: Array<{ id: number; label: string; isCorrect: boolean }>
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 选择题：正确项为本节词释义，干扰项取自白名单内其他词释义 */
export function buildSectionQuiz(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): QuizQuestion[] {
  const sectionWords = db
    .prepare(
      `SELECT w.id, w.word, w.phonetic, w.meaning_zh FROM section_words sw
       INNER JOIN words w ON w.id = sw.word_id
       WHERE sw.section_id = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(sectionId) as Array<{ id: number; word: string; phonetic: string; meaning_zh: string }>

  const whitelist = getSectionWhitelist(db, userId, sectionId)
  const placeholders = [...whitelist].map(() => '?').join(', ')
  const pool =
    whitelist.size > 0
      ? (db
          .prepare(
            `SELECT DISTINCT meaning_zh FROM words
             WHERE LOWER(word) IN (${placeholders}) AND meaning_zh != ''`,
          )
          .all(...whitelist) as Array<{ meaning_zh: string }>)
      : []
  const poolMeanings = pool.map((r) => r.meaning_zh)

  return sectionWords
    .filter((w) => w.meaning_zh)
    .map((w) => {
      const used = new Set<string>([w.meaning_zh])
      const distractors: string[] = []
      for (const meaning of shuffle(poolMeanings)) {
        if (used.has(meaning)) continue
        used.add(meaning)
        distractors.push(meaning)
        if (distractors.length >= 3) break
      }
      const options = shuffle([
        { id: w.id, label: w.meaning_zh, isCorrect: true },
        ...distractors.map((label, idx) => ({ id: w.id * 100 + idx + 1, label, isCorrect: false })),
      ])
      return { wordId: w.id, word: w.word, phonetic: w.phonetic, options }
    })
}
