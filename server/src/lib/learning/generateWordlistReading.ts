import { getLlmProviders, isProviderUnavailableError } from '../llmJsonChat.js'

export interface WordlistReadingWordInput {
  word: string
  meaning: string
  pos?: string
  exampleEn?: string
  exampleZh?: string
}

export interface ReadingQuestionOption {
  id: number
  label: string
  isCorrect: boolean
}

export interface ReadingQuestion {
  id: number
  stem: string
  options: ReadingQuestionOption[]
}

export interface WordlistReadingResult {
  passageEn: string
  passageZh: string
  wordCount: number
  usedWords: string[]
  questions: ReadingQuestion[]
  source: 'llm' | 'fallback'
  meta?: {
    provider: 'qwen' | 'deepseek'
    providerLabel: string
    attemptIndex: number
  }
}

const TARGET_WORD_COUNT = 100
const MIN_PASSAGE_WORDS = 55
const MAX_PASSAGE_WORDS = 140
const MIN_TARGET_COVERAGE = 0.6

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countEnglishWords(text: string): number {
  return text
    .replace(/[^A-Za-z'\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^[-']+|[-']+$/g, ''))
    .filter((token) => token.length > 0).length
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickTargetWords(words: WordlistReadingWordInput[]): WordlistReadingWordInput[] {
  if (words.length === 0) return []
  const minPick = Math.min(5, words.length)
  const maxPick = Math.min(10, words.length)
  const count = minPick + Math.floor(Math.random() * (maxPick - minPick + 1))
  return shuffle(words).slice(0, count)
}

function wordFormPattern(word: string): string {
  const w = escapeRegex(word.toLowerCase())
  const forms = [w, `${w}s`, `${w}es`, `${w}ed`, `${w}ing`, `${w}d`]
  if (word.toLowerCase().endsWith('y')) {
    const stem = escapeRegex(word.toLowerCase().slice(0, -1))
    forms.push(`${stem}ies`, `${stem}ied`)
  }
  forms.sort((a, b) => b.length - a.length)
  return forms.join('|')
}

function wordAppearsInPassage(passageEn: string, word: string): boolean {
  const re = new RegExp(`\\b(?:${wordFormPattern(word)})\\b`, 'i')
  return re.test(passageEn)
}

function missingWordsInPassage(passageEn: string, words: WordlistReadingWordInput[]): string[] {
  return words
    .map((item) => item.word.trim())
    .filter((word) => word && !wordAppearsInPassage(passageEn, word))
}

function buildPrompt(
  targetWords: WordlistReadingWordInput[],
  retryHint?: string,
): string {
  const wordLines = targetWords
    .map((item) => `- ${item.word}${item.pos ? ` (${item.pos})` : ''}`)
    .join('\n')

  const feedbackBlock = retryHint ? `\nFix: ${retryHint}\n` : ''

  return `Write a ~${TARGET_WORD_COUNT}-word English reading passage for junior high students, plus 3 comprehension MCQs.

Target words (use at least ${Math.ceil(targetWords.length * MIN_TARGET_COVERAGE)} naturally in the passage):
${wordLines}

Rules:
- passageEn: ${MIN_PASSAGE_WORDS}-${MAX_PASSAGE_WORDS} English words, one coherent mini-story
- Other words: only common junior-high English (school, friend, day, go, like, etc.)
- passageZh: natural Chinese translation
- 3 MCQs, 4 options each, stems and options in English
${feedbackBlock}
JSON only:
{"passageEn":"...","passageZh":"...","questions":[{"stem":"...","options":["A","B","C","D"],"correctIndex":0}]}`
}

interface RawQuestion {
  stem?: unknown
  options?: unknown
  correctIndex?: unknown
}

function normalizeQuestions(rawQuestions: unknown): ReadingQuestion[] {
  if (!Array.isArray(rawQuestions) || rawQuestions.length !== 3) {
    throw new Error('需要恰好 3 道选择题')
  }

  return rawQuestions.map((item, index) => {
    const q = item as RawQuestion
    const stem = typeof q.stem === 'string' ? q.stem.trim() : ''
    if (!stem) throw new Error(`第 ${index + 1} 题缺少题干`)

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`第 ${index + 1} 题需要 4 个选项`)
    }

    const labels = q.options.map((opt) => String(opt).trim()).filter(Boolean)
    if (labels.length !== 4) throw new Error(`第 ${index + 1} 题选项不完整`)

    const correctIndex = Number(q.correctIndex)
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new Error(`第 ${index + 1} 题 correctIndex 无效`)
    }

    return {
      id: index + 1,
      stem,
      options: labels.map((label, optIndex) => ({
        id: optIndex + 1,
        label,
        isCorrect: optIndex === correctIndex,
      })),
    }
  })
}

