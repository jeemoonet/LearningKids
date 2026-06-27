import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { getNounPlural, getVerbTenses } from '../../vocab-training/wordForms'
import { shuffle } from '../domain/quiz'
import type { PlanetSession, PlanetSoldier } from '../types'

export const ARMY_INSPECT_BLANK_COUNT = 10

export interface ArmyInspectBlank {
  id: string
  wordKey: string
  displayForm: string
}

export interface ArmyInspectSegment {
  type: 'text' | 'blank'
  text?: string
  blankId?: string
}

export interface ArmyInspectChip {
  id: string
  wordKey: string
  label: string
}

export interface ArmyInspectExercise {
  passageSegments: ArmyInspectSegment[]
  blanks: ArmyInspectBlank[]
  wordBank: ArmyInspectChip[]
  passageZh?: string
}

interface PassageMatch {
  index: number
  length: number
  text: string
  wordKey: string
}

const PASSAGE_INTRO_EN =
  'While inspecting the legion, the commander listens as soldiers recite their battle words. '
const PASSAGE_INTRO_ZH = '视察军团时，指挥官聆听士兵们背诵作战单词。'

interface InspectWord {
  wordKey: string
  word: string
  meaning?: string
  partOfSpeech: PartOfSpeech
  sentenceEn: string
  sentenceZh: string
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getWordForms(word: string, partOfSpeech: PartOfSpeech): string[] {
  const base = word.trim()
  const forms = new Set<string>([base.toLowerCase()])

  if (partOfSpeech === 'verb') {
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

  if (partOfSpeech === 'noun') {
    const plural = getNounPlural(base)
    if (plural) forms.add(plural.toLowerCase())
  }

  return [...forms]
}

function findPassageMatches(passageEn: string, words: InspectWord[]): PassageMatch[] {
  const matches: PassageMatch[] = []

  for (const item of words) {
    const forms = getWordForms(item.word, item.partOfSpeech)
    const pattern = new RegExp(`\\b(${forms.map(escapeRegex).join('|')})\\b`, 'gi')
    let match: RegExpExecArray | null

    while ((match = pattern.exec(passageEn)) !== null) {
      const alreadyMatched = matches.some((entry) => entry.wordKey === item.wordKey)
      if (!alreadyMatched) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
          wordKey: item.wordKey,
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

function soldierSentence(soldier: PlanetSoldier): { en: string; zh: string } {
  const word = soldier.word.trim()
  const meaning = soldier.meaning.trim()
  const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
  if (soldier.exampleEn?.trim() && re.test(soldier.exampleEn)) {
    return {
      en: soldier.exampleEn.trim(),
      zh: soldier.exampleZh?.trim() || meaning || word,
    }
  }
  return {
    en: `Every soldier in our legion should remember the word ${word}.`,
    zh: meaning
      ? `我们军团里的每个士兵都应该记住单词「${word}」（${meaning}）。`
      : `我们军团里的每个士兵都应该记住单词「${word}」。`,
  }
}

function distractorSentence(entry: {
  word: string
  meaning: string
  sentence: string
  sentenceZh: string
}): { en: string; zh: string } {
  const word = entry.word.trim()
  const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
  const filled = entry.sentence.includes('___') ? entry.sentence.replace('___', word) : ''
  if (filled && re.test(filled)) {
    return {
      en: filled,
      zh: entry.sentenceZh?.trim() || entry.meaning.trim() || word,
    }
  }
  return {
    en: `The scouts reported the word ${word} ahead.`,
    zh: entry.meaning
      ? `侦察兵在前方报告了与「${word}」（${entry.meaning}）相关的战况。`
      : `侦察兵在前方报告了单词「${word}」的相关战况。`,
  }
}

function pickInspectWords(session: PlanetSession, round = 0): InspectWord[] {
  const seen = new Set<string>()
  const candidates: InspectWord[] = []

  for (const soldier of session.soldiers) {
    const key = soldier.word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const { en, zh } = soldierSentence(soldier)
    candidates.push({
      wordKey: key,
      word: soldier.word,
      meaning: soldier.meaning,
      partOfSpeech: soldier.partOfSpeech,
      sentenceEn: en,
      sentenceZh: zh,
    })
  }

  if (candidates.length < ARMY_INSPECT_BLANK_COUNT) {
    for (const entry of session.distractorPool ?? []) {
      const key = entry.word.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const { en, zh } = distractorSentence(entry)
      candidates.push({
        wordKey: key,
        word: entry.word,
        meaning: entry.meaning,
        partOfSpeech: entry.partOfSpeech,
        sentenceEn: en,
        sentenceZh: zh,
      })
      if (candidates.length >= ARMY_INSPECT_BLANK_COUNT) break
    }
  }

  if (candidates.length === 0) return []

  let ordered = shuffle(candidates)
  for (let i = 0; i < round; i += 1) {
    ordered = shuffle(ordered)
  }

  return ordered.slice(0, ARMY_INSPECT_BLANK_COUNT)
}

function buildExerciseFromMatches(
  passageEn: string,
  matches: PassageMatch[],
  wordsByKey: Map<string, InspectWord>,
): ArmyInspectExercise {
  const segments: ArmyInspectSegment[] = []
  const blanks: ArmyInspectBlank[] = []
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

  const wordBank = shuffle(
    matches.map((match, index) => ({
      id: `chip-${index}`,
      wordKey: match.wordKey,
      label: match.text,
    })),
  )

  const passageZh =
    PASSAGE_INTRO_ZH +
    matches
      .map((match) => wordsByKey.get(match.wordKey)?.sentenceZh ?? '')
      .filter(Boolean)
      .join('')

  return {
    passageSegments: segments,
    blanks,
    wordBank,
    passageZh: passageZh || undefined,
  }
}

/** 从军团词库抽取 10 词，拼接例句生成完形填空 */
export function buildArmyInspectExercise(
  session: PlanetSession,
  round = 0,
): ArmyInspectExercise | null {
  const picked = pickInspectWords(session, round)
  if (picked.length === 0) return null

  const wordsByKey = new Map(picked.map((item) => [item.wordKey, item]))
  const passageEn = PASSAGE_INTRO_EN + picked.map((item) => item.sentenceEn).join(' ')

  const matches = findPassageMatches(passageEn, picked)
  if (matches.length === 0) return null

  return buildExerciseFromMatches(passageEn, matches, wordsByKey)
}
