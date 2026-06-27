#!/usr/bin/env python3
"""自由背单词 M1：为 words 表标注 pronoun，并修正初级组词性错误。

用法:
  python scripts/annotate_free_vocab_pos.py [--dry-run]
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
from collections import Counter
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from word_pos_utils import FIXED_PRONOUNS, POS_LABEL, is_pronoun, refine_other_pos  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"

# 初级组常见误标修正（与 fix_beginner_pos.py 保持一致）
BEGINNER_POS_FIXES: dict[str, str] = {
    "brave": "adj",
    "dear": "adj",
    "eager": "adj",
    "fair": "adj",
    "glad": "adj",
    "heavy": "adj",
    "main": "adj",
    "old": "adj",
    "okay": "adj",
    "quiet": "adj",
    "quick": "adj",
    "real": "adj",
    "same": "adj",
    "tall": "adj",
    "tidy": "adj",
    "wild": "adj",
    "cheat": "verb",
    "hope": "verb",
    "need": "verb",
    "use": "verb",
    "fit": "adj",
    "full": "adj",
    "shy": "adj",
}


def resolve_pos(word: str, current_pos: str) -> str:
    if is_pronoun(word):
        return "pronoun"
    if word in BEGINNER_POS_FIXES:
        return BEGINNER_POS_FIXES[word]
    if current_pos in ("noun", "verb", "adj", "adv", "pronoun", "prep"):
        return current_pos
    return refine_other_pos(word)


def sync_known_word_pos(cur: sqlite3.Cursor) -> tuple[int, int]:
    cur.execute(
        """
        UPDATE user_known_words
        SET pos = (
          SELECT w.pos FROM words w
          WHERE lower(w.word) = lower(user_known_words.word)
          LIMIT 1
        )
        WHERE EXISTS (
          SELECT 1 FROM words w
          WHERE lower(w.word) = lower(user_known_words.word)
            AND w.pos != user_known_words.pos
        )
        """
    )
    user_count = cur.rowcount
    cur.execute(
        """
        UPDATE fv_known_words
        SET pos = (
          SELECT w.pos FROM words w
          WHERE lower(w.word) = lower(fv_known_words.word)
          LIMIT 1
        )
        WHERE EXISTS (
          SELECT 1 FROM words w
          WHERE lower(w.word) = lower(fv_known_words.word)
            AND w.pos != fv_known_words.pos
        )
        """
    )
    return user_count, cur.rowcount


def print_tier_stats(cur: sqlite3.Cursor, tier_id: str) -> None:
    rows = cur.execute(
        """
        SELECT pos, pos_label, COUNT(*) AS cnt
        FROM words
        WHERE tier_id = ?
        GROUP BY pos, pos_label
        ORDER BY cnt DESC
        """,
        (tier_id,),
    ).fetchall()

    print(f"\n[{tier_id}] 词性分布:")
    for pos, pos_label, cnt in rows:
        print(f"  {pos} ({pos_label}): {cnt}")

    draw_pools = cur.execute(
        """
        SELECT pos, COUNT(*) AS cnt
        FROM words
        WHERE tier_id = ? AND pos IN ('noun', 'verb', 'adj')
        GROUP BY pos
        ORDER BY pos
        """,
        (tier_id,),
    ).fetchall()
    print(f"\n[{tier_id}] 初始化抽题池（名/动/形）:")
    for pos, cnt in draw_pools:
        print(f"  {pos}: {cnt} 个可用")

    pronouns = cur.execute(
        """
        SELECT word FROM words
        WHERE tier_id = ? AND pos = 'pronoun'
        ORDER BY word
        """,
        (tier_id,),
    ).fetchall()
    print(f"\n[{tier_id}] 已标注代词 ({len(pronouns)}):")
    if pronouns:
        print("  " + ", ".join(row[0] for row in pronouns))
    else:
        print("  （无）")

    missing = sorted(FIXED_PRONOUNS - {row[0] for row in pronouns})
    if missing:
        print(f"\n[{tier_id}] 固定代词中未出现在词库的词（初始化时由系统直接种入）:")
        print("  " + ", ".join(missing))


def main() -> None:
    parser = argparse.ArgumentParser(description="标注自由背单词所需词性")
    parser.add_argument("--dry-run", action="store_true", help="仅预览，不写库")
    args = parser.parse_args()

    if not DB_FILE.exists():
        print(f"数据库不存在: {DB_FILE}", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    rows = cur.execute("SELECT id, word, pos, tier_id FROM words ORDER BY id").fetchall()
    updates: list[tuple[str, str, int]] = []
    stats = Counter()

    for word_id, word, old_pos, _tier_id in rows:
        new_pos = resolve_pos(str(word), str(old_pos))
        stats[new_pos] += 1
        if new_pos != old_pos:
            updates.append((new_pos, POS_LABEL[new_pos], int(word_id)))

    print("全库词性分布（迁移后预览）:")
    for pos in sorted(stats.keys()):
        print(f"  {pos} ({POS_LABEL.get(pos, pos)}): {stats[pos]}")

    print(f"\n待更新: {len(updates)} 条")
    for new_pos, new_label, word_id in updates[:20]:
        row = cur.execute("SELECT word, pos FROM words WHERE id = ?", (word_id,)).fetchone()
        if row:
            print(f"  {row[0]}: {row[1]} -> {new_pos} ({new_label})")
    if len(updates) > 20:
        print(f"  ... 另有 {len(updates) - 20} 条")

    if args.dry_run:
        print("\n[dry-run] 未写入数据库。")
    else:
        cur.executemany(
            "UPDATE words SET pos = ?, pos_label = ? WHERE id = ?",
            updates,
        )
        conn.commit()
        print(f"\n已更新 {len(updates)} 条记录。")
        user_sync, fv_sync = sync_known_word_pos(cur)
        conn.commit()
        print(f"已同步 user_known_words: {user_sync} 条，fv_known_words: {fv_sync} 条。")

    print_tier_stats(cur, "beginner")

    conn.close()


if __name__ == "__main__":
    main()
