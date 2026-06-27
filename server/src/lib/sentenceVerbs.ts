const AUXILIARY_VERBS = new Set([
  'am',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'shall',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  'let',
])

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 从句子中收集需高亮显示的动词词形（保留原文大小写） */
export function collectVerbsFromSentence(sentence: string, hints: string[] = []): string[] {
  const found = new Map<string, string>()
  const words = sentence.match(/\b[\w']+\b/g) ?? []

  for (const word of words) {
    if (AUXILIARY_VERBS.has(word.toLowerCase())) {
      found.set(word.toLowerCase(), word)
    }
  }

  for (const hint of hints) {
    const trimmed = hint.trim()
    if (!trimmed) continue
    const pattern = new RegExp(`\\b${escapeRegex(trimmed)}\\b`, 'gi')
    let match: RegExpExecArray | null
    while ((match = pattern.exec(sentence)) !== null) {
      found.set(match[0].toLowerCase(), match[0])
    }
  }

  return [...found.values()]
}

/** 从 structureNote 中提取「谓语 xxx」提示 */
export function verbsFromStructureNote(structureNote: string): string[] {
  const verbs: string[] = []
  for (const match of structureNote.matchAll(/谓语\s+([\w'-]+)/g)) {
    verbs.push(match[1])
  }
  return verbs
}
