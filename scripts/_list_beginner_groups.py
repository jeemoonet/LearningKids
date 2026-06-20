import json
import sqlite3
from pathlib import Path
from collections import defaultdict

db = sqlite3.connect(Path(__file__).resolve().parents[1] / "server/data/app.db")
db.row_factory = sqlite3.Row
rows = db.execute(
    """
    SELECT g.group_index, g.title, w.id, w.word, w.pos, w.freq_label
    FROM game_tier_groups g
    JOIN game_word_assignments a ON a.tier_id = g.tier_id AND a.group_index = g.group_index
    JOIN words w ON w.id = a.word_id
    WHERE g.tier_id = 'beginner' AND g.title NOT LIKE '学习%'
    ORDER BY g.group_index, w.sort_order, w.id
    """
).fetchall()

by_group = defaultdict(list)
for r in rows:
    by_group[r["title"]].append(dict(r))

print("groups", len(by_group), "words", len(rows))
out = []
for title, words in sorted(by_group.items(), key=lambda x: x[1][0]["group_index"]):
    ws = ", ".join(w["word"] for w in words)
    line = f"{words[0]['group_index']:2} {title} ({len(words)}): {ws}"
    print(line)
    out.append({"group_index": words[0]["group_index"], "title": title, "words": words})

Path(__file__).resolve().parents[1].joinpath("scripts/data/beginner_groups_export.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
)
