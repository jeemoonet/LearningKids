import type { DatabaseSync } from 'node:sqlite'
import { getKnownCount } from './knownWords.js'

export interface ProfileView {
  userId: string
  username: string
  displayName: string
  grade: string
  currentLibraryId: string | null
  currentLibraryName: string | null
  initDone: boolean
  knownCount: number
  activeSetId: string | null
}

function ensureProfile(db: DatabaseSync, userId: string): void {
  const row = db
    .prepare('SELECT user_id FROM user_profiles WHERE user_id = ?')
    .get(userId) as { user_id: string } | undefined
  if (!row) {
    db.prepare(
      'INSERT INTO user_profiles (user_id, grade, current_library_id, init_done, updated_at) VALUES (?, \'\', NULL, 0, ?)',
    ).run(userId, Date.now())
  }
}

export function getProfile(
  db: DatabaseSync,
  userId: string,
  username: string,
  displayName: string,
): ProfileView {
  ensureProfile(db, userId)
  const row = db
    .prepare('SELECT grade, current_library_id, init_done FROM user_profiles WHERE user_id = ?')
    .get(userId) as { grade: string; current_library_id: string | null; init_done: number }

  let currentLibraryName: string | null = null
  if (row.current_library_id) {
    const lib = db
      .prepare('SELECT name FROM learning_libraries WHERE id = ?')
      .get(row.current_library_id) as { name: string } | undefined
    currentLibraryName = lib?.name ?? null
  }

  const activeSet = db
    .prepare("SELECT id FROM learning_sets WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1")
    .get(userId) as { id: string } | undefined

  return {
    userId,
    username,
    displayName,
    grade: row.grade ?? '',
    currentLibraryId: row.current_library_id,
    currentLibraryName,
    initDone: row.init_done === 1,
    knownCount: getKnownCount(db, userId),
    activeSetId: activeSet?.id ?? null,
  }
}

export function updateProfile(
  db: DatabaseSync,
  userId: string,
  patch: { grade?: string; displayName?: string },
): void {
  ensureProfile(db, userId)
  if (typeof patch.grade === 'string') {
    db.prepare('UPDATE user_profiles SET grade = ?, updated_at = ? WHERE user_id = ?').run(
      patch.grade.trim(),
      Date.now(),
      userId,
    )
  }
  if (typeof patch.displayName === 'string' && patch.displayName.trim()) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(patch.displayName.trim(), userId)
  }
}

export function setCurrentLibrary(db: DatabaseSync, userId: string, libraryId: string): void {
  ensureProfile(db, userId)
  const lib = db
    .prepare('SELECT id FROM learning_libraries WHERE id = ? AND is_active = 1')
    .get(libraryId) as { id: string } | undefined
  if (!lib) throw new Error('学习库不存在或已下架')
  db.prepare('UPDATE user_profiles SET current_library_id = ?, updated_at = ? WHERE user_id = ?').run(
    libraryId,
    Date.now(),
    userId,
  )
}

export function getCurrentLibraryId(db: DatabaseSync, userId: string): string | null {
  ensureProfile(db, userId)
  const row = db
    .prepare('SELECT current_library_id FROM user_profiles WHERE user_id = ?')
    .get(userId) as { current_library_id: string | null } | undefined
  return row?.current_library_id ?? null
}
