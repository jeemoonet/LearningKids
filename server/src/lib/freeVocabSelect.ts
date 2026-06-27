import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from './gameGroups.js'
import { callLlmJson } from './llmJsonChat.js'
import { DEFAULT_INIT_TIER, getInitStatus, isInitComplete } from './freeVocabInit.js'
import {
  getPatternDefinition,
  guessRoleForWord,
  posMatchesSlot,
  type SentencePattern,
} from './freeVocabPatterns.js'
import type { SentenceRole } from './sentenceTemplates.js'
import { SENTENCE_ROLE_LABELS } from './sentenceTemplates.js'

const MIN_BATCH_SIZE = 5
const MAX_BATCH_SIZE = 10

export interface LearningWord {
  id: number
  word: string
  pos: string
  posLabel: string
  meaningZh: string
  phonetic: string
  exampleEn: string
  exampleZh: string
  freqLevel: string
}

export interface SelectedWordCandidate {
  id: number
  word: string
  pos: string
  posLabel: string
  meaningZh: string
  phonetic: string
  role: SentenceRole
  roleLabel: string
  reason: string
}

export interface SelectWordsResult {
  pattern: SentencePattern
  candidates: SelectedWordCandidate[]
  source: 'ai' | 'fallback'
  learningPoolSize: number
}

export interface BatchWordRecord {
  word: string
  role?: SentenceRole | null
}

export interface ActiveBatch {
  id: string
  tierId: string
  pattern: SentencePattern
  status: string
  clozeStreak: number
  createdAt: number
  words: Array<{
    word: string
    role: string | null
    pos: string
    posLabel: string
    meaningZh: string
  }>
}

