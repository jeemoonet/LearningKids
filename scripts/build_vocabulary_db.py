#!/usr/bin/env python3
"""从单词表生成 SQLite 词汇库，含分组、音标、释义、相似词与例句。"""

from __future__ import annotations

import json
import random
import re
import sqlite3
import time
from pathlib import Path

import eng_to_ipa as ipa
import nltk
from deep_translator import GoogleTranslator
from nltk.corpus import wordnet as wn

ROOT = Path(__file__).resolve().parents[1]
WORD_LIST = ROOT / "material" / "english" / "单词表.md"
CACHE_FILE = ROOT / "material" / "english" / "vocab_cache.json"
DB_FILE = ROOT / "server" / "data" / "app.db"
LEGACY_DB_FILE = ROOT / "src" / "public" / "data" / "vocabulary.db"

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

TIER_CONFIG = {
    "beginner": {"label": "初级组", "count": 500, "groups": 25, "group_size": 20},
    "intermediate": {"label": "中级组", "count": 585, "groups": 25, "group_size": 24},
    "advanced": {"label": "高级组", "count": 585, "groups": 25, "group_size": 24},
}

THEMES = [
    "校园生活", "家庭生活", "体育运动", "旅行探索", "自然环境",
    "健康饮食", "科技创新", "情感表达", "工作职业", "购物消费",
    "城市交通", "艺术文化", "天气变化", "友谊社交", "学习方法",
    "节日庆典", "动物世界", "时间管理", "安全保护", "梦想未来",
    "阅读写作", "音乐娱乐", "帮助他人", "解决问题", "成长经历",
]

POS_LABEL = {"noun": "名词", "verb": "动词", "adj": "形容词", "adv": "副词", "other": "其他"}

EXAMPLE_TEMPLATES = {
    "noun": [
        "The {word} plays an important role in this story.",
        "We talked about the {word} during our English class.",
        "Every student should know the meaning of {word}.",
    ],
    "verb": [
        "Students {word} new skills every day at school.",
        "You should {word} carefully in the exam.",
        "They {word} together to finish the project.",
    ],
    "adj": [
        "It is {word} to review words every morning.",
        "The classroom is very {word} today.",
        "She feels {word} about the exam result.",
    ],
    "adv": [
        "She answered {word} and got full marks.",
        "He runs {word} on the playground.",
        "Remember to speak {word} in class.",
    ],
    "other": [
        "Remember to use {word} in your writing.",
        "We learned how to use {word} in a sentence.",
        "Practice {word} with your classmates.",
    ],
}


def ensure_nltk() -> None:
    nltk.download("wordnet", quiet=True)
    nltk.download("omw-1.4", quiet=True)


WORD_LINE_RE = re.compile(r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)")
FREQ_LINE_RE = re.compile(
    r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)\s+\[(高|中|低)频\]\s+\((\d+)届/(\d+)次\)"
)
FREQ_LEVEL_MAP = {"高": "high", "中": "medium", "低": "low"}
FREQ_LABEL_MAP = {"high": "高频", "medium": "中频", "low": "低频"}


def parse_word_list(path: Path) -> dict[str, list[str]]:
    text = path.read_text(encoding="utf-8")
    buckets: dict[str, list[str]] = {"noun": [], "verb": [], "adj": [], "adv": [], "other": []}
    current = None
    section_map = {
        "## 名词": "noun",
        "## 动词": "verb",
        "## 形容词": "adj",
        "## 副词": "adv",
        "## 其他": "other",
    }
    for line in text.splitlines():
        line = line.strip()
        for prefix, pos in section_map.items():
            if line.startswith(prefix):
                current = pos
                break
        else:
            if line.startswith("### "):
                continue
            if not line or line.startswith("#") or line.startswith(">"):
                continue
            if current:
                m = WORD_LINE_RE.match(line)
                if m:
                    buckets[current].append(m.group(1).lower())
    return buckets


def parse_frequencies(path: Path) -> dict[str, dict]:
    result: dict[str, dict] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        m = FREQ_LINE_RE.match(line.strip())
        if not m:
            continue
        word, zh_level, year_count, total_count = m.groups()
        level = FREQ_LEVEL_MAP[zh_level]
        result[word.lower()] = {
            "freq_level": level,
            "freq_label": FREQ_LABEL_MAP[level],
            "exam_year_count": int(year_count),
            "exam_total_count": int(total_count),
        }
    return result


def word_difficulty(word: str) -> float:
    score = len(word) * 1.2
    if word[0].isupper():
        score += 2
    if re.search(r"[^a-z]", word):
        score += 3
    if not wn.synsets(word):
        score += 4
    return score


