import type { WordEntry } from '../battle/battleTypes'

export type SquadKind = 'recent' | 'recommended'

export interface BattleBlank {
  id: string
  wordId: string
  wordKey: string
  displayForm: string
  squad: SquadKind
}

export interface BattleSquadChip {
  id: string
  wordId: string
  wordKey: string
  label: string
  squad: SquadKind
}

export interface BattlePassageSegment {
  type: 'text' | 'blank'
  text?: string
  blankId?: string
}

export interface BattlePassageExercise {
  passageSegments: BattlePassageSegment[]
  blanks: BattleBlank[]
  recentSquad: BattleSquadChip[]
  recommendedSquad: BattleSquadChip[]
  passageZh: string
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const BLANK_TOKEN = '___'

/**
 * 用 AI 实时生成的整段短文（含 ___ 挖空）构建完形填空练习。
 * answers 按短文中 ___ 出现顺序排列，需与目标单词一一对应。
 * 任意校验不通过返回 null，由调用方决定是否回退。
 */
export function buildExerciseFromAiPassage(
  passageEn: string,
  passageZh: string,
  answers: string[],
  recentWords: WordEntry[],
  recommendedWords: WordEntry[],
): BattlePassageExercise | null {
  const text = passageEn?.trim()
  if (!text || answers.length === 0) return null

  const segments = text.split(BLANK_TOKEN)
  if (segments.length - 1 !== answers.length) return null

  const entryByWord = new Map<string, { entry: WordEntry; squad: SquadKind }>()
  for (const entry of recentWords) entryByWord.set(entry.word.toLowerCase(), { entry, squad: 'recent' })
  for (const entry of recommendedWords) {
    const key = entry.word.toLowerCase()
    if (!entryByWord.has(key)) entryByWord.set(key, { entry, squad: 'recommended' })
  }

  const passageSegments: BattlePassageSegment[] = []
  const blanks: BattleBlank[] = []
  const recentSquad: BattleSquadChip[] = []
  const recommendedSquad: BattleSquadChip[] = []
  const usedWords = new Set<string>()

  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i]) passageSegments.push({ type: 'text', text: segments[i] })
    if (i >= answers.length) continue

    const answerKey = answers[i].toLowerCase()
    const match = entryByWord.get(answerKey)
    if (!match || usedWords.has(answerKey)) return null
    usedWords.add(answerKey)

    const blankId = `blank-${i}`
    passageSegments.push({ type: 'blank', blankId })
    blanks.push({
      id: blankId,
      wordId: match.entry.id,
      wordKey: answerKey,
      displayForm: match.entry.word,
      squad: match.squad,
    })

    const chip: BattleSquadChip = {
      id: `chip-${i}`,
      wordId: match.entry.id,
      wordKey: answerKey,
      label: match.entry.word,
      squad: match.squad,
    }
    if (match.squad === 'recent') recentSquad.push(chip)
    else recommendedSquad.push(chip)
  }

  if (blanks.length === 0) return null

  return {
    passageSegments,
    blanks,
    recentSquad,
    recommendedSquad,
    passageZh: passageZh?.trim() ?? '',
  }
}

/** 从词库例句生成挖空句（非 AI、非固定模板拼接） */
function resolveClozeSentence(entry: WordEntry): { en: string; zh: string } | null {
  if (entry.clozeSentence?.includes('___')) {
    return {
      en: entry.clozeSentence.trim(),
      zh: entry.clozeSentenceZh?.trim() || entry.meaning,
    }
  }

  const exampleEn = entry.exampleEn?.trim()
  if (exampleEn) {
    const re = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, 'i')
    const match = exampleEn.match(re)
    if (match) {
      return {
        en: exampleEn.replace(re, '___'),
        zh: entry.exampleZh?.trim() || entry.meaning,
      }
    }
  }

  return null
}

function appendSentenceSegments(
  sentence: string,
  blankId: string,
  segments: BattlePassageSegment[],
): boolean {
  const parts = sentence.split('___')
  if (parts.length !== 2) return false

  segments.push({ type: 'text', text: parts[0] })
  segments.push({ type: 'blank', blankId })
  segments.push({ type: 'text', text: parts[1] })
  return true
}

/**
 * 用各单词在词库中的真实例句拼成战前短文（与词汇闪卡/测评同源），
 * 再拆成完形填空 + 双编队词库。
 */
export function buildBattlePassageExercise(
  recentWords: WordEntry[],
  recommendedWords: WordEntry[],
): BattlePassageExercise | null {
  const pairs: Array<{ entry: WordEntry; squad: SquadKind }> = [
    ...recentWords.map((entry) => ({ entry, squad: 'recent' as const })),
    ...recommendedWords.map((entry) => ({ entry, squad: 'recommended' as const })),
  ]

  if (pairs.length === 0) return null

  const segments: BattlePassageSegment[] = []
  const blanks: BattleBlank[] = []
  const recentSquad: BattleSquadChip[] = []
  const recommendedSquad: BattleSquadChip[] = []
  const zhParts: string[] = []
  let blankIndex = 0
  let addedSentences = 0

  for (const { entry, squad } of pairs) {
    const cloze = resolveClozeSentence(entry)
    if (!cloze) continue

    if (addedSentences > 0) {
      segments.push({ type: 'text', text: ' ' })
    }

    const blankId = `blank-${blankIndex}`
    if (!appendSentenceSegments(cloze.en, blankId, segments)) continue

    blanks.push({
      id: blankId,
      wordId: entry.id,
      wordKey: entry.word.toLowerCase(),
      displayForm: entry.word,
      squad,
    })

    zhParts.push(cloze.zh.endsWith('。') ? cloze.zh : `${cloze.zh}。`)

    const chip: BattleSquadChip = {
      id: `chip-${blankIndex}`,
      wordId: entry.id,
      wordKey: entry.word.toLowerCase(),
      label: entry.word,
      squad,
    }
    if (squad === 'recent') recentSquad.push(chip)
    else recommendedSquad.push(chip)

    blankIndex += 1
    addedSentences += 1
  }

  if (blanks.length === 0) return null

  return {
    passageSegments: segments,
    blanks,
    recentSquad,
    recommendedSquad,
    passageZh: zhParts.join(''),
  }
}
