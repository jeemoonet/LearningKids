#!/usr/bin/env python3
"""从 app.db 导出各层级中考高频词（纯单词列表）到 server/data。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_DB = ROOT / "server" / "data" / "app.db"
OUT_DIR = ROOT / "server" / "data"

TIER_FILES = {
    "beginner": "中考高频词-初级组.md",
    "intermediate": "中考高频词-中级组.md",
    "advanced": "中考高频词-高级组.md",
}


def fetch_words(conn: sqlite3.Connection, tier_id: str) -> list[str]:
    rows = conn.execute(
        """
        SELECT word FROM words
        WHERE tier_id = ? AND freq_label = '高频'
        ORDER BY exam_year_count DESC, exam_total_count DESC, word ASC
        """,
        (tier_id,),
    ).fetchall()
    return [row[0] for row in rows]


def format_word_list(words: list[str]) -> str:
    if not words:
        return ""
    return ", ".join(words) + ";"


def main() -> None:
    if not APP_DB.exists():
        raise SystemExit(f"未找到数据库：{APP_DB}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(APP_DB)

    try:
        for tier_id, filename in TIER_FILES.items():
            words = fetch_words(conn, tier_id)
            out_path = OUT_DIR / filename
            out_path.write_text(format_word_list(words) + "\n", encoding="utf-8")
            print(f"[OK] {out_path} ({len(words)} 词)")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
