import type { PlanetWord } from '../types'

export interface MeaningOption {
  text: string
  correct: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 4 选 1 释义题：干扰项优先取同词性 */
export function buildMeaningOptions(
  target: PlanetWord,
  pool: PlanetWord[],
  count = 4,
): MeaningOption[] {
  const samePos = pool.filter(
    (w) => w.id !== target.id && w.partOfSpeech === target.partOfSpeech,
  )
  const others = pool.filter(
    (w) => w.id !== target.id && w.partOfSpeech !== target.partOfSpeech,
  )
  const distractors = [...shuffle(samePos), ...shuffle(others)]
    .slice(0, count - 1)
    .map((w) => w.meaning)
  const options: MeaningOption[] = [
    { text: target.meaning, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ]
  return shuffle(options)
}

export interface SentenceQuiz {
  word: PlanetWord
  parts: [string, string]
  options: { word: string; correct: boolean }[]
}

export function buildSentenceQuiz(target: PlanetWord, pool: PlanetWord[]): SentenceQuiz {
  const [before, after] = target.sentence.split('___')
  const samePos = shuffle(
    pool.filter((w) => w.id !== target.id && w.partOfSpeech === target.partOfSpeech),
  ).slice(0, 3)
  const options = shuffle([
    { word: target.word, correct: true },
    ...samePos.map((w) => ({ word: w.word, correct: false })),
  ])
  return { word: target, parts: [before ?? '', after ?? ''], options }
}

export { shuffle }
