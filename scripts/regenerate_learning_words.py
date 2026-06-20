#!/usr/bin/env python3
"""按 DOC-PROD-001 规则，重新生成初级组「学习」场景单词的释义、例句与关联词。"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"
CONTENT_FILE = ROOT / "scripts" / "data" / "learning-scene-words.json"


def load_learning_word_ids(conn: sqlite3.Connection) -> list[tuple[int, str]]:
    rows = conn.execute(
        """
        SELECT DISTINCT w.id, w.word
        FROM game_tier_groups g
        JOIN game_word_assignments a
          ON a.tier_id = g.tier_id AND a.group_index = g.group_index
        JOIN words w ON w.id = a.word_id
        WHERE g.tier_id = 'beginner' AND g.title LIKE '学习%'
        ORDER BY g.group_index, w.sort_order, w.id
        """
    ).fetchall()
    return [(int(row[0]), str(row[1])) for row in rows]


def main() -> None:
    content = json.loads(CONTENT_FILE.read_text(encoding="utf-8"))
    conn = sqlite3.connect(DB_FILE)
    word_rows = load_learning_word_ids(conn)

    update = conn.cursor()
    updated = 0
    missing: list[str] = []

    for word_id, word in word_rows:
        entry = content.get(word)
        if not entry:
            missing.append(word)
            continue
        update.execute(
            """
            UPDATE words
            SET meaning_zh = ?, example_en = ?, example_zh = ?,
                similar1 = ?, similar2 = ?, similar3 = ?
            WHERE id = ?
            """,
            (
                entry["meaning_zh"],
                entry["example_en"],
                entry["example_zh"],
                entry.get("similar1", ""),
                entry.get("similar2", ""),
                entry.get("similar3", ""),
                word_id,
            ),
        )
        updated += 1
        print(f"  OK  {word:8}  {entry['meaning_zh']}")

    conn.commit()
    conn.close()

    print(f"\n已更新 {updated}/{len(word_rows)} 个学习场景单词")
    if missing:
        print("缺少词库数据：", ", ".join(missing))


if __name__ == "__main__":
    main()
