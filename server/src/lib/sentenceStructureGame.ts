import {
  SENTENCE_ROLE_LABELS,
  type SentenceRole,
} from './sentenceTemplates.js'
import {
  STRUCTURE_LEVEL_TEMPLATES,
  type StructurePuzzleTemplate,
} from './sentenceStructureTemplates.js'

export interface StructureSegment {
  id: string
  text: string
  textZh: string
  role: SentenceRole
  roleLabel: string
}

export interface StructurePuzzle {
  id: string
  levelId: string
  sentence: string
  sentenceZh: string
  segments: StructureSegment[]
  roleBank: string[]
  hint: string
}

const ALL_ROLE_LABELS = ['主语', '谓语', '宾语', '定语', '状语', '补语'] as const

const ROLE_LABEL_TO_KEY: Record<string, SentenceRole> = {
  主语: 'subject',
  谓语: 'predicate',
  宾语: 'object',
  定语: 'attributive',
  状语: 'adverbial',
  补语: 'complement',
}

const SHORT_ROLE_LABELS: Record<SentenceRole, string> = {
  subject: '主',
  predicate: '谓',
  object: '宾',
  attributive: '定',
  adverbial: '状',
  complement: '补',
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function createSessionId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function templateToPuzzle(
  levelId: string,
  template: StructurePuzzleTemplate,
  index: number,
  sessionId: string,
): StructurePuzzle {
  const roleBank: string[] = []

  return {
    id: `${levelId}-${sessionId}-${index}`,
    levelId,
    sentence: template.sentence,
    sentenceZh: template.sentenceZh,
    segments: template.segments.map((segment, segmentIndex) => ({
      id: `seg-${segmentIndex}`,
      text: segment.text,
      textZh: segment.textZh,
      role: segment.role,
      roleLabel: SENTENCE_ROLE_LABELS[segment.role],
    })),
    roleBank,
    hint: template.hint,
  }
}

function getTemplates(levelId: string): StructurePuzzleTemplate[] {
  return STRUCTURE_LEVEL_TEMPLATES.find((entry) => entry.levelId === levelId)?.puzzles ?? []
}

const DEFAULT_ROUND_COUNT = 6

export function generateStructureSession(levelId: string, count?: number): StructurePuzzle[] {
  const templates = getTemplates(levelId)
  if (templates.length === 0) return []

  const roundCount = count ?? DEFAULT_ROUND_COUNT
  const sessionId = createSessionId()
  const shuffled = shuffle(templates)
  const puzzles: StructurePuzzle[] = []
  const usedKeys = new Set<string>()

  for (const template of shuffled) {
    if (puzzles.length >= roundCount) break
    const key = template.sentence
    if (usedKeys.has(key)) continue
    usedKeys.add(key)
    puzzles.push(templateToPuzzle(levelId, template, puzzles.length, sessionId))
  }

  let guard = 0
  while (puzzles.length < roundCount && guard < roundCount * 10) {
    guard += 1
    const template = shuffled[guard % shuffled.length]
    const key = `${template.sentence}:${guard}`
    if (usedKeys.has(key)) continue
    usedKeys.add(key)
    puzzles.push(templateToPuzzle(levelId, template, puzzles.length, sessionId))
  }

  return shuffle(puzzles).slice(0, roundCount)
}

export function getStructureLevelRule(levelId: string): string {
  if (levelId === 'struct-1') {
    return 'Drag word chunks into blanks to rebuild simple SVO sentences'
  }
  if (levelId === 'struct-2') {
    return 'Drag word chunks into blanks — includes modifiers and complements'
  }
  if (levelId === 'struct-3') {
    return 'Drag word chunks into blanks — includes adverbial phrases'
  }
  if (levelId === 'struct-4') {
    return 'Drag word chunks into blanks — each sentence uses at least five sentence components'
  }
  return 'Drag shuffled words into sentence blanks in the correct order'
}

export function roleLabelToRole(label: string): SentenceRole | null {
  return ROLE_LABEL_TO_KEY[label] ?? null
}

export function getShortRoleLabel(role: SentenceRole): string {
  return SHORT_ROLE_LABELS[role]
}

export { SHORT_ROLE_LABELS, ALL_ROLE_LABELS }
