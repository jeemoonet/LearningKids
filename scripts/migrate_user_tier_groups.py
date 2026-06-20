#!/usr/bin/env python3
"""移除全局 word_groups / words.group_id/theme，改为用户初始化后动态分组。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_DB = ROOT / "server" / "data" / "app.db"

USER_TIER_SCHEMA = """
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
"""


def migrate(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.executescript(USER_TIER_SCHEMA)

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='words'")
    if not cur.fetchone():
        print("[SKIP] words table missing")
        return

    cur.execute("PRAGMA foreign_keys=OFF")
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS words_new (
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
            sort_order INTEGER NOT NULL
        );
        INSERT INTO words_new (
            id, word, phonetic, pos, pos_label, meaning_zh,
            similar1, similar2, similar3, example_en, example_zh,
            tier_id, sort_order
        )
        SELECT id, word, phonetic, pos, pos_label, meaning_zh,
            similar1, similar2, similar3, example_en, example_zh,
            tier_id, sort_order
        FROM words;
        DROP TABLE words;
        ALTER TABLE words_new RENAME TO words;
        """
    )
    cur.execute("DROP TABLE IF EXISTS word_groups")
    cur.execute("PRAGMA foreign_keys=ON")

    cur.execute("DELETE FROM user_group_completion")
    cur.execute("UPDATE tiers SET group_count = 0")

    conn.commit()
    word_count = cur.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    print(f"[OK] migrated {APP_DB}: {word_count} words, word_groups removed")


def main() -> None:
    if not APP_DB.exists():
        raise SystemExit(f"未找到 {APP_DB}")
    conn = sqlite3.connect(APP_DB)
    try:
        migrate(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