export interface FreeVocabProgress {
  tierId: string
  initialized: boolean
  knownCount: number
  tierWordCount: number
  score: number
  learningCount: number
  activeBatch: ActiveBatch | null
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function mapLearningWord(row: Record<string, unknown>): LearningWord {
  const mapped = mapWordRow(row)
  return {
    id: mapped.id,
    word: mapped.word,
    pos: mapped.pos,
    posLabel: mapped.posLabel,
    meaningZh: mapped.meaningZh,
    phonetic: mapped.phonetic,
    exampleEn: mapped.exampleEn,
    exampleZh: mapped.exampleZh,
    freqLevel: mapped.freqLevel,
  }
}

export function loadLearningPool(
  db: DatabaseSync,
  userId: string,
  tierId: string,
  excludeWords: string[] = [],
): LearningWord[] {
  const exclude = new Set(excludeWords.map((word) => word.trim().toLowerCase()).filter(Boolean))

  const rows = db
    .prepare(
      `
      SELECT w.*
      FROM words w
      WHERE w.tier_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM fv_known_words k
          WHERE k.user_id = ? AND k.word = w.word
        )
        AND NOT EXISTS (
          SELECT 1 FROM fv_learning_words l
          WHERE l.user_id = ? AND l.word = w.word AND l.status = 'learning'
        )
      ORDER BY
        CASE w.freq_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        w.sort_order,
        w.id
      `,
    )
    .all(tierId, userId, userId) as Array<Record<string, unknown>>

  return rows
    .map(mapLearningWord)
    .filter((item) => !exclude.has(item.word))
}

function buildCandidate(
  word: LearningWord,
  role: SentenceRole,
  reason: string,
): SelectedWordCandidate {
  return {
    id: word.id,
    word: word.word,
    pos: word.pos,
    posLabel: word.posLabel,
    meaningZh: word.meaningZh,
    phonetic: word.phonetic,
    role,
    roleLabel: SENTENCE_ROLE_LABELS[role],
    reason,
  }
}

export function selectWordsFallback(
  patternId: SentencePattern,
  pool: LearningWord[],
  count: number,
): SelectedWordCandidate[] {
  const pattern = getPatternDefinition(patternId)
  if (!pattern || pool.length === 0) return []

  const targetCount = Math.max(MIN_BATCH_SIZE, Math.min(MAX_BATCH_SIZE, count))
  const picked = new Map<string, SelectedWordCandidate>()
  const usedRoles = new Set<SentenceRole>()

  for (const slot of pattern.slots) {
    const candidates = shuffle(pool).filter(
      (word) => !picked.has(word.word) && posMatchesSlot(word.pos, slot.posHints),
    )
    let added = 0
    for (const word of candidates) {
      if (added >= slot.minWords || picked.size >= targetCount) break
      picked.set(
        word.word,
        buildCandidate(word, slot.role, `适合作${slot.roleLabel}，词性为${word.posLabel}`),
      )
      usedRoles.add(slot.role)
      added += 1
    }
  }

  for (const word of shuffle(pool)) {
    if (picked.size >= targetCount) break
    if (picked.has(word.word)) continue
    const role = guessRoleForWord(pattern, word.pos, usedRoles)
    if (!role) continue
    picked.set(word.word, buildCandidate(word, role, `补充${SENTENCE_ROLE_LABELS[role]}位单词`))
    usedRoles.add(role)
  }

  return [...picked.values()].slice(0, targetCount)
}

function buildAiPrompt(
  patternId: SentencePattern,
  pool: LearningWord[],
  count: number,
): string {
  const pattern = getPatternDefinition(patternId)
  if (!pattern) throw new Error('无效句型')

  const slotsText = pattern.slots
    .map((slot) => `- ${slot.roleLabel}（${slot.role}）：优先词性 ${slot.posHints.join(' / ')}，至少 ${slot.minWords} 个`)
    .join('\n')

  const wordLines = pool
    .slice(0, 100)
    .map((word) => `${word.word} [${word.posLabel}] ${word.meaningZh}`)
    .join('\n')

  return `你是初中英语词汇教练，帮助学生按句型背单词。

## 目标句型
${pattern.title}：${pattern.summary}

## 需要覆盖的句子成分
${slotsText}

## 候选生词（只能从这里选，word 拼写必须完全一致）
${wordLines}

## 任务
从候选生词中挑选 ${MIN_BATCH_SIZE}-${Math.min(MAX_BATCH_SIZE, count)} 个单词，用于后续造句和完形练习。

要求：
1. 只能选上面列表中的 word，不要编造
2. 尽量覆盖不同句子成分
3. 优先选高频、好造句的词
4. 不要选重复词

## 输出 JSON（不要 markdown）
{"words":[{"word":"...","role":"subject|predicate|object|attributive|adverbial|complement","reason":"简短中文理由"}]}`
}

async function callAiSelect(prompt: string): Promise<Array<{ word: string; role: string; reason: string }>> {
  const { content } = await callLlmJson(prompt)
  const parsed = JSON.parse(content) as { words?: Array<{ word?: string; role?: string; reason?: string }> }
  if (!Array.isArray(parsed.words)) throw new Error('AI 返回格式无效')
  return parsed.words
    .filter((item) => item.word)
    .map((item) => ({
      word: String(item.word).trim().toLowerCase(),
      role: String(item.role ?? '').trim(),
      reason: String(item.reason ?? 'AI 推荐').trim(),
    }))
}

function normalizeRole(raw: string, patternId: SentencePattern, pos: string): SentenceRole | null {
  const validRoles: SentenceRole[] = [
    'subject',
    'predicate',
    'object',
    'attributive',
    'adverbial',
    'complement',
  ]
  if (validRoles.includes(raw as SentenceRole)) return raw as SentenceRole
  const pattern = getPatternDefinition(patternId)
  if (!pattern) return null
  return guessRoleForWord(pattern, pos, new Set())
}

export async function selectWordsForPattern(
  db: DatabaseSync,
  userId: string,
  tierId: string,
  patternId: SentencePattern,
  count = MAX_BATCH_SIZE,
  excludeWords: string[] = [],
): Promise<SelectWordsResult> {
  const pattern = getPatternDefinition(patternId)
  if (!pattern) throw new Error('无效句型')
  if (!isInitComplete(db, userId)) throw new Error('请先完成基础词库初始化')

  const pool = loadLearningPool(db, userId, tierId, excludeWords)
  if (pool.length === 0) throw new Error('学习词库暂无可用单词')

  const targetCount = Math.max(MIN_BATCH_SIZE, Math.min(MAX_BATCH_SIZE, count))
  const poolMap = new Map(pool.map((word) => [word.word, word]))

  try {
    const aiItems = await callAiSelect(buildAiPrompt(patternId, pool, targetCount))
    const candidates: SelectedWordCandidate[] = []

    for (const item of aiItems) {
      if (candidates.length >= targetCount) break
      const source = poolMap.get(item.word)
      if (!source || candidates.some((c) => c.word === source.word)) continue
      const role = normalizeRole(item.role, patternId, source.pos)
      if (!role) continue
      candidates.push(buildCandidate(source, role, item.reason || 'AI 推荐'))
    }

    if (candidates.length >= MIN_BATCH_SIZE) {
      return {
        pattern: patternId,
        candidates,
        source: 'ai',
        learningPoolSize: pool.length,
      }
    }
  } catch {
    // fallback below
  }

  return {
    pattern: patternId,
    candidates: selectWordsFallback(patternId, pool, targetCount),
    source: 'fallback',
    learningPoolSize: pool.length,
  }
}

export function getActiveBatch(db: DatabaseSync, userId: string): ActiveBatch | null {
  const batch = db
    .prepare(
      `
      SELECT id, tier_id, pattern, status, cloze_streak, created_at
      FROM fv_batch
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
      `,
    )
    .get(userId) as
    | {
        id: string
        tier_id: string
        pattern: SentencePattern
        status: string
        cloze_streak: number
        created_at: number
      }
    | undefined

  if (!batch) return null

  const words = db
    .prepare(
      `
      SELECT bw.word, bw.role, w.pos, w.pos_label, w.meaning_zh
      FROM fv_batch_word bw
      LEFT JOIN words w ON w.word = bw.word
      WHERE bw.batch_id = ?
      ORDER BY bw.word
      `,
    )
    .all(batch.id) as Array<{
    word: string
    role: string | null
    pos: string | null
    pos_label: string | null
    meaning_zh: string | null
  }>

  return {
    id: batch.id,
    tierId: batch.tier_id,
    pattern: batch.pattern,
    status: batch.status,
    clozeStreak: batch.cloze_streak,
    createdAt: batch.created_at,
    words: words.map((row) => ({
      word: row.word,
      role: row.role,
      pos: row.pos ?? 'other',
      posLabel: row.pos_label ?? '',
      meaningZh: row.meaning_zh ?? '',
    })),
  }
}

export function abandonActiveBatch(db: DatabaseSync, userId: string): void {
  const now = Date.now()
  const active = getActiveBatch(db, userId)
  if (!active) return

  db.prepare("UPDATE fv_batch SET status = 'abandoned' WHERE id = ?").run(active.id)
  db.prepare(
    `
    UPDATE fv_learning_words
    SET status = 'pending', updated_at = ?
    WHERE user_id = ? AND word IN (
      SELECT word FROM fv_batch_word WHERE batch_id = ?
    )
    `,
  ).run(now, userId, active.id)
}

export function createBatch(
  db: DatabaseSync,
  userId: string,
  tierId: string,
  patternId: SentencePattern,
  words: BatchWordRecord[],
): ActiveBatch {
  const pattern = getPatternDefinition(patternId)
  if (!pattern) throw new Error('无效句型')
  if (!isInitComplete(db, userId)) throw new Error('请先完成基础词库初始化')

  const normalized = [...new Map(words.map((item) => [item.word.trim().toLowerCase(), item])).values()]
    .filter((item) => item.word)

  if (normalized.length < MIN_BATCH_SIZE || normalized.length > MAX_BATCH_SIZE) {
    throw new Error(`每批需选择 ${MIN_BATCH_SIZE}-${MAX_BATCH_SIZE} 个单词`)
  }

  const pool = loadLearningPool(db, userId, tierId)
  const poolMap = new Map(pool.map((word) => [word.word, word]))
  const knownSet = new Set(
    (
      db
        .prepare('SELECT word FROM fv_known_words WHERE user_id = ?')
        .all(userId) as Array<{ word: string }>
    ).map((row) => row.word),
  )

  for (const item of normalized) {
    if (knownSet.has(item.word)) throw new Error(`「${item.word}」已在已掌握词库中`)
    if (!poolMap.has(item.word) && !knownSet.has(item.word)) {
      const exists = db.prepare('SELECT 1 FROM words WHERE tier_id = ? AND word = ?').get(tierId, item.word)
      if (!exists) throw new Error(`「${item.word}」不在词库中`)
    }
  }

  abandonActiveBatch(db, userId)

  const batchId = randomBytes(16).toString('hex')
  const now = Date.now()

  db.prepare(
    `
    INSERT INTO fv_batch (id, user_id, tier_id, pattern, status, cloze_streak, created_at)
    VALUES (?, ?, ?, ?, 'active', 0, ?)
    `,
  ).run(batchId, userId, tierId, patternId, now)

  const insertWord = db.prepare(
    'INSERT INTO fv_batch_word (batch_id, word, role) VALUES (?, ?, ?)',
  )
  const upsertLearning = db.prepare(
    `
    INSERT INTO fv_learning_words (user_id, word, pos, status, updated_at)
    VALUES (?, ?, ?, 'learning', ?)
    ON CONFLICT(user_id, word) DO UPDATE SET
      pos = excluded.pos,
      status = 'learning',
      updated_at = excluded.updated_at
    `,
  )

  for (const item of normalized) {
    const meta =
      poolMap.get(item.word) ??
      (db
        .prepare('SELECT word, pos FROM words WHERE tier_id = ? AND word = ?')
        .get(tierId, item.word) as { word: string; pos: string } | undefined)
    const role =
      item.role ??
      (meta ? guessRoleForWord(pattern, meta.pos, new Set()) : null)
    insertWord.run(batchId, item.word, role)
    upsertLearning.run(userId, item.word, meta?.pos ?? 'other', now)
  }

  const created = getActiveBatch(db, userId)
  if (!created) throw new Error('创建批次失败')
  return created
}

export function getFreeVocabProgress(
  db: DatabaseSync,
  userId: string,
  tierId: string = DEFAULT_INIT_TIER,
): FreeVocabProgress {
  const initStatus = getInitStatus(db, userId, tierId)
  const learningRow = db
    .prepare(
      "SELECT COUNT(*) AS count FROM fv_learning_words WHERE user_id = ? AND status IN ('pending', 'learning')",
    )
    .get(userId) as { count: number }

  return {
    tierId,
    initialized: initStatus.initialized,
    knownCount: initStatus.knownCount,
    tierWordCount: initStatus.tierWordCount,
    score: initStatus.score,
    learningCount: learningRow?.count ?? 0,
    activeBatch: getActiveBatch(db, userId),
  }
}
