"""同步时间介词例句到 beginner-scene-words.json"""
from __future__ import annotations

import json
from pathlib import Path

from setup_time_preposition_words import UPDATES

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "scripts" / "data" / "beginner-scene-words.json"


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    updated = 0
    for word, fields in UPDATES.items():
        key = word.lower()
        if key not in data:
            continue
        entry = data[key]
        for field in ("meaning_zh", "example_en", "example_zh", "similar1", "similar2", "similar3"):
            if field in fields:
                entry[field] = fields[field]
        updated += 1
        print(f"json: {word}")
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"done, updated {updated} entries")


if __name__ == "__main__":
    main()
