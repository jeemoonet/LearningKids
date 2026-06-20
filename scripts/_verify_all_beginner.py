import json
import sqlite3
from pathlib import Path

db = sqlite3.connect(Path(__file__).resolve().parents[1] / "server/data/app.db")

total = db.execute("SELECT COUNT(*) FROM words WHERE tier_id='beginner'").fetchone()[0]
with_ex = db.execute(
    "SELECT COUNT(*) FROM words WHERE tier_id='beginner' AND example_en != '' AND meaning_zh != ''"
).fetchone()[0]
bad = db.execute(
    "SELECT COUNT(*) FROM words WHERE tier_id='beginner' AND example_en LIKE '%important role%'"
).fetchone()[0]

print(f"初级组总词数: {total}")
print(f"已有释义+例句: {with_ex}")
print(f"旧模板句残留: {bad}")

samples = ["bed", "brave", "food", "snow", "bike", "city", "mary", "a"]
for w in samples:
    r = db.execute(
        "SELECT meaning_zh, example_en, example_zh, similar1 FROM words WHERE word=? AND tier_id='beginner'",
        (w,),
    ).fetchone()
    if r:
        print(f"\n{w}: {r[0]}")
        print(f"  EN: {r[1]}")
        print(f"  ZH: {r[2]}")
        print(f"  rel: {r[3]}")

content = json.loads(Path("scripts/data/beginner-scene-words.json").read_text(encoding="utf-8"))
print(f"\nbeginner-scene-words.json: {len(content)} 词")
