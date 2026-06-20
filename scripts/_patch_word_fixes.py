#!/usr/bin/env python3
"""手工修正少量 API 生成错误的词条。"""

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "server/data/app.db"
JSON_FILE = ROOT / "scripts/data/beginner-scene-words.json"

FIXES = {
    "any": {
        "meaning_zh": "任何",
        "example_en": "I do not have any books.",
        "example_zh": "我没有任何书。",
        "similar1": "some",
        "similar2": "no",
        "similar3": "all",
    },
    "old": {
        "meaning_zh": "老的；年纪大的",
        "example_en": "The man is old but kind.",
        "example_zh": "这位老人很和蔼。",
        "similar1": "older",
        "similar2": "young",
        "similar3": "age",
    },
    "brave": {
        "meaning_zh": "勇敢的",
        "example_en": "He is very brave in class.",
        "example_zh": "他在课堂上很勇敢。",
        "similar1": "braver",
        "similar2": "be brave",
        "similar3": "fear",
    },
    "tear": {
        "meaning_zh": "撕；扯",
        "example_en": "Do not tear the book.",
        "example_zh": "不要撕书。",
        "similar1": "tore",
        "similar2": "tear up",
        "similar3": "book",
    },
    "lover": {
        "meaning_zh": "爱好者",
        "example_en": "He is a music lover.",
        "example_zh": "他是个音乐爱好者。",
        "similar1": "fan",
        "similar2": "like music",
        "similar3": "hero",
    },
}

conn = sqlite3.connect(DB)
content = json.loads(JSON_FILE.read_text(encoding="utf-8")) if JSON_FILE.exists() else {}

for word, entry in FIXES.items():
    entry = {"word": word, **entry}
    content[word] = entry
    conn.execute(
        """
        UPDATE words SET meaning_zh=?, example_en=?, example_zh=?,
            similar1=?, similar2=?, similar3=?
        WHERE word=? AND tier_id='beginner'
        """,
        (
            entry["meaning_zh"],
            entry["example_en"],
            entry["example_zh"],
            entry["similar1"],
            entry["similar2"],
            entry["similar3"],
            word,
        ),
    )
    print(f"fixed {word}")

conn.commit()
conn.close()
JSON_FILE.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
print("done")