function parseAndValidate(
  content: string,
  targetWords: WordlistReadingWordInput[],
): Omit<WordlistReadingResult, 'source' | 'meta'> {
  let parsed: {
    passageEn?: unknown
    passageZh?: unknown
    questions?: unknown
  }
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI 返回内容不是合法 JSON')
  }

  const passageEn = typeof parsed.passageEn === 'string' ? parsed.passageEn.trim() : ''
  const passageZh = typeof parsed.passageZh === 'string' ? parsed.passageZh.trim() : ''
  if (!passageEn || !passageZh) throw new Error('AI 返回字段缺失')

  const wordCount = countEnglishWords(passageEn)
  if (wordCount < MIN_PASSAGE_WORDS || wordCount > MAX_PASSAGE_WORDS) {
    throw new Error(`短文字数 ${wordCount}，要求 ${MIN_PASSAGE_WORDS}-${MAX_PASSAGE_WORDS}`)
  }

  const missing = missingWordsInPassage(passageEn, targetWords)
  const minPresent = Math.max(1, Math.ceil(targetWords.length * MIN_TARGET_COVERAGE))
  const presentCount = targetWords.length - missing.length
  if (presentCount < minPresent) {
    throw new Error(`短文仅覆盖 ${presentCount}/${targetWords.length} 个目标词`)
  }

  const questions = normalizeQuestions(parsed.questions)
  const usedWords = targetWords
    .filter((item) => wordAppearsInPassage(passageEn, item.word))
    .map((item) => item.word)

  return {
    passageEn,
    passageZh,
    wordCount,
    usedWords,
    questions,
  }
}

function firstMeaningLabel(meaning: string): string {
  return meaning.split(/[；;/,、]/)[0]?.replace(/[（(][^）)]*[）)]/g, '').trim() || meaning.trim()
}

