import type { DatabaseSync } from 'node:sqlite'

export function hasGameGroups(db: DatabaseSync, tierId: string): boolean {
  const row = db
    .prepare('SELECT 1 AS ok FROM game_tier_groups WHERE tier_id = ? LIMIT 1')
    .get(tierId) as { ok: number } | undefined
  return row != null
}

export function clearGameGroups(db: DatabaseSync, tierId: string): void {
  db.prepare('DELETE FROM game_word_assignments WHERE tier_id = ?').run(tierId)
  db.prepare('DELETE FROM game_tier_groups WHERE tier_id = ?').run(tierId)
}

export function saveGameGroups(
  db: DatabaseSync,
  tierId: string,
  groups: Array<{
    title: string
    wordIds: number[]
    groupSize?: number
    passageEn?: string
    passageZh?: string
  }>,
): { groupCount: number; wordCount: number } {
  const now = Date.now()
  const insertGroup = db.prepare(
    'INSERT INTO game_tier_groups (tier_id, group_index, title, group_size, created_at, passage_en, passage_zh) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const insertAssignment = db.prepare(
    'INSERT INTO game_word_assignments (word_id, tier_id, group_index) VALUES (?, ?, ?)',
  )

  clearGameGroups(db, tierId)

  let totalWords = 0
  groups.forEach((group, index) => {
    const groupIndex = index + 1
    const groupSize = group.groupSize ?? group.wordIds.length
    if (group.wordIds.length === 0) return
    insertGroup.run(
      tierId,
      groupIndex,
      group.title,
      groupSize,
      now,
      group.passageEn?.trim() ?? '',
      group.passageZh?.trim() ?? '',
    )
    for (const wordId of group.wordIds) {
      insertAssignment.run(wordId, tierId, groupIndex)
      totalWords += 1
    }
  })

  return { groupCount: groups.filter((group) => group.wordIds.length > 0).length, wordCount: totalWords }
}

export function mapWordRow(row: Record<string, unknown>) {
  const freqLevel = String(row.freq_level ?? 'low')
  const validFreq = freqLevel === 'high' || freqLevel === 'medium' || freqLevel === 'low'
    ? freqLevel
    : 'low'

  return {
    id: Number(row.id),
    word: String(row.word ?? ''),
    phonetic: String(row.phonetic ?? ''),
    pos: String(row.pos ?? 'other'),
    posLabel: String(row.pos_label ?? ''),
    meaningZh: String(row.meaning_zh ?? ''),
    similar1: String(row.similar1 ?? ''),
    similar2: String(row.similar2 ?? ''),
    similar3: String(row.similar3 ?? ''),
    exampleEn: String(row.example_en ?? ''),
    exampleZh: String(row.example_zh ?? ''),
    tierId: String(row.tier_id ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    freqLevel: validFreq as 'high' | 'medium' | 'low',
    freqLabel: String(row.freq_label ?? '低频'),
    examYearCount: Number(row.exam_year_count ?? 0),
    examTotalCount: Number(row.exam_total_count ?? 0),
  }
}
