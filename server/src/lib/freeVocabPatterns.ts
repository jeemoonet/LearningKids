import type { SentenceRole } from './sentenceTemplates.js'

export type SentencePattern = 'SV' | 'SVO' | 'SVP' | 'SVO_attr' | 'SVO_adv' | 'SVOC'

export interface PatternSlot {
  role: SentenceRole
  roleLabel: string
  posHints: string[]
  minWords: number
}

export interface PatternDefinition {
  id: SentencePattern
  title: string
  summary: string
  unlockOrder: number
  slots: PatternSlot[]
}

export const SENTENCE_PATTERN_LIST: PatternDefinition[] = [
  {
    id: 'SV',
    title: '主谓（SV）',
    summary: '主语 + 谓语，如 Tom runs.',
    unlockOrder: 1,
    slots: [
      { role: 'subject', roleLabel: '主语', posHints: ['noun', 'pronoun'], minWords: 2 },
      { role: 'predicate', roleLabel: '谓语', posHints: ['verb'], minWords: 2 },
    ],
  },
  {
    id: 'SVO',
    title: '主谓宾（SVO）',
    summary: '主语 + 谓语 + 宾语，如 I like music.',
    unlockOrder: 2,
    slots: [
      { role: 'subject', roleLabel: '主语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'predicate', roleLabel: '谓语', posHints: ['verb'], minWords: 2 },
      { role: 'object', roleLabel: '宾语', posHints: ['noun', 'pronoun'], minWords: 2 },
    ],
  },
  {
    id: 'SVP',
    title: '主系表（SVP）',
    summary: '主语 + 系动词 + 表语，如 She is happy.',
    unlockOrder: 3,
    slots: [
      { role: 'subject', roleLabel: '主语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'predicate', roleLabel: '系动词', posHints: ['verb'], minWords: 1 },
      { role: 'complement', roleLabel: '表语', posHints: ['adj', 'noun'], minWords: 2 },
    ],
  },
  {
    id: 'SVO_attr',
    title: '主谓宾 + 定语',
    summary: '修饰主语或宾语，如 The tall boy reads a new book.',
    unlockOrder: 4,
    slots: [
      { role: 'subject', roleLabel: '主语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'attributive', roleLabel: '定语', posHints: ['adj'], minWords: 2 },
      { role: 'predicate', roleLabel: '谓语', posHints: ['verb'], minWords: 1 },
      { role: 'object', roleLabel: '宾语', posHints: ['noun', 'pronoun'], minWords: 1 },
    ],
  },
  {
    id: 'SVO_adv',
    title: '主谓宾 + 状语',
    summary: '补充时间/方式，如 We study English at home.',
    unlockOrder: 5,
    slots: [
      { role: 'subject', roleLabel: '主语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'predicate', roleLabel: '谓语', posHints: ['verb'], minWords: 1 },
      { role: 'object', roleLabel: '宾语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'adverbial', roleLabel: '状语', posHints: ['adv', 'noun', 'other'], minWords: 2 },
    ],
  },
  {
    id: 'SVOC',
    title: '主谓宾 + 宾补',
    summary: '补充说明宾语，如 We find the story interesting.',
    unlockOrder: 6,
    slots: [
      { role: 'subject', roleLabel: '主语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'predicate', roleLabel: '谓语', posHints: ['verb'], minWords: 1 },
      { role: 'object', roleLabel: '宾语', posHints: ['noun', 'pronoun'], minWords: 1 },
      { role: 'complement', roleLabel: '宾补', posHints: ['adj', 'noun'], minWords: 2 },
    ],
  },
]

export function getPatternDefinition(pattern: string): PatternDefinition | undefined {
  return SENTENCE_PATTERN_LIST.find((item) => item.id === pattern)
}

export function posMatchesSlot(pos: string, posHints: string[]): boolean {
  if (posHints.includes(pos)) return true
  if (posHints.includes('noun') && pos === 'noun') return true
  if (posHints.includes('verb') && pos === 'verb') return true
  if (posHints.includes('adj') && pos === 'adj') return true
  if (posHints.includes('adv') && pos === 'adv') return true
  if (posHints.includes('pronoun') && pos === 'pronoun') return true
  return false
}

export function guessRoleForWord(
  pattern: PatternDefinition,
  pos: string,
  usedRoles: Set<SentenceRole>,
): SentenceRole | null {
  for (const slot of pattern.slots) {
    if (usedRoles.has(slot.role)) continue
    if (posMatchesSlot(pos, slot.posHints)) return slot.role
  }
  for (const slot of pattern.slots) {
    if (posMatchesSlot(pos, slot.posHints)) return slot.role
  }
  return null
}