def pick_words_by_tier(buckets: dict[str, list[str]]) -> dict[str, list[dict]]:
    all_words: list[dict] = []
    for pos, words in buckets.items():
        for word in words:
            all_words.append({"word": word, "pos": pos, "difficulty": word_difficulty(word)})

    all_words.sort(key=lambda item: item["difficulty"])

    tiers: dict[str, list[dict]] = {}
    cursor = 0
    for tier, cfg in TIER_CONFIG.items():
        count = min(cfg["count"], len(all_words) - cursor)
        tiers[tier] = all_words[cursor : cursor + count]
        cursor += count
    return tiers


def assign_sort_order(tier_words: list[dict]) -> list[dict]:
    """为大组内单词赋予全局排序（不再预分配小组）。"""
    sorted_words = sorted(tier_words, key=lambda item: item["word"])
    return [{**item, "sort_order": index} for index, item in enumerate(sorted_words)]


def load_cache() -> dict:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict) -> None:
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def get_similar_words(word: str) -> list[str]:
    similar: list[str] = []
    for syn in wn.synsets(word):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ").lower()
            if name != word and name not in similar:
                similar.append(name)
            if len(similar) >= 3:
                return similar
    while len(similar) < 3:
        similar.append(word)
    return similar[:3]


def get_english_definition(word: str, pos: str) -> str:
    pos_map = {"noun": "n", "verb": "v", "adj": "a", "adv": "r", "other": None}
    wanted = pos_map.get(pos)
    synsets = wn.synsets(word, pos=wanted) if wanted else wn.synsets(word)
    if synsets:
        return synsets[0].definition()
    return f"a common English word: {word}"


def translate_zh(text: str, translator: GoogleTranslator) -> str:
    try:
        return translator.translate(text)
    except Exception:
        return text


def build_entry(word: str, pos: str, theme: str, cache: dict, translator: GoogleTranslator | None) -> dict:
    if word in cache:
        return cache[word]

    phonetic = ""
    try:
        phonetic = f"/{ipa.convert(word)}/"
    except Exception:
        phonetic = ""

    definition = get_english_definition(word, pos)
    meaning_zh = ""
    if translator is not None:
        meaning_zh = translate_zh(definition, translator)
    if not meaning_zh:
        meaning_zh = f"{word}：{definition[:80]}"
    similar = get_similar_words(word)
    template = random.choice(EXAMPLE_TEMPLATES[pos])
    example_en = template.format(word=word)
    example_zh = translate_zh(example_en, translator) if translator else f"例句：{example_en}"
    if not example_zh:
        example_zh = f"例句：{example_en}"

    entry = {
        "phonetic": phonetic,
        "meaning_zh": meaning_zh,
        "similar1": similar[0],
        "similar2": similar[1],
        "similar3": similar[2],
        "example_en": example_en,
        "example_zh": example_zh,
        "story_theme": theme,
    }
    cache[word] = entry
    return entry


