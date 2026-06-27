import { getLlmProviders, isProviderUnavailableError, toFriendlyLlmError } from '../llmJsonChat.js'

export interface PassageWordInput {
  /** 目标单词原形 */
  word: string
  /** 中文释义 */
  meaning: string
  /** 词性，如 noun / verb / adjective */
  pos?: string
  /** 所属编队：最近学习 / 本节推荐 */
  squad?: 'recent' | 'recommended'
}

export interface BattlePassageResult {
  passageEn: string
  passageZh: string
  /** 按短文中 ___ 出现顺序排列的目标单词原形 */
  answers: string[]
}

const BLANK_TOKEN = '___'

/** 允许的超纲实词占全文比例上限（含词形变化/人名后仍越界的词） */
const OOV_TOLERANCE = 0.15

/**
 * 必要的功能词 / 虚词底表：冠词、be 动词、助动词、介词、连词、常见限定词等。
 * 这些词不在"已学词库"中也允许使用，否则句子无法连贯成文。
 */
const BASE_FUNCTION_WORDS = new Set<string>([
  // 冠词 / 限定词
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'some', 'any', 'no', 'every',
  'each', 'all', 'both', 'many', 'much', 'few', 'little', 'more', 'most', 'other',
  'another', 'such', 'one', 'two', 'three',
  // 代词
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  'who', 'whom', 'whose', 'which', 'what', 'someone', 'something', 'anyone', 'anything',
  'everyone', 'everything', 'nobody', 'nothing',
  // be / 助动词 / 情态动词
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must',
  // 介词
  'in', 'on', 'at', 'to', 'of', 'for', 'with', 'from', 'by', 'as', 'about', 'into',
  'over', 'under', 'up', 'down', 'out', 'off', 'near', 'between', 'after', 'before',
  'during', 'without', 'within', 'around', 'through', 'across',
  // 连词 / 副词性虚词
  'and', 'or', 'but', 'so', 'because', 'if', 'when', 'while', 'then', 'than', 'though',
  'although', 'until', 'since', 'where', 'why', 'how', 'also', 'too', 'very', 'just',
  'not', 'yes', 'here', 'there', 'now', 'today', 'again', 'always', 'never', 'often',
  'only', 'even', 'well', 'still', 'once',
])

function buildPrompt(words: PassageWordInput[], allowedVocab: string[], retryHint?: string): string {
  const wordLines = words
    .map((w) => {
      const pos = w.pos ? `[${w.pos}]` : ''
      return `- ${w.word} ${pos} ${w.meaning}`.replace(/\s+/g, ' ').trim()
    })
    .join('\n')

  const vocabText = allowedVocab.join(', ')
  const targetList = words.map((w) => w.word).join(', ')

  const feedbackBlock = retryHint
    ? `\n## 上一次生成不合格，请务必修正\n${retryHint}\n`
    : ''

  // 重要：不让模型自己挖空，由服务端按目标词原形精确替换成 ___，
  // 这样彻底避免"漏挖空 / 空位数对不上 / 答案乱序"等模型不稳定问题。
  return `你是初中英语阅读老师，正在为"单词猎人"游戏即时生成一段【战前短文】，稍后由系统把目标单词挖空做完形填空。

## 必须用到的目标单词（共 ${words.length} 个）
${wordLines}

## 允许使用的词库（实词只能从这里选，可做单复数 / 时态 / 比较级等词形变化）
${vocabText}

## 用词规则（非常重要）
1. 短文里出现的【实词】（名词、动词、形容词、副词）必须来自上面的"目标单词"或"允许使用的词库"，可以变形。
2. 冠词、介词、连词、be 动词、助动词、代词等【功能词】可以自由使用。
3. 人名可以自拟（如 Tom、Lily），但请尽量少用，优先用代词 he / she / they。
4. 不要使用上述范围以外的生僻实词。
${feedbackBlock}
## 写作要求（务必遵守）
1. 写一段连贯、地道、适合初中生（KET / 中考水平）的英文短文，围绕一个小场景或小故事展开。
2. 把【每一个】目标单词都自然地写进短文，每个目标单词【必须使用其原形（不要变形），且只出现一次】。
   目标单词原形清单：${targetList}
3. 【正常写出所有单词，不要自己挖空、不要写下划线、不要编号】，挖空由系统完成。
4. 提供完整、准确、通顺的中文整段翻译。

## 严格按以下 JSON 输出（不要 markdown 代码块，不要任何多余文字）
{"passageEn":"完整英文短文，目标词原文写出","passageZh":"完整中文翻译"}`
}

