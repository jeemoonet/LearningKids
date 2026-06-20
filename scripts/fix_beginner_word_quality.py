#!/usr/bin/env python3
"""修复初级组例句过长/多句等质量问题，重新调用百炼生成。"""

from __future__ import annotations

import json
import re
import sqlite3
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server/data/app.db"
OUTPUT_FILE = ROOT / "scripts/data/beginner-scene-words.json"
LEARNING_DONE = ROOT / "scripts/data/learning-scene-words.json"
HIGH_FREQ_FILE = ROOT / "server/data/中考高频词-初级组.md"
SERVERS_MD = Path(r"d:\Dev\server\Servers.md")
API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
MODEL = "qwen-plus"
MAX_WORDS = 12


def load_api_key() -> str:
    import os

    key = os.environ.get("DASHSCOPE_API_KEY", "").strip()
    if key:
        return key
    text = SERVERS_MD.read_text(encoding="utf-8")
    section = re.search(r"## 阿里云百炼[\s\S]*?(?=##|$)", text)
    block = section.group(0) if section else text
    match = re.search(r"API_KEY\s*=\s*(\S+)", block, re.I)
    if not match:
        raise RuntimeError("找不到百炼 API_KEY")
    return match.group(1).strip()


def load_high_freq(limit: int = 80) -> str:
    text = HIGH_FREQ_FILE.read_text(encoding="utf-8").strip().rstrip(";")
    return ", ".join(w.strip() for w in text.split(",") if w.strip())[: limit * 6]


def example_is_bad(en: str) -> bool:
    if not en or "important role" in en.lower():
        return True
    if len(en.split()) > MAX_WORDS:
        return True
    if len(re.findall(r"[.!?]", en)) > 1:
        return True
    return False


def load_content() -> dict[str, dict]:
    content: dict[str, dict] = {}
    if LEARNING_DONE.exists():
        content.update(json.loads(LEARNING_DONE.read_text(encoding="utf-8")))
    if OUTPUT_FILE.exists():
        content.update(json.loads(OUTPUT_FILE.read_text(encoding="utf-8")))
    return content


def save_content(content: dict[str, dict]) -> None:
    OUTPUT_FILE.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")


def call_qwen(prompt: str, api_key: str) -> dict:
    body = json.dumps(
        {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return json.loads(payload["choices"][0]["message"]["content"])


def build_fix_prompt(words: list[tuple[str, str]]) -> str:
    lines = "\n".join(f"- {w} ({p})" for w, p in words)
    return f"""修复以下初中英语单词的例句。此前例句过长或含多句，请重写。

硬性要求：
1. example_en 只能有 1 句、6～10 个词、最多 12 词，一般现在时，语法正确
2. 禁止多个句子（只能有一个句号）
3. meaning_zh ≤20字；example_zh 为自然中文
4. similar1~3：词形/搭配/同场景词，非生僻同义词

熟词池：{load_high_freq()}

单词：
{lines}

输出 JSON：{{"words":[{{"word","meaning_zh","example_en","example_zh","similar1","similar2","similar3"}}]}}"""


def apply_word(entry: dict) -> None:
    conn = sqlite3.connect(DB_FILE)
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
            entry.get("similar1", ""),
            entry.get("similar2", ""),
            entry.get("similar3", ""),
            entry["word"],
        ),
    )
    conn.commit()
    conn.close()


def main() -> None:
    api_key = load_api_key()
    content = load_content()
    conn = sqlite3.connect(DB_FILE)
    rows = conn.execute(
        "SELECT word, pos, example_en FROM words WHERE tier_id='beginner'"
    ).fetchall()
    conn.close()

    bad = [(w, p) for w, p, en in rows if example_is_bad(en)]
    print(f"待修复 {len(bad)} 词")

    batch_size = 8
    for i in range(0, len(bad), batch_size):
        batch = bad[i : i + batch_size]
        print(f"[{i // batch_size + 1}/{(len(bad) + batch_size - 1) // batch_size}] {', '.join(w for w, _ in batch)}")
        try:
            result = call_qwen(build_fix_prompt(batch), api_key)
            for entry in result.get("words", []):
                word = entry.get("word", "")
                en = entry.get("example_en", "")
                if not word or example_is_bad(en):
                    print(f"  WARN 仍不合格: {word} ({len(en.split())} words)")
                    continue
                content[word] = entry
                apply_word(entry)
                print(f"  OK {word}: {en}")
            save_content(content)
        except (urllib.error.HTTPError, json.JSONDecodeError, KeyError) as err:
            print(f"  FAIL: {err}")
        time.sleep(0.6)

    conn = sqlite3.connect(DB_FILE)
    rows2 = conn.execute("SELECT example_en FROM words WHERE tier_id='beginner'").fetchall()
    conn.close()
    left = sum(1 for (en,) in rows2 if example_is_bad(en))
    print(f"\n修复完成，剩余质量问题: {left}")


if __name__ == "__main__":
    main()
