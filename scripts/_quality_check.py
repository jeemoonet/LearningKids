import re
import sqlite3
from pathlib import Path

db = sqlite3.connect(Path(__file__).resolve().parents[1] / "server/data/app.db")
rows = db.execute("SELECT word, example_en, example_zh FROM words WHERE tier_id='beginner'").fetchall()
bad = []
for word, en, zh in rows:
    wc = len(en.split())
    sents = len(re.findall(r"[.!?]", en))
    if wc > 12 or sents > 1 or "important role" in en.lower():
        bad.append(word)
print("quality issues:", len(bad))
print(", ".join(bad))
