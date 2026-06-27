import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { seedNewConcept1Library } from './lib/learning/seedNewConcept1Library.js'
import { seedNorthernIceLibrary } from './lib/learning/seedNorthernIceLibrary.js'

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

CREATE TABLE IF NOT EXISTS fv_known_words (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  pos TEXT NOT NULL DEFAULT 'other',
  source TEXT NOT NULL DEFAULT 'init',
  learned_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fv_known_user ON fv_known_words(user_id);

CREATE TABLE IF NOT EXISTS fv_learning_words (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  pos TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fv_learning_user ON fv_learning_words(user_id, status);

CREATE TABLE IF NOT EXISTS fv_batch (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  cloze_streak INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  passed_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fv_batch_user ON fv_batch(user_id, status);

CREATE TABLE IF NOT EXISTS fv_batch_word (
  batch_id TEXT NOT NULL,
  word TEXT NOT NULL,
  role TEXT,
  PRIMARY KEY (batch_id, word),
  FOREIGN KEY (batch_id) REFERENCES fv_batch(id) ON DELETE CASCADE
);
`

// 学习闭环架构（学习库 / 我的单词库 / 学习集 / 小节 / 测评）
const LEARNING_SCHEMA = `
CREATE TABLE IF NOT EXISTS learning_libraries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_tier TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS library_words (
  library_id TEXT NOT NULL,
  word_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (library_id, word_id),
  FOREIGN KEY (library_id) REFERENCES learning_libraries(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_library_words_lib ON library_words(library_id);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  grade TEXT NOT NULL DEFAULT '',
  current_library_id TEXT,
  init_done INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_known_words (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  pos TEXT NOT NULL DEFAULT 'other',
  source TEXT NOT NULL DEFAULT 'init',
  learned_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_known_words_user ON user_known_words(user_id);

CREATE TABLE IF NOT EXISTS learning_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  library_id TEXT NOT NULL,
  size INTEGER NOT NULL,
  section_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_sets_user ON learning_sets(user_id, status);

CREATE TABLE IF NOT EXISTS learning_sections (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',
  passage_en TEXT NOT NULL DEFAULT '',
  passage_zh TEXT NOT NULL DEFAULT '',
  passed_at INTEGER,
  FOREIGN KEY (set_id) REFERENCES learning_sets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_sections_set ON learning_sections(set_id, seq);

CREATE TABLE IF NOT EXISTS section_words (
  section_id TEXT NOT NULL,
  word_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  familiarity INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, word_id),
  FOREIGN KEY (section_id) REFERENCES learning_sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS section_assessments (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES learning_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_section_assessments_section ON section_assessments(section_id);

CREATE TABLE IF NOT EXISTS user_planet_progress (
  user_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'done',
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, level_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_planet_progress_user ON user_planet_progress(user_id);

CREATE TABLE IF NOT EXISTS user_planet_familiarity (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  familiarity INTEGER NOT NULL DEFAULT 3 CHECK (familiarity >= 0 AND familiarity <= 5),
  last_reviewed_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_planet_familiarity_user ON user_planet_familiarity(user_id);
`

let dbInstance: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(APP_SCHEMA)
  db.exec(LEARNING_SCHEMA)
  migrateUserWordProgressToWordKey(db)
  migrateGameTierGroupsPassage(db)
  migrateAdminSessions(db)
  migrateFreeVocabTables(db)
  migratePlanetKingdomOverrides(db)
  migrateWordsDropWordGroupsFk(db)
  seedDefaultLibraries(db)
  seedNorthernIceLibrary(db)
  seedNewConcept1Library(db)
  dbInstance = db
  return db
}

/** 首次启动时，从标准库三档各生成一个默认学习库，开箱即用 */
function seedDefaultLibraries(db: DatabaseSync): void {
  const tierTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tiers'")
    .get() as { name: string } | undefined
  if (!tierTable) return

  const existing = db
    .prepare('SELECT COUNT(*) AS count FROM learning_libraries')
    .get() as { count: number }
  if ((existing?.count ?? 0) > 0) return

  const tiers = db
    .prepare('SELECT id, label, word_count FROM tiers ORDER BY rowid')
    .all() as Array<{ id: string; label: string; word_count: number }>
  if (tiers.length === 0) return

  const now = Date.now()
  const insertLib = db.prepare(
    `INSERT INTO learning_libraries (id, name, description, source_tier, word_count, sort_order, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  )
  const insertWord = db.prepare(
    'INSERT OR IGNORE INTO library_words (library_id, word_id, sort_order) VALUES (?, ?, ?)',
  )

  tiers.forEach((tier, index) => {
    const libId = `lib-${tier.id}`
    insertLib.run(
      libId,
      `${tier.label}词库`,
      `基于标准${tier.label}全部单词的学习目标库`,
      tier.id,
      tier.word_count,
      index,
      now,
    )
    const words = db
      .prepare('SELECT id FROM words WHERE tier_id = ? ORDER BY sort_order, id')
      .all(tier.id) as Array<{ id: number }>
    words.forEach((w, i) => insertWord.run(libId, w.id, i))
    db.prepare('UPDATE learning_libraries SET word_count = ? WHERE id = ?').run(words.length, libId)
  })
}

function migrateFreeVocabTables(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fv_known_words (
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      pos TEXT NOT NULL DEFAULT 'other',
      source TEXT NOT NULL DEFAULT 'init',
      learned_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, word),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_fv_known_user ON fv_known_words(user_id);

    CREATE TABLE IF NOT EXISTS fv_learning_words (
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      pos TEXT NOT NULL DEFAULT 'other',
      status TEXT NOT NULL DEFAULT 'pending',
      updated_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, word),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_fv_learning_user ON fv_learning_words(user_id, status);

    CREATE TABLE IF NOT EXISTS fv_batch (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      pattern TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      cloze_streak INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      passed_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_fv_batch_user ON fv_batch(user_id, status);

    CREATE TABLE IF NOT EXISTS fv_batch_word (
      batch_id TEXT NOT NULL,
      word TEXT NOT NULL,
      role TEXT,
      PRIMARY KEY (batch_id, word),
      FOREIGN KEY (batch_id) REFERENCES fv_batch(id) ON DELETE CASCADE
    );
  `)
}

function migrateWordsDropWordGroupsFk(db: DatabaseSync): void {
  const fks = db
    .prepare('PRAGMA foreign_key_list(words)')
    .all() as Array<{ table: string }>
  if (!fks.some((fk) => fk.table === 'word_groups')) return

  db.exec('PRAGMA foreign_keys = OFF')
  db.exec(`
    CREATE TABLE words_new (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL UNIQUE,
      phonetic TEXT,
      pos TEXT NOT NULL,
      pos_label TEXT NOT NULL,
      meaning_zh TEXT NOT NULL,
      similar1 TEXT,
      similar2 TEXT,
      similar3 TEXT,
      example_en TEXT NOT NULL,
      example_zh TEXT,
      tier_id TEXT NOT NULL,
      group_id INTEGER NOT NULL,
      theme TEXT,
      sort_order INTEGER NOT NULL,
      freq_level TEXT NOT NULL DEFAULT 'low',
      freq_label TEXT NOT NULL DEFAULT '低频',
      exam_year_count INTEGER NOT NULL DEFAULT 0,
      exam_total_count INTEGER NOT NULL DEFAULT 0
    );

    INSERT INTO words_new (
      id, word, phonetic, pos, pos_label, meaning_zh, similar1, similar2, similar3,
      example_en, example_zh, tier_id, group_id, theme, sort_order,
      freq_level, freq_label, exam_year_count, exam_total_count
    )
    SELECT
      id, word, phonetic, pos, pos_label, meaning_zh, similar1, similar2, similar3,
      example_en, example_zh, tier_id, group_id, theme, sort_order,
      freq_level, freq_label, exam_year_count, exam_total_count
    FROM words;

    DROP TABLE words;
    ALTER TABLE words_new RENAME TO words;
  `)
  db.exec('PRAGMA foreign_keys = ON')
}

function migratePlanetKingdomOverrides(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS planet_kingdom_overrides (
      kingdom_id TEXT PRIMARY KEY,
      name TEXT,
      subtitle TEXT,
      map_x REAL,
      map_y REAL,
      map_region TEXT,
      battle_map_layout_json TEXT,
      updated_at INTEGER NOT NULL DEFAULT 0
    );
  `)
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