/** 拆出原文词元（保留大小写，便于识别人名），过滤标点与挖空占位 */
function tokenizeWithCase(text: string): string[] {
  return text
    .replace(new RegExp(BLANK_TOKEN, 'g'), ' ')
    .replace(/[^A-Za-z'\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[-']+|[-']+$/g, ''))
    .filter((t) => t.length > 0)
}

/** 判断某词的词形变化原形是否落在允许集合内（loves→love、stayed→stay、cities→city 等） */
function inflectionInScope(word: string, allowed: Set<string>): boolean {
  const candidates = new Set<string>()
  const add = (s: string) => {
    if (s.length >= 2) candidates.add(s)
  }

  if (word.endsWith('ies')) add(`${word.slice(0, -3)}y`)
  if (word.endsWith('ied')) add(`${word.slice(0, -3)}y`)
  if (word.endsWith('es')) add(word.slice(0, -2))
  if (word.endsWith('s')) add(word.slice(0, -1))
  if (word.endsWith('ed')) {
    add(word.slice(0, -2))
    add(word.slice(0, -1))
  }
  if (word.endsWith('d')) add(word.slice(0, -1))
  if (word.endsWith('ing')) {
    const base = word.slice(0, -3)
    add(base)
    add(`${base}e`)
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      add(base.slice(0, -1)) // running -> run
    }
  }
  if (word.endsWith('ly')) add(word.slice(0, -2))
  if (word.endsWith('est')) {
    add(word.slice(0, -3))
    add(`${word.slice(0, -3)}e`)
  }
  if (word.endsWith('er')) {
    add(word.slice(0, -2))
    add(word.slice(0, -1))
  }

  for (const c of candidates) {
    if (allowed.has(c)) return true
  }
  return false
}

export interface VocabCheckResult {
  total: number
  oov: string[]
  ratio: number
}

/** 校验短文用词是否落在允许范围内，返回越界实词与占比 */
export function checkPassageVocabulary(passageEn: string, allowed: Set<string>): VocabCheckResult {
  const tokens = tokenizeWithCase(passageEn)
  const oov: string[] = []
  const seen = new Set<string>()

  for (const raw of tokens) {
    const lower = raw.toLowerCase()
    if (allowed.has(lower)) continue
    // 人名 / 专有名词：句中大写开头视为可接受
    if (/^[A-Z]/.test(raw)) continue
    if (inflectionInScope(lower, allowed)) continue
    if (!seen.has(lower)) {
      seen.add(lower)
      oov.push(lower)
    }
  }

  const total = tokens.length || 1
  // 占比按"越界词出现次数"统计更贴近全文体验
  let oovOccurrences = 0
  for (const raw of tokens) {
    const lower = raw.toLowerCase()
    if (allowed.has(lower)) continue
    if (/^[A-Z]/.test(raw)) continue
    if (inflectionInScope(lower, allowed)) continue
    oovOccurrences += 1
  }

  return { total, oov, ratio: oovOccurrences / total }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 目标词在原文里可能的形态（原形 + 常见词形变化），用于精确定位挖空 */
function wordFormPattern(word: string): string {
  const w = escapeRegex(word.toLowerCase())
  const forms = [w]
  // 常见变化：-s/-es/-ed/-ing/-d；y→ies/ied；末辅音重复+ing
  forms.push(`${w}s`, `${w}es`, `${w}ed`, `${w}ing`, `${w}d`)
  if (word.toLowerCase().endsWith('y')) {
    const stem = escapeRegex(word.toLowerCase().slice(0, -1))
    forms.push(`${stem}ies`, `${stem}ied`)
  }
  // 较长形式优先匹配，避免 note 抢先匹配 noted/notes 的子串
  forms.sort((a, b) => b.length - a.length)
  return forms.join('|')
}

/**
 * 把模型写好的完整短文，按目标词原形精确替换成 ___ 挖空，并按出现顺序生成答案。
 * 要求每个目标词在全文中恰好出现一次（含词形变化）；否则返回 null 触发重试。
 */
export function buildBlanksFromPassage(
  passageEn: string,
  words: PassageWordInput[],
): { passageEn: string; answers: string[] } | null {
  const hits: Array<{ word: string; start: number; end: number }> = []

  for (const w of words) {
    const re = new RegExp(`\\b(?:${wordFormPattern(w.word)})\\b`, 'gi')
    const matches = [...passageEn.matchAll(re)]
    if (matches.length !== 1) return null // 必须恰好出现一次
    const m = matches[0]
    hits.push({ word: w.word.toLowerCase(), start: m.index, end: m.index + m[0].length })
  }

  hits.sort((a, b) => a.start - b.start)
  // 检查无重叠（不同目标词命中区间不应交叠）
  for (let i = 1; i < hits.length; i += 1) {
    if (hits[i].start < hits[i - 1].end) return null
  }

  let out = ''
  let cursor = 0
  const answers: string[] = []
  for (const h of hits) {
    out += passageEn.slice(cursor, h.start) + BLANK_TOKEN
    cursor = h.end
    answers.push(h.word)
  }
  out += passageEn.slice(cursor)

  return { passageEn: out, answers }
}

function parseAndValidate(content: string, words: PassageWordInput[]): BattlePassageResult {
  let parsed: { passageEn?: unknown; passageZh?: unknown }
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI 返回内容不是合法 JSON')
  }

  const rawPassageEn = typeof parsed.passageEn === 'string' ? parsed.passageEn.trim() : ''
  const passageZh = typeof parsed.passageZh === 'string' ? parsed.passageZh.trim() : ''

  if (!rawPassageEn || !passageZh) {
    throw new Error('AI 返回字段缺失')
  }

  // 服务端按目标词原形挖空，生成 ___ 与答案
  const blanked = buildBlanksFromPassage(rawPassageEn, words)
  if (!blanked) {
    throw new Error('目标单词未全部恰好出现一次，无法挖空')
  }

  return { passageEn: blanked.passageEn, passageZh, answers: blanked.answers }
}

/** 单次生成尝试上限（每个可用提供商） */
const MAX_ATTEMPTS_PER_PROVIDER = 3

export interface GenerateBattlePassageOptions {
  /** 每个提供商最多尝试次数，默认 3；设为 1 时由客户端控制多轮重试 */
  maxAttemptsPerProvider?: number
  /** 上一轮失败原因，注入 prompt 供模型修正 */
  retryHint?: string
}

export interface GenerateBattlePassageMeta {
  provider: 'qwen' | 'deepseek'
  providerLabel: string
  attemptIndex: number
}

/**
 * 调用 AI 即时生成战前短文完形填空（非预设、非固定模板）。
 * 优先通义千问，账户异常时自动切换 DeepSeek。
 */
export async function generateBattlePassage(
  words: PassageWordInput[],
  allowedVocab: Iterable<string> = [],
  options: GenerateBattlePassageOptions = {},
): Promise<BattlePassageResult & { meta: GenerateBattlePassageMeta }> {
  if (words.length === 0) throw new Error('缺少目标单词')

  const allowedSet = new Set<string>(BASE_FUNCTION_WORDS)
  for (const w of allowedVocab) {
    const v = w.trim().toLowerCase()
    if (v) allowedSet.add(v)
  }
  for (const w of words) allowedSet.add(w.word.trim().toLowerCase())

  const vocabList = [...new Set([...allowedVocab].map((w) => w.trim().toLowerCase()).filter(Boolean))]

  const providers = getLlmProviders()
  if (providers.length === 0) throw new Error('未配置任何 AI 模型')

  let lastError: Error | null = null

  const maxAttempts = options.maxAttemptsPerProvider ?? MAX_ATTEMPTS_PER_PROVIDER
  let retryHint = options.retryHint

  for (const provider of providers) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const attemptIndex = attempt + 1
      try {
        const content = await provider.call(buildPrompt(words, vocabList, retryHint))
        const result = parseAndValidate(content, words)
        const check = checkPassageVocabulary(result.passageEn, allowedSet)

        if (check.ratio <= OOV_TOLERANCE) {
          return {
            ...result,
            meta: {
              provider: provider.name,
              providerLabel: provider.label,
              attemptIndex,
            },
          }
        }

        lastError = new Error(`超纲实词占比 ${(check.ratio * 100).toFixed(0)}%`)
        retryHint = `短文里出现了超出允许范围的实词，请改写并去掉这些词：${check.oov.slice(0, 20).join(', ')}`
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        lastError = err instanceof Error ? err : new Error(message)

        if (isProviderUnavailableError(message)) {
          break
        }

        retryHint = `上次生成不符合要求（${message}）。请确保把全部 ${words.length} 个目标单词都用上、每个【只用原形、且只出现一次】，正常写出单词（不要自己挖空）。`
      }
    }
  }

  const friendly = toFriendlyLlmError(lastError?.message ?? '')
  throw new Error(
    friendly.includes('DeepSeek')
      ? `${friendly}；生成仍失败（${lastError?.message ?? '未知原因'}）`
      : `AI 短文生成失败（${lastError?.message ?? '未知原因'}）`,
  )
}
