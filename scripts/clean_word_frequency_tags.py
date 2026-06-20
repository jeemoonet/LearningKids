#!/usr/bin/env python3
"""批量清洗 words 表中误入的频率标注，并写入 freq_level / freq_label 等字段。"""

from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_DB = ROOT / "server" / "data" / "app.db"
CACHE_FILE = ROOT / "material" / "english" / "vocab_cache.json"
VOCAB_FILE = ROOT / "material" / "english" / "单词表.md"

WORD_FREQ_RE = re.compile(
    r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)\s+\[(高|中|低)频\]\s+\((\d+)届/(\d+)次\)$"
)
FREQ_LINE_RE = re.compile(
    r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)\s+\[(高|中|低)频\]\s+\((\d+)届/(\d+)次\)"
)
STRIP_TAG_RE = re.compile(
    r"\s*\[(?:高|中|低)频\]\s*(?:[\(（]\d+届/\d+次[\)）]|\(\d+届/\d+次\))"
)
PHONETIC_STRIP_RE = re.compile(r"\s*(?:高|中|低)频\s*\*?\s*\d+届/\d+次\*?\s*")

FREQ_LEVEL_MAP = {"高": "high", "中": "medium", "低": "low"}
FREQ_LABEL_MAP = {"high": "高频", "medium": "中频", "low": "低频"}

FREQ_COLUMNS = (
    ("freq_level", "TEXT NOT NULL DEFAULT 'low'"),
    ("freq_label", "TEXT NOT NULL DEFAULT '低频'"),
    ("exam_year_count", "INTEGER NOT NULL DEFAULT 0"),
    ("exam_total_count", "INTEGER NOT NULL DEFAULT 0"),
)

TEXT_FIELDS = (
    "phonetic",
    "meaning_zh",
    "similar1",
    "similar2",
    "similar3",
    "example_en",
    "example_zh",
)


@dataclass(frozen=True)
class WordFrequency:
    word: str
    freq_level: str
    freq_label: str
    exam_year_count: int
    exam_total_count: int


def parse_frequencies_from_vocab(path: Path) -> dict[str, WordFrequency]:
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


def parse_polluted_word(raw: str) -> tuple[str, WordFrequency | None]:
    m = WORD_FREQ_RE.match(raw.strip())
    if not m:
        return raw.strip(), None
    word, zh_level, year_count, total_count = m.groups()
    level = FREQ_LEVEL_MAP[zh_level]
    return word.lower(), WordFrequency(
        word=word.lower(),
        freq_level=level,
        freq_label=FREQ_LABEL_MAP[level],
        exam_year_count=int(year_count),
        exam_total_count=int(total_count),
    )


def strip_freq_tags(text: str | None) -> str:
    if not text:
        return ""
    cleaned = STRIP_TAG_RE.sub("", text)
    cleaned = PHONETIC_STRIP_RE.sub("", cleaned)
    return cleaned.strip()


