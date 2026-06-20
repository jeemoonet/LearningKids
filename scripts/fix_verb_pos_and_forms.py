#!/usr/bin/env python3
"""修正误标为动词的 -ing 词，并输出待人工确认的动词列表。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"

# 原形动词（保留为 verb，不误改）
KEEP_AS_VERB = {
    "bring", "sing", "ring", "spring", "string", "cling", "fling", "sting", "swing", "wring",
}

# -ing 结尾但实为名词/动名词/形容词，应改为 noun/other
ING_AS_NOUN = {
    "beginning", "being", "building", "booking", "buying", "clothing", "coming", "cutting",
    "dealing", "doing", "drawing", "dropping", "facing", "feeling", "finding", "fitting",
    "following", "freezing", "grading", "happening", "helping", "holding", "hunting",
    "living", "nursing", "piling", "recycling", "setting", "sitting", "taking",
    "understanding", "writing",
}

# 特殊：born 是形容词/过去分词，不是动词原形
SPECIAL_POS = {
    "born": ("adj", "形容词"),
}


def main() -> None:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    verb_ing_rows = cur.execute(
        "SELECT id, word, pos, pos_label FROM words WHERE pos = 'verb' AND word LIKE '%ing' ORDER BY word"
    ).fetchall()

    print(f"当前 pos=verb 且以 -ing 结尾: {len(verb_ing_rows)} 个\n")

    updates: list[tuple[str, str, int]] = []

    for row in verb_ing_rows:
        word = str(row["word"]).lower()
        word_id = int(row["id"])

        if word in KEEP_AS_VERB:
            print(f"  保留 verb: {word}")
            continue

        if word in SPECIAL_POS:
            pos, label = SPECIAL_POS[word]
            updates.append((pos, label, word_id))
            print(f"  {word}: verb -> {pos} ({label})")
            continue

        if word in ING_AS_NOUN or word.endswith("ing"):
            # 默认 -ing 词改为名词（动名词作名词用法）
            updates.append(("noun", "名词", word_id))
            print(f"  {word}: verb -> noun")

    if not updates:
        print("\n-ing 词性无需更新。")
    else:
        print(f"\n将更新 {len(updates)} 条 -ing 词性...")
        cur.executemany("UPDATE words SET pos = ?, pos_label = ? WHERE id = ?", updates)
        conn.commit()
        print("[OK] -ing 词性修正完成。")

    special_updates: list[tuple[str, str, int]] = []
    for word, (pos, label) in SPECIAL_POS.items():
        row = cur.execute(
            "SELECT id FROM words WHERE lower(word) = ? AND pos = 'verb'",
            (word,),
        ).fetchone()
        if row:
            special_updates.append((pos, label, int(row["id"])))
            print(f"  {word}: verb -> {pos} ({label})")

    if special_updates:
        cur.executemany("UPDATE words SET pos = ?, pos_label = ? WHERE id = ?", special_updates)
        conn.commit()
        print(f"[OK] 特殊词性修正 {len(special_updates)} 条。")

    conn.close()


if __name__ == "__main__":
    main()
