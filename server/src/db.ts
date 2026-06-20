import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDbPath = path.resolve(__dirname, '../data/app.db')

const DB_PATH = process.env.DB_PATH ?? defaultDbPath

const APP_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_word_progress (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  familiarity INTEGER NOT NULL DEFAULT 1 CHECK (familiarity >= 1 AND familiarity <= 5),
  exam_count INTEGER NOT NULL DEFAULT 0,
  exam_error_count INTEGER NOT NULL DEFAULT 0,
  last_exam_at INTEGER,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  self_marked INTEGER NOT NULL DEFAULT 0,
  last_seen INTEGER NOT NULL DEFAULT 0,
  next_due INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_group_completion (
  user_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, tier_id, group_index),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_word_corrections (
  user_id TEXT NOT NULL,
  word_id INTEGER NOT NULL,
  word TEXT,
  meaning_zh TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_corrections_user ON user_word_corrections(user_id);

CREATE TABLE IF NOT EXISTS user_tier_groups (
  user_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, tier_id, group_index),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_word_assignments (
  user_id TEXT NOT NULL,
  word_id INTEGER NOT NULL,
  tier_id TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_word_assignments_tier
  ON user_word_assignments(user_id, tier_id, group_index);

CREATE TABLE IF NOT EXISTS game_tier_groups (
  tier_id TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  group_size INTEGER NOT NULL DEFAULT 8,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (tier_id, group_index)
);

CREATE TABLE IF NOT EXISTS game_word_assignments (
  word_id INTEGER NOT NULL PRIMARY KEY,
  tier_id TEXT NOT NULL,
  group_index INTEGER NOT NULL,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_word_assignments_tier
  ON game_word_assignments(tier_id, group_index);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_wordbook (
  user_id TEXT NOT NULL,
  word_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  meaning_zh TEXT NOT NULL DEFAULT '',
  example_en TEXT NOT NULL DEFAULT '',
  example_zh TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_wordbook_user ON user_wordbook(user_id);
`

let dbInstance: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(APP_SCHEMA)
  migrateUserWordProgressToWordKey(db)
  migrateGameTierGroupsPassage(db)
  migrateAdminSessions(db)
  dbInstance = db
  return db
}

function migrateAdminSessions(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
  `)
}

function migrateGameTierGroupsPassage(db: DatabaseSync): void {
  const columns = db
    .prepare('PRAGMA table_info(game_tier_groups)')
    .all() as Array<{ name: string }>
  if (columns.length === 0) return
  if (columns.some((column) => column.name === 'passage_en')) return

  db.exec(`
    ALTER TABLE game_tier_groups ADD COLUMN passage_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE game_tier_groups ADD COLUMN passage_zh TEXT NOT NULL DEFAULT '';
  `)
}

function migrateUserWordProgressToWordKey(db: DatabaseSync): void {
  const columns = db
    .prepare('PRAGMA table_info(user_word_progress)')
    .all() as Array<{ name: string }>
  if (columns.length === 0) return
  if (columns.some((column) => column.name === 'word')) return
  if (!columns.some((column) => column.name === 'word_id')) return

  db.exec(`
    CREATE TABLE user_word_progress_new (
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      familiarity INTEGER NOT NULL DEFAULT 1 CHECK (familiarity >= 1 AND familiarity <= 5),
      exam_count INTEGER NOT NULL DEFAULT 0,
      exam_error_count INTEGER NOT NULL DEFAULT 0,
      last_exam_at INTEGER,
      consecutive_correct INTEGER NOT NULL DEFAULT 0,
      self_marked INTEGER NOT NULL DEFAULT 0,
      last_seen INTEGER NOT NULL DEFAULT 0,
      next_due INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, word),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO user_word_progress_new (
      user_id, word, familiarity, exam_count, exam_error_count, last_exam_at,
      consecutive_correct, self_marked, last_seen, next_due, updated_at
    )
    SELECT
      uwp.user_id, w.word, uwp.familiarity, uwp.exam_count, uwp.exam_error_count, uwp.last_exam_at,
      uwp.consecutive_correct, uwp.self_marked, uwp.last_seen, uwp.next_due, uwp.updated_at
    FROM user_word_progress uwp
    INNER JOIN words w ON w.id = uwp.word_id;

    DROP TABLE user_word_progress;
    ALTER TABLE user_word_progress_new RENAME TO user_word_progress;
    CREATE INDEX IF NOT EXISTS idx_user_word_progress_user ON user_word_progress(user_id);
  `)
}

export function getDbPath(): string {
  return DB_PATH
}
