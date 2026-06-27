#!/usr/bin/env python3
"""从 words 表及关联表删除人名单词，并同步更新 server/data 词表文件。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"
WORD_LIST_FILES = [
    ROOT / "server" / "data" / "中考高频词.md",
    ROOT / "server" / "data" / "中考高频词-初级组.md",
    ROOT / "server" / "data" / "中考高频词-中级组.md",
    ROOT / "server" / "data" / "中考高频词-高级组.md",
]

NAME_SQL = """
SELECT id, word FROM words
WHERE meaning_zh LIKE '%人名%'
   OR meaning_zh LIKE '%中文名%'
   OR (meaning_zh LIKE '%姓氏%' AND word IN ('liu'))
ORDER BY word
"""

FK_TABLES = [
    "library_words",
    "user_wordbook",
    "user_word_assignments",
    "game_word_assignments",
    "user_word_corrections",
    "section_words",
]


def parse_word_list(text: str) -> list[str]:
    return [w.strip().lower() for w in text.strip().rstrip(";").split(",") if w.strip()]


def write_word_list(path: Path, words: list[str]) -> None:
    path.write_text(",".join(words) + ";", encoding="utf-8")


def remove_from_word_files(names: set[str]) -> dict[str, int]:
    removed: dict[str, int] = {}
    for path in WORD_LIST_FILES:
        if not path.exists():
            continue
        words = parse_word_list(path.read_text(encoding="utf-8"))
        kept = [w for w in words if w not in names]
        removed[path.name] = len(words) - len(kept)
        if removed[path.name]:
            write_word_list(path, kept)
    return removed


def main() -> None:
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    rows = cur.execute(NAME_SQL).fetchall()
    if not rows:
        print("未找到人名单词")
        return

    word_ids = [row[0] for row in rows]
    names = {row[1].lower() for row in rows}
    placeholders = ",".join("?" * len(word_ids))

    print(f"将删除 {len(word_ids)} 个人名单词：")
    print(", ".join(sorted(names)))

    cur.execute("PRAGMA foreign_keys = OFF")
    try:
        for table in FK_TABLES:
            cur.execute(f"DELETE FROM {table} WHERE word_id IN ({placeholders})", word_ids)

        name_list = list(names)
        name_ph = ",".join("?" * len(name_list))
        cur.execute(f"DELETE FROM user_known_words WHERE lower(word) IN ({name_ph})", name_list)
        cur.execute(f"DELETE FROM user_word_progress WHERE lower(word) IN ({name_ph})", name_list)
        cur.execute(f"DELETE FROM fv_known_words WHERE lower(word) IN ({name_ph})", name_list)
        cur.execute(f"DELETE FROM fv_learning_words WHERE lower(word) IN ({name_ph})", name_list)
        cur.execute(f"DELETE FROM user_planet_familiarity WHERE lower(word) IN ({name_ph})", name_list)

        cur.execute(f"DELETE FROM words WHERE id IN ({placeholders})", word_ids)
    finally:
        cur.execute("PRAGMA foreign_keys = ON")

    cur.execute(
        """
        UPDATE learning_libraries
        SET word_count = (
          SELECT COUNT(*) FROM library_words lw WHERE lw.library_id = learning_libraries.id
        )
        """
    )

    conn.commit()
    conn.close()

    file_removed = remove_from_word_files(names)
    print(f"\n已从数据库删除 {len(word_ids)} 词")
    for filename, count in file_removed.items():
        if count:
            print(f"  {filename}: 移除 {count} 词")


if __name__ == "__main__":
    main()
