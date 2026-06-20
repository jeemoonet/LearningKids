#!/usr/bin/env python3
"""将单词表中的考试频率数据同步到 server/data/app.db 的 words 表。"""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOCAB_FILE = ROOT / "material" / "english" / "单词表.md"
APP_DB = ROOT / "server" / "data" / "app.db"

FREQ_LINE_RE = re.compile(
    r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)\s+\[(高|中|低)频\]\s+\((\d+)届/(\d+)次\)"
)
FREQ_LEVEL_MAP = {"高": "high", "中": "medium", "低": "low"}
FREQ_LABEL_MAP = {"high": "高频", "medium": "中频", "low": "低频"}

FREQ_COLUMNS = (
    ("freq_level", "TEXT NOT NULL DEFAULT 'low'"),
    ("freq_label", "TEXT NOT NULL DEFAULT '低频'"),
    ("exam_year_count", "INTEGER NOT NULL DEFAULT 0"),
    ("exam_total_count", "INTEGER NOT NULL DEFAULT 0"),
)


@dataclass(frozen=True)
class WordFrequency:
    word: str
    freq_level: str
    freq_label: str
    exam_year_count: int
    exam_total_count: int


def parse_frequencies(path: Path) -> dict[str, WordFrequency]:
    """从 单词表.md 解析频率数据。"""
    result: dict[str, WordFrequency] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        m = FREQ_LINE_RE.match(line.strip())
        if not m:
            continue
        word, zh_level, year_count, total_count = m.groups()
        level = FREQ_LEVEL_MAP[zh_level]
        result[word.lower()] = WordFrequency(
            word=word.lower(),
            freq_level=level,
            freq_label=FREQ_LABEL_MAP[level],
            exam_year_count=int(year_count),
            exam_total_count=int(total_count),
        )
    return result


def ensure_freq_columns(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    existing = {row[1] for row in cur.execute("PRAGMA table_info(words)").fetchall()}
    for name, ddl in FREQ_COLUMNS:
        if name not in existing:
            cur.execute(f"ALTER TABLE words ADD COLUMN {name} {ddl}")


def sync_to_db(frequencies: dict[str, WordFrequency]) -> tuple[int, int, int]:
    if not APP_DB.exists():
        raise SystemExit(f"未找到数据库：{APP_DB}")

    conn = sqlite3.connect(APP_DB)
    try:
        ensure_freq_columns(conn)
        cur = conn.cursor()

        rows = cur.execute("SELECT id, word FROM words").fetchall()
        updated = 0
        missing = 0

        for word_id, word in rows:
            freq = frequencies.get(word.lower())
            if not freq:
                missing += 1
                continue
            cur.execute(
                """
                UPDATE words
                SET freq_level = ?, freq_label = ?, exam_year_count = ?, exam_total_count = ?
                WHERE id = ?
                """,
                (
                    freq.freq_level,
                    freq.freq_label,
                    freq.exam_year_count,
                    freq.exam_total_count,
                    word_id,
                ),
            )
            updated += 1

        conn.commit()
        return len(rows), updated, missing
    finally:
        conn.close()


def main() -> None:
    if not VOCAB_FILE.exists():
        raise SystemExit(f"未找到单词表：{VOCAB_FILE}")

    frequencies = parse_frequencies(VOCAB_FILE)
    if not frequencies:
        raise SystemExit("单词表中未解析到频率数据，请先运行 scripts/vocab_exam_frequency.py")

    total, updated, missing = sync_to_db(frequencies)
    stats = {"high": 0, "medium": 0, "low": 0}
    for freq in frequencies.values():
        stats[freq.freq_level] += 1

    print(f"[OK] 已同步频率到 {APP_DB}")
    print(f"     单词表频率条目: {len(frequencies)}")
    print(f"     words 表总数: {total} | 已更新: {updated} | 未匹配: {missing}")
    print(f"     高频: {stats['high']} | 中频: {stats['medium']} | 低频: {stats['low']}")


if __name__ == "__main__":
    main()
