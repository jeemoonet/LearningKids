import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from './gameGroups.js'
import { callLlmJson, toFriendlyLlmError } from './llmJsonChat.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TIER_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

const HIGH_FREQ_FILES: Record<string, string> = {
  beginner: '中考高频词-初级组.md',
  intermediate: '中考高频词-中级组.md',
  advanced: '中考高频词-高级组.md',
}

const POS_LABEL: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adj: '形容词',
  adv: '副词',
  pronoun: '代词',
  other: '其他',
}

const VALID_POS = new Set(Object.keys(POS_LABEL))

interface GeneratedWordPayload {
  word: string
  pos?: string
  meaning_zh: string
  example_en: string
  example_zh: string
  similar1?: string
  similar2?: string
  similar3?: string
}

interface WordContext {
  id: number
  word: string
  pos: string
  posLabel: string
  tierId: string
  groupTitle: string
}

function loadHighFreqPool(tierId: string, limit = 80): string {
  const filename = HIGH_FREQ_FILES[tierId] ?? HIGH_FREQ_FILES.beginner
  const filePath = path.resolve(__dirname, '../data', filename)
  if (!fs.existsSync(filePath)) return ''
  const text = fs.readFileSync(filePath, 'utf8').trim().replace(/;$/, '')
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(', ')
}

function tierSentenceRules(tierId: string): string {
  switch (tierId) {
    case 'intermediate':
      return '允许 1 个介词短语或 1 个并列结构；仍避免 which/that 定语从句'
    case 'advanced':
      return '允许中考阅读/完形常见句型（It is ... to ...、help sb. do 等）；句中生词不超过 1 个'
    default:
      return '主谓宾/主系表，一般现在时为主；禁止从句、被动语态、虚拟语气'
  }
}

function relatedWordRules(tierId: string): string {
  switch (tierId) {
    case 'intermediate':
      return 'similar 共 3 项：词形变化 + 1 组固定搭配'
    case 'advanced':
      return 'similar 共 3 项：词形变化 + 搭配 + 1 个易混词'
    default:
      return 'similar 共 3 项：词形变化或 1 组固定搭配（二选一为主）'
  }
}

function buildPrompt(context: WordContext, highFreq: string): string {
  const tierLabel = TIER_LABELS[context.tierId] ?? context.tierId
  const sceneLine = context.groupTitle
    ? `所属场景小组：${context.groupTitle}`
    : '所属场景：未分组'

  return `你是初中英语词汇编写专家，面向英语弱基础学生（北京中考）。

请为以下单词重新生成词汇数据（词性、释义、例句、关联词）。

## 单词
- word: ${context.word}
- 当前词性（仅供参考）: ${context.posLabel || context.pos}
- 年级: ${tierLabel}
- ${sceneLine}

## 例句规则（DOC-PROD-001）
0. pos：词性，只能是 noun|verb|adj|adv|pronoun|other 之一，按该词在本年级最常考用法判定
1. meaning_zh：中文释义，≤20字，仅最常考的一个义项
2. example_en：6～10 个英文词，最多 12 词；${tierSentenceRules(context.tierId)}
3. example_zh：例句中文对照，自然简洁
4. 除目标词外，句中其余词优先使用熟词池中的词
5. 禁止语法错误模板句（如 Students {word} new skills、plays an important role）
6. 例句必须语法正确，及物/不及物用法准确
7. 一词多义时，例句只体现一个最常考义项

## 关联词规则
${relatedWordRules(context.tierId)}
优先级：词形变化 > 固定搭配 > 同场景词 > 易混词；禁止 WordNet 生僻同义词

## 熟词池（例句中优先选用）
${highFreq || '（暂无熟词池，请使用初中常见词）'}

## 输出格式
只输出 JSON，不要 markdown 代码块：
{"word":"${context.word}","pos":"noun","meaning_zh":"...","example_en":"...","example_zh":"...","similar1":"...","similar2":"...","similar3":"..."}
word 字段必须与上面单词完全一致。pos 必须是 noun|verb|adj|adv|pronoun|other 之一。`
}

async function callLlm(prompt: string): Promise<GeneratedWordPayload> {
  try {
    const { content } = await callLlmJson(prompt)
    return JSON.parse(content) as GeneratedWordPayload
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 生成失败'
    throw new Error(toFriendlyLlmError(message))
  }
}

function resolvePos(entry: GeneratedWordPayload, fallbackPos: string): { pos: string; posLabel: string } {
  const pos = entry.pos?.trim().toLowerCase()
  if (pos && VALID_POS.has(pos)) {
    return { pos, posLabel: POS_LABEL[pos] ?? '其他' }
  }
  const fallback = fallbackPos.trim().toLowerCase()
  if (VALID_POS.has(fallback)) {
    return { pos: fallback, posLabel: POS_LABEL[fallback] ?? '其他' }
  }
  return { pos: 'other', posLabel: '其他' }
}

function validateGenerated(entry: GeneratedWordPayload, expectedWord: string): void {
  if (entry.word !== expectedWord) {
    throw new Error(`生成结果单词不匹配：期望 ${expectedWord}，得到 ${entry.word}`)
  }
  if (!entry.meaning_zh?.trim()) throw new Error('生成结果缺少释义')
  if (!entry.example_en?.trim()) throw new Error('生成结果缺少英文例句')
  if (!entry.example_zh?.trim()) throw new Error('生成结果缺少中文例句')
}

function loadWordContext(db: DatabaseSync, wordId: number): WordContext {
  const row = db
    .prepare(
      `
      SELECT w.id, w.word, w.pos, w.pos_label, w.tier_id, g.title AS group_title
      FROM words w
      LEFT JOIN game_word_assignments a ON a.word_id = w.id
      LEFT JOIN game_tier_groups g
        ON g.tier_id = a.tier_id AND g.group_index = a.group_index
      WHERE w.id = ?
      `,
    )
    .get(wordId) as
    | {
        id: number
        word: string
        pos: string
        pos_label: string
        tier_id: string
        group_title: string | null
      }
    | undefined

  if (!row) throw new Error('单词不存在')

  return {
    id: row.id,
    word: row.word,
    pos: row.pos,
    posLabel: row.pos_label,
    tierId: row.tier_id,
    groupTitle: row.group_title ?? '',
  }
}

export async function regenerateWordContent(db: DatabaseSync, wordId: number) {
  const context = loadWordContext(db, wordId)
  const highFreq = loadHighFreqPool(context.tierId)
  const prompt = buildPrompt(context, highFreq)
  const generated = await callLlm(prompt)

  validateGenerated(generated, context.word)
  const { pos, posLabel } = resolvePos(generated, context.pos)

  db.prepare(
    `
    UPDATE words
    SET pos = ?, pos_label = ?, meaning_zh = ?, example_en = ?, example_zh = ?,
        similar1 = ?, similar2 = ?, similar3 = ?
    WHERE id = ?
    `,
  ).run(
    pos,
    posLabel,
    generated.meaning_zh.trim(),
    generated.example_en.trim(),
    generated.example_zh.trim(),
    generated.similar1?.trim() ?? '',
    generated.similar2?.trim() ?? '',
    generated.similar3?.trim() ?? '',
    wordId,
  )

  const row = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as Record<string, unknown>
  return mapWordRow(row)
}