function buildFallbackQuestions(
  targetWords: WordlistReadingWordInput[],
  passageEn: string,
): ReadingQuestion[] {
  const inPassage = targetWords.filter((item) => wordAppearsInPassage(passageEn, item.word))
  const pool = inPassage.length > 0 ? inPassage : targetWords
  const picked = shuffle(pool).slice(0, 3)

  while (picked.length < 3 && pool.length > 0) {
    picked.push(pool[picked.length % pool.length])
  }

  const buildWordOptions = (correctWord: string) => {
    const distractors = shuffle(
      targetWords.filter((other) => other.word !== correctWord).map((other) => other.word),
    ).slice(0, 3)
    while (distractors.length < 3) {
      distractors.push(`word${distractors.length + 1}`)
    }
    return shuffle([
      { label: correctWord, isCorrect: true },
      ...distractors.slice(0, 3).map((label) => ({ label, isCorrect: false })),
    ])
  }

  const buildStatementOptions = (correctItem: WordlistReadingWordInput) => {
    const correct = correctItem.exampleEn?.trim() || `The passage mentions ${correctItem.word}.`
    const distractors = shuffle(
      targetWords
        .filter((other) => other.word !== correctItem.word && other.exampleEn?.trim())
        .map((other) => other.exampleEn!.trim()),
    ).slice(0, 3)
    while (distractors.length < 3) {
      distractors.push(`The story is about something else.`)
    }
    return shuffle([
      { label: correct, isCorrect: true },
      ...distractors.slice(0, 3).map((label) => ({ label, isCorrect: false })),
    ])
  }

  return picked.map((item, index) => {
    if (index === 0) {
      const options = buildWordOptions(item.word)
      return {
        id: index + 1,
        stem: 'Which of the following words appears in the passage?',
        options: options.map((opt, optIndex) => ({
          id: optIndex + 1,
          label: opt.label,
          isCorrect: opt.isCorrect,
        })),
      }
    }

    if (index === 1) {
      const options = buildWordOptions(item.word)
      return {
        id: index + 1,
        stem: `Which word from the passage is most closely related to the story?`,
        options: options.map((opt, optIndex) => ({
          id: optIndex + 1,
          label: opt.label,
          isCorrect: opt.isCorrect,
        })),
      }
    }

    const options = buildStatementOptions(item)
    return {
      id: index + 1,
      stem: 'Which statement best matches the passage?',
      options: options.map((opt, optIndex) => ({
        id: optIndex + 1,
        label: opt.label,
        isCorrect: opt.isCorrect,
      })),
    }
  })
}

export function buildFallbackReading(targetWords: WordlistReadingWordInput[]): WordlistReadingResult {
  const withExamples = shuffle(
    targetWords.filter((item) => item.exampleEn?.trim()),
  )

  const picked = withExamples.length > 0 ? withExamples : shuffle(targetWords)
  const enParts: string[] = []
  const zhParts: string[] = []

  for (const item of picked) {
    const en = item.exampleEn?.trim()
    if (!en) continue
    enParts.push(en.replace(/\s+/g, ' '))
    const zh = item.exampleZh?.trim()
    if (zh) zhParts.push(zh)
    if (countEnglishWords(enParts.join(' ')) >= Math.min(MIN_PASSAGE_WORDS, 50)) break
  }

  if (enParts.length === 0) {
    const names = picked.map((item) => item.word).join(', ')
    enParts.push(`Today we read a short story about ${names}. They are all useful words in daily life.`)
    zhParts.push(`今天我们读一个关于 ${picked.map((item) => firstMeaningLabel(item.meaning)).join('、')} 的小故事。`)
  }

  const passageEn = enParts.join(' ')
  const passageZh = zhParts.join(' ')
  const usedWords = picked.slice(0, enParts.length).map((item) => item.word)

  return {
    passageEn,
    passageZh,
    wordCount: countEnglishWords(passageEn),
    usedWords,
    questions: buildFallbackQuestions(picked.slice(0, Math.max(3, picked.length)), passageEn),
    source: 'fallback',
  }
}

export interface GenerateWordlistReadingOptions {
  maxAttemptsPerProvider?: number
  retryHint?: string
}

export async function generateWordlistReading(
  words: WordlistReadingWordInput[],
  _allowedVocab: Iterable<string>,
  _options: GenerateWordlistReadingOptions = {},
): Promise<WordlistReadingResult> {
  if (words.length < 5) {
    throw new Error('至少需要 5 个单词才能生成阅读短文')
  }

  const targetWords = pickTargetWords(words)
  const providers = getLlmProviders()
  if (providers.length === 0) {
    return buildFallbackReading(targetWords)
  }

  let attempts = 0

  for (const provider of providers) {
    try {
      attempts += 1
      const content = await provider.call(buildPrompt(targetWords))
      const result = parseAndValidate(content, targetWords)
      return {
        ...result,
        source: 'llm',
        meta: {
          provider: provider.name,
          providerLabel: provider.label,
          attemptIndex: attempts,
        },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (isProviderUnavailableError(message)) continue
      break
    }
  }

  return buildFallbackReading(targetWords)
}
