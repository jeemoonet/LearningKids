import { getSpeakableWord } from './VocabWordHeadline'
import type { VocabWord } from './types'
import { getNounPlural, getVerbTenses } from './wordForms'

export interface ClozeBlank {
  id: string
  wordKey: string
  displayForm: string
}

export interface ClozeSegment {
  type: 'text' | 'blank'
  text?: string
  blankId?: string
}

export interface ClozeWordChip {
  id: string
  wordKey: string
  label: string
}

export interface ClozeExercise {
  passageSegments: ClozeSegment[]
  blanks: ClozeBlank[]
  wordBank: ClozeWordChip[]
  passageZh?: string
}

interface PassageMatch {
  index: number
  length: number
  text: string
  wordKey: string
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 收集单词在短文中可能出现的词形（原形、时态、复数等） */
function getWordForms(word: VocabWord): string[] {
  const base = getSpeakableWord(word.word, word)
  const forms = new Set<string>([base.toLowerCase()])

  if (word.pos === 'verb') {
    const tenses = getVerbTenses(base)
    if (tenses) {
      for (const part of [tenses.past, tenses.pastParticiple, tenses.presentParticiple]) {
        part.split('/').forEach((form) => {
          const trimmed = form.trim().toLowerCase()
          if (trimmed) forms.add(trimmed)
        })
      }
    }

    if (!base.endsWith('s')) {
      if (base.endsWith('y') && !/[aeiou]y$/i.test(base)) {
        forms.add(`${base.slice(0, -1)}ies`.toLowerCase())
      } else if (
        base.endsWith('s') ||
        base.endsWith('x') ||
        base.endsWith('ch') ||
        base.endsWith('sh')
      ) {
        forms.add(`${base}es`.toLowerCase())
      } else {
        forms.add(`${base}s`.toLowerCase())
      }
    }
  }

  if (word.pos === 'noun') {
    const plural = getNounPlural(base)
    if (plural) forms.add(plural.toLowerCase())
  }

  return [...forms]
}

function findPassageMatches(passageEn: string, words: VocabWord[]): PassageMatch[] {
  const matches: PassageMatch[] = []

  for (const word of words) {
    const forms = getWordForms(word)
    const pattern = new RegExp(`\\b(${forms.map(escapeRegex).join('|')})\\b`, 'gi')
    let match: RegExpExecArray | null

    while ((match = pattern.exec(passageEn)) !== null) {
      const alreadyMatched = matches.some((item) => item.wordKey === word.word)
      if (!alreadyMatched) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
          wordKey: word.word,
        })
        break
      }
    }
  }

  matches.sort((a, b) => a.index - b.index)

  const filtered: PassageMatch[] = []
  let lastEnd = 0
  for (const match of matches) {
    if (match.index >= lastEnd) {
      filtered.push(match)
      lastEnd = match.index + match.length
    }
  }

  return filtered
}

function buildExerciseFromMatches(
  passageEn: string,
  matches: PassageMatch[],
  passageZh?: string,
): ClozeExercise {
  const segments: ClozeSegment[] = []
  const blanks: ClozeBlank[] = []
  let cursor = 0

  matches.forEach((match, index) => {
    if (match.index > cursor) {
      segments.push({ type: 'text', text: passageEn.slice(cursor, match.index) })
    }
    const blankId = `blank-${index}`
    segments.push({ type: 'blank', blankId })
    blanks.push({
      id: blankId,
      wordKey: match.wordKey,
      displayForm: match.text,
    })
    cursor = match.index + match.length
  })

  if (cursor < passageEn.length) {
    segments.push({ type: 'text', text: passageEn.slice(cursor) })
  }

  const wordBank: ClozeWordChip[] = matches.map((match, index) => ({
    id: `chip-${index}`,
    wordKey: match.wordKey,
    label: match.text,
  }))

  shuffleInPlace(wordBank)

  return {
    passageSegments: segments,
    blanks,
    wordBank,
    passageZh,
  }
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let state = Math.abs(seed) || 1
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function passageTextKey(exercise: ClozeExercise): string {
  return exercise.passageSegments
    .map((segment) => (segment.type === 'text' ? segment.text : '_'))
    .join('')
}

export interface ClozeBuildInput {
  themePassageEn?: string
  themePassageZh?: string
  variantIndex?: number
}

/** 可切换的完形短文变体数量（去重后） */
export function getClozeVariantCount(words: VocabWord[], input: ClozeBuildInput = {}): number {
  return collectClozeVariants(words, input).length
}

function collectClozeVariants(words: VocabWord[], input: ClozeBuildInput): ClozeExercise[] {
  const builders: Array<() => ClozeExercise | null> = []

  const themePassage = input.themePassageEn?.trim()
  if (themePassage) {
    builders.push(() => buildClozeExercise(themePassage, words, input.themePassageZh))
  }

  const sentencePairs = words
    .map((word) => ({
      en: word.exampleEn?.trim() ?? '',
      zh: word.exampleZh?.trim() ?? '',
    }))
    .filter((pair) => pair.en.length > 0)

  if (sentencePairs.length > 0) {
    for (let seed = 0; seed < 12; seed += 1) {
      builders.push(() => {
        const shuffled = seededShuffle(sentencePairs, seed + 1)
        const passageEn = shuffled.map((pair) => pair.en).join(' ')
        const passageZh = shuffled
          .map((pair) => pair.zh)
          .filter(Boolean)
          .join(' ')
        return buildClozeExercise(passageEn, words, passageZh || undefined)
      })
    }
  }

  const unique: ClozeExercise[] = []
  const seen = new Set<string>()
  for (const build of builders) {
    const exercise = build()
    if (!exercise) continue
    const key = passageTextKey(exercise)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(exercise)
  }

  return unique
}

/** 按变体序号选取完形短文（刷新时递增序号即可切换） */
export function buildClozeVariant(words: VocabWord[], input: ClozeBuildInput = {}): ClozeExercise | null {
  const variants = collectClozeVariants(words, input)
  if (variants.length === 0) return null

  const index = Math.abs(input.variantIndex ?? 0) % variants.length
  const picked = variants[index]

  const wordBank = [...picked.wordBank]
  shuffleInPlace(wordBank)

  return { ...picked, wordBank }
}

/** 从主题短文生成完形填空 */
export function buildClozeExercise(
  passageEn: string,
  words: VocabWord[],
  passageZh?: string,
): ClozeExercise | null {
  const trimmed = passageEn.trim()
  if (!trimmed || words.length === 0) return null

  const matches = findPassageMatches(trimmed, words)
  if (matches.length === 0) return null

  return buildExerciseFromMatches(trimmed, matches, passageZh)
}

/** 无主题短文时，用组内例句拼接成短文 */
export function buildClozeFromExamples(words: VocabWord[]): ClozeExercise | null {
  return buildClozeVariant(words, {})
}
