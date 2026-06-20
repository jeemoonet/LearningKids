#!/usr/bin/env python3
"""将 words 表中 other 类细分为 adj / adv / other，并更新 pos / pos_label。"""

from __future__ import annotations

import sqlite3
import sys
from collections import Counter
from pathlib import Path

import nltk

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"

sys.path.insert(0, str(ROOT / "scripts"))
from word_pos_utils import POS_LABEL, classify_word_pos, refine_other_pos  # noqa: E402


def ensure_nltk() -> None:
    nltk.download("wordnet", quiet=True)
    nltk.download("omw-1.4", quiet=True)


def main() -> None:
    ensure_nltk()

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    rows = cur.execute("SELECT id, word, pos FROM words ORDER BY id").fetchall()
    stats = Counter()
    updates: list[tuple[str, str, int]] = []

    for row in rows:
        word = str(row["word"])
        old_pos = str(row["pos"])
        if old_pos in ("noun", "verb"):
            new_pos = old_pos
        elif old_pos == "adj":
            new_pos = "adj"
        elif old_pos == "adv":
            new_pos = "adv"
        else:
            new_pos = refine_other_pos(word)

        stats[new_pos] += 1
        if new_pos != old_pos:
            updates.append((new_pos, POS_LABEL[new_pos], int(row["id"])))

    print("词性分布（迁移后）:")
    for pos, count in sorted(stats.items()):
        print(f"  {pos} ({POS_LABEL[pos]}): {count}")

    if not updates:
        print("\n无需更新。")
        conn.close()
        return

    print(f"\n将更新 {len(updates)} 条记录...")
    cur.executemany(
        "UPDATE words SET pos = ?, pos_label = ? WHERE id = ?",
        updates,
    )
    conn.commit()
    conn.close()
    print("[OK] 词性细分完成。")


if __name__ == "__main__":
    main()
