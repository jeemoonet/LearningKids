#!/usr/bin/env python3
"""将 legacy vocabulary.db 初始化到 server/data/app.db（保留已有用户数据）。"""

from __future__ import annotations

import shutil
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY_DB = ROOT / "src" / "public" / "data" / "vocabulary.db"
FALLBACK_DB = ROOT / "public" / "data" / "vocabulary.db"
APP_DB = ROOT / "server" / "data" / "app.db"

USER_SCHEMA_SQL = """
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

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user ON user_word_progress(user_id);
"""


def main() -> None:
    APP_DB.parent.mkdir(parents=True, exist_ok=True)

    if APP_DB.exists():
        conn = sqlite3.connect(APP_DB)
        conn.executescript(USER_SCHEMA_SQL)
        conn.commit()
        conn.close()
        print(f"[OK] app.db already exists, user schema ensured: {APP_DB}")
        return

    source = LEGACY_DB if LEGACY_DB.exists() else FALLBACK_DB
    if not source.exists():
        raise SystemExit(
            "未找到 vocabulary.db，请先运行 scripts/build_vocabulary_db.py 生成词汇库"
        )

    shutil.copy2(source, APP_DB)
    conn = sqlite3.connect(APP_DB)
    conn.executescript(USER_SCHEMA_SQL)
    conn.commit()
    conn.close()
    print(f"[OK] initialized {APP_DB} from {source}")


if __name__ == "__main__":
    main()
