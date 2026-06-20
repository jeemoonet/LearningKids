#!/usr/bin/env python3
"""Verify beginner tier word content status."""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "server" / "data" / "app.db"
JSON_FILE = ROOT / "scripts" / "data" / "beginner-scene-words.json"

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
total = conn.execute(
    "SELECT COUNT(*) AS n FROM words WHERE tier_id='beginner'"
).fetchone()["n"]
filled = conn.execute(
    """SELECT COUNT(*) AS n FROM words
       WHERE tier_id='beginner' AND meaning_zh != '' AND example_en != ''"""
).fetchone()["n"]
print(f"DB: {filled}/{total} beginner words with content")

themes = ["家庭", "运动", "个人", "其他", "学习"]
for theme in themes:
    rows = conn.execute(
        """
        SELECT w.word, w.meaning_zh, w.example_en, gt.title
        FROM words w
        JOIN game_word_assignments gwa ON gwa.word_id = w.id
        JOIN game_tier_groups gt ON gt.tier_id = gwa.tier_id
            AND gt.group_index = gwa.group_index
        WHERE w.tier_id = 'beginner' AND gt.title LIKE ?
        LIMIT 2
        """,
        (theme + "%",),
    ).fetchall()
    print(f"\n=== {theme} ===")
    for r in rows:
        print(f"  {r['word']}: {r['meaning_zh']} | {r['example_en']}")

conn.close()

if JSON_FILE.exists():
    data = json.loads(JSON_FILE.read_text(encoding="utf-8"))
    print(f"\nJSON: {len(data)} entries in beginner-scene-words.json")