def backup_user_progress(conn: sqlite3.Connection) -> list[dict]:
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT user_id, word, familiarity, exam_count, exam_error_count,
                   last_exam_at, consecutive_correct, self_marked,
                   last_seen, next_due, updated_at
            FROM user_word_progress
            """
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]
    except sqlite3.OperationalError:
        return []


def restore_user_progress(conn: sqlite3.Connection, saved: list[dict]) -> None:
    if not saved:
        return
    cur = conn.cursor()
    cur.executemany(
        """
        INSERT INTO user_word_progress (
            user_id, word, familiarity, exam_count, exam_error_count, last_exam_at,
            consecutive_correct, self_marked, last_seen, next_due, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, word) DO UPDATE SET
            familiarity = excluded.familiarity,
            exam_count = excluded.exam_count,
            exam_error_count = excluded.exam_error_count,
            last_exam_at = excluded.last_exam_at,
            consecutive_correct = excluded.consecutive_correct,
            self_marked = excluded.self_marked,
            last_seen = excluded.last_seen,
            next_due = excluded.next_due,
            updated_at = excluded.updated_at
        """,
        [
            (
                row["user_id"],
                row["word"],
                row["familiarity"],
                row["exam_count"],
                row["exam_error_count"],
                row["last_exam_at"],
                row["consecutive_correct"],
                row["self_marked"],
                row["last_seen"],
                row["next_due"],
                row["updated_at"],
            )
            for row in saved
        ],
    )


def migrate_legacy_vocabulary_db(conn: sqlite3.Connection) -> None:
    if not LEGACY_DB_FILE.exists():
        return
    legacy = sqlite3.connect(LEGACY_DB_FILE)
    legacy.row_factory = sqlite3.Row
    try:
        tables = {
            row[0]
            for row in legacy.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        if "words" not in tables:
            return
        cur = conn.cursor()
        for table in ("tiers", "words"):
            if table not in tables:
                continue
            rows = legacy.execute(f"SELECT * FROM {table}").fetchall()
            if not rows:
                continue
            columns = rows[0].keys()
            placeholders = ", ".join("?" for _ in columns)
            col_names = ", ".join(columns)
            cur.executemany(
                f"INSERT OR IGNORE INTO {table} ({col_names}) VALUES ({placeholders})",
                [tuple(row[col] for col in columns) for row in rows],
            )
        conn.commit()
        print(f"[migrate] imported vocabulary from {LEGACY_DB_FILE}")
    finally:
        legacy.close()


def create_database(records: list[dict]) -> None:
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    db_exists = DB_FILE.exists()
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.executescript(USER_SCHEMA_SQL)

    saved_progress: list[dict] = []
    if db_exists:
        saved_progress = backup_user_progress(conn)
        cur.execute("PRAGMA foreign_keys = OFF")
        cur.executescript(
            """
            DROP TABLE IF EXISTS words;
            DROP TABLE IF EXISTS tiers;
            """
        )
        cur.execute("PRAGMA foreign_keys = ON")
    elif LEGACY_DB_FILE.exists() and conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='words'"
    ).fetchone() is None:
        migrate_legacy_vocabulary_db(conn)

    cur.executescript(
        """
        CREATE TABLE tiers (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            word_count INTEGER NOT NULL,
            group_count INTEGER NOT NULL DEFAULT 0,
            group_size INTEGER NOT NULL DEFAULT 20
        );

        CREATE TABLE words (
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
            sort_order INTEGER NOT NULL,
            freq_level TEXT NOT NULL DEFAULT 'low',
            freq_label TEXT NOT NULL DEFAULT '低频',
            exam_year_count INTEGER NOT NULL DEFAULT 0,
            exam_total_count INTEGER NOT NULL DEFAULT 0
        );
        """
    )

    for tier_id, cfg in TIER_CONFIG.items():
        cur.execute(
            "INSERT INTO tiers (id, label, word_count, group_count, group_size) VALUES (?, ?, ?, ?, ?)",
            (tier_id, cfg["label"], cfg["count"], 0, cfg["group_size"]),
        )

    for record in records:
        cur.execute(
            """
            INSERT INTO words (
                word, phonetic, pos, pos_label, meaning_zh,
                similar1, similar2, similar3,
                example_en, example_zh,
                tier_id, sort_order,
                freq_level, freq_label, exam_year_count, exam_total_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["word"],
                record["phonetic"],
                record["pos"],
                POS_LABEL[record["pos"]],
                record["meaning_zh"],
                record["similar1"],
                record["similar2"],
                record["similar3"],
                record["example_en"],
                record["example_zh"],
                record["tier_id"],
                record["sort_order"],
                record.get("freq_level", "low"),
                record.get("freq_label", "低频"),
                record.get("exam_year_count", 0),
                record.get("exam_total_count", 0),
            ),
        )

    restore_user_progress(conn, saved_progress)

    conn.commit()
    conn.close()


def main() -> None:
    import sys

    offline = "--offline" in sys.argv
    ensure_nltk()
    buckets = parse_word_list(WORD_LIST)
    frequencies = parse_frequencies(WORD_LIST)
    tiers = pick_words_by_tier(buckets)

    cache = load_cache()
    translator = None if offline else GoogleTranslator(source="en", target="zh-CN")
    records: list[dict] = []

    for tier_id, tier_words in tiers.items():
        ordered = assign_sort_order(tier_words)
        total = len(ordered)
        for index, item in enumerate(ordered, start=1):
            entry = build_entry(item["word"], item["pos"], "", cache, translator)
            freq = frequencies.get(item["word"], {})
            records.append(
                {
                    "tier_id": tier_id,
                    "sort_order": item["sort_order"],
                    "word": item["word"],
                    "pos": item["pos"],
                    **entry,
                    **freq,
                }
            )
            if index % 50 == 0 or index == total:
                save_cache(cache)
                print(f"  processed {index}/{total} ({tier_id})", flush=True)

    save_cache(cache)
    create_database(records)
    print(f"[OK] {DB_FILE} ({len(records)} words)")


if __name__ == "__main__":
    main()
