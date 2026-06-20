#!/usr/bin/env python3
"""批量修正初级组词性错误。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"

POS_LABEL = {
    "noun": "名词",
    "verb": "动词",
    "adj": "形容词",
    "adv": "副词",
    "other": "其他",
}

# word -> 正确 pos
FIXES: dict[str, str] = {
    # 形容词误标为名词
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
    # 动词误标为名词
    "cheat": "verb",
    "hope": "verb",
    "need": "verb",
    "use": "verb",
    # 代词/称谓误标为名词
    "i": "other",
    "mr": "other",
    "mrs": "other",
    "ms": "other",
    # 形容词误标为动词
    "fit": "adj",
    "full": "adj",
    "shy": "adj",
}


def main() -> None:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    updated = 0
    skipped: list[str] = []

    for word, new_pos in FIXES.items():
        rows = cur.execute(
            "SELECT id, pos, pos_label FROM words WHERE tier_id = 'beginner' AND word = ?",
            (word,),
        ).fetchall()
        if not rows:
            skipped.append(word)
            continue
        for word_id, old_pos, old_label in rows:
            if old_pos == new_pos:
                continue
            cur.execute(
                "UPDATE words SET pos = ?, pos_label = ? WHERE id = ?",
                (new_pos, POS_LABEL[new_pos], word_id),
            )
            updated += 1
            print(f"  {word}: {old_pos}({old_label}) -> {new_pos}({POS_LABEL[new_pos]})")

    conn.commit()
    conn.close()

    print(f"\n已更新 {updated} 条记录")
    if skipped:
        print(f"未找到（跳过）: {', '.join(skipped)}")


if __name__ == "__main__":
    main()