def ensure_freq_columns(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    existing = {row[1] for row in cur.execute("PRAGMA table_info(words)").fetchall()}
    for name, ddl in FREQ_COLUMNS:
        if name not in existing:
            cur.execute(f"ALTER TABLE words ADD COLUMN {name} {ddl}")


def load_clean_cache() -> dict[str, dict]:
    if not CACHE_FILE.exists():
        return {}
    cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return {key: value for key, value in cache.items() if not WORD_FREQ_RE.match(key)}


def clean_cache_file() -> int:
    if not CACHE_FILE.exists():
        return 0
    cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    polluted = [key for key in cache if WORD_FREQ_RE.match(key)]
    if not polluted:
        return 0
    for key in polluted:
        del cache[key]
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(polluted)


def migrate_user_word_progress(conn: sqlite3.Connection, word_map: dict[str, str]) -> tuple[int, int]:
    cur = conn.cursor()
    updated = 0
    merged = 0

    for old_word, new_word in word_map.items():
        if old_word == new_word:
            continue
        rows = cur.execute(
            """
            SELECT user_id, familiarity, exam_count, exam_error_count, last_exam_at,
                   consecutive_correct, self_marked, last_seen, next_due, updated_at
            FROM user_word_progress
            WHERE word = ?
            """,
            (old_word,),
        ).fetchall()
        for row in rows:
            user_id = row[0]
            existing = cur.execute(
                "SELECT familiarity, exam_count, exam_error_count, last_exam_at, consecutive_correct, self_marked, last_seen, next_due, updated_at FROM user_word_progress WHERE user_id = ? AND word = ?",
                (user_id, new_word),
            ).fetchone()
            if existing:
                cur.execute(
                    """
                    UPDATE user_word_progress SET
                        familiarity = MAX(familiarity, ?),
                        exam_count = MAX(exam_count, ?),
                        exam_error_count = MAX(exam_error_count, ?),
                        consecutive_correct = MAX(consecutive_correct, ?),
                        self_marked = MAX(self_marked, ?),
                        last_seen = MAX(last_seen, ?),
                        next_due = MIN(next_due, ?),
                        updated_at = MAX(updated_at, ?),
                        last_exam_at = CASE
                            WHEN ? IS NULL THEN last_exam_at
                            WHEN last_exam_at IS NULL THEN ?
                            ELSE MAX(last_exam_at, ?)
                        END
                    WHERE user_id = ? AND word = ?
                    """,
                    (
                        row[1], row[2], row[3], row[5], row[6], row[7], row[8], row[9],
                        row[4], row[4], row[4],
                        user_id, new_word,
                    ),
                )
                cur.execute(
                    "DELETE FROM user_word_progress WHERE user_id = ? AND word = ?",
                    (user_id, old_word),
                )
                merged += 1
            else:
                cur.execute(
                    "UPDATE user_word_progress SET word = ? WHERE user_id = ? AND word = ?",
                    (new_word, user_id, old_word),
                )
                updated += 1

    return updated, merged


def migrate_user_word_corrections(conn: sqlite3.Connection, word_map: dict[str, str]) -> int:
    cur = conn.cursor()
    updated = 0
    for old_word, new_word in word_map.items():
        if old_word == new_word:
            continue
        cur.execute(
            "UPDATE user_word_corrections SET word = ? WHERE word = ?",
            (new_word, old_word),
        )
        updated += cur.rowcount
    return updated


def clean_words_table(conn: sqlite3.Connection) -> dict[str, int]:
    ensure_freq_columns(conn)
    vocab_freq = parse_frequencies_from_vocab(VOCAB_FILE)
    cache = load_clean_cache()
    cur = conn.cursor()

    rows = cur.execute(
        f"""
        SELECT id, word, {", ".join(TEXT_FIELDS)}
        FROM words
        ORDER BY id
        """
    ).fetchall()
    columns = ["id", "word", *TEXT_FIELDS]

    word_map: dict[str, str] = {}
    stats = {
        "total": len(rows),
        "cleaned_word": 0,
        "fields_from_cache": 0,
        "fields_stripped": 0,
    }

    for row in rows:
        record = dict(zip(columns, row))
        word_id = record["id"]
        raw_word = record["word"]
        base_word, parsed = parse_polluted_word(raw_word)
        freq = parsed or vocab_freq.get(base_word)
        word_map[raw_word] = base_word

        updates: dict[str, object] = {"word": base_word}
        if freq:
            updates.update(
                {
                    "freq_level": freq.freq_level,
                    "freq_label": freq.freq_label,
                    "exam_year_count": freq.exam_year_count,
                    "exam_total_count": freq.exam_total_count,
                }
            )

        cache_entry = cache.get(base_word)
        for field in TEXT_FIELDS:
            current = record[field] or ""
            if cache_entry and cache_entry.get(field):
                clean_value = cache_entry[field]
                stats["fields_from_cache"] += 1
            else:
                clean_value = strip_freq_tags(current)
                if clean_value != current:
                    stats["fields_stripped"] += 1
            updates[field] = clean_value

        if base_word != raw_word:
            stats["cleaned_word"] += 1

        set_clause = ", ".join(f"{key} = ?" for key in updates)
        cur.execute(
            f"UPDATE words SET {set_clause} WHERE id = ?",
            (*updates.values(), word_id),
        )

    progress_updated, progress_merged = migrate_user_word_progress(conn, word_map)
    corrections_updated = migrate_user_word_corrections(conn, word_map)

    conn.commit()

    stats["progress_updated"] = progress_updated
    stats["progress_merged"] = progress_merged
    stats["corrections_updated"] = corrections_updated
    return stats


def verify(conn: sqlite3.Connection) -> dict[str, int]:
    cur = conn.cursor()
    polluted = cur.execute(
        "SELECT COUNT(*) FROM words WHERE word LIKE '%频]%' OR meaning_zh LIKE '%频]%'"
    ).fetchone()[0]
    freq_stats = {
        row[0]: row[1]
        for row in cur.execute(
            "SELECT freq_label, COUNT(*) FROM words GROUP BY freq_label"
        ).fetchall()
    }
    return {"polluted_remaining": polluted, **freq_stats}


def main() -> None:
    if not APP_DB.exists():
        raise SystemExit(f"未找到数据库：{APP_DB}")

    conn = sqlite3.connect(APP_DB)
    try:
        stats = clean_words_table(conn)
        cache_removed = clean_cache_file()
        check = verify(conn)
    finally:
        conn.close()

    print(f"[OK] 已清洗 {APP_DB}")
    print(f"     words 总数: {stats['total']}")
    print(f"     修正 word 字段: {stats['cleaned_word']}")
    print(f"     文本字段来自缓存: {stats['fields_from_cache']}")
    print(f"     文本字段正则剥离: {stats['fields_stripped']}")
    print(f"     用户进度更新: {stats['progress_updated']} | 合并: {stats['progress_merged']}")
    print(f"     用户订正更新: {stats['corrections_updated']}")
    print(f"     vocab_cache 删除污染键: {cache_removed}")
    print(f"     残留污染: {check['polluted_remaining']}")
    print(
        "     频率分布: "
        + " | ".join(f"{k}={v}" for k, v in check.items() if k != "polluted_remaining")
    )


if __name__ == "__main__":
    main()
