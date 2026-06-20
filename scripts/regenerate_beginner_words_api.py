#!/usr/bin/env python3
"""调用百炼 API，按场景批量生成初级组单词释义/例句/关联词，并写入 app.db。"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "server" / "data" / "app.db"
GROUPS_FILE = ROOT / "scripts" / "data" / "beginner_groups_export.json"
OUTPUT_FILE = ROOT / "scripts" / "data" / "beginner-scene-words.json"
LEARNING_DONE = ROOT / "scripts" / "data" / "learning-scene-words.json"
HIGH_FREQ_FILE = ROOT / "server" / "data" / "中考高频词-初级组.md"
SERVERS_MD = Path(r"d:\Dev\server\Servers.md")
API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
DEFAULT_MODEL = "qwen-plus"


def load_api_key() -> str:
    import os

    key = os.environ.get("DASHSCOPE_API_KEY", "").strip()
    if key:
        return key
    if not SERVERS_MD.exists():
        raise RuntimeError("未设置 DASHSCOPE_API_KEY，且找不到 Servers.md")
    text = SERVERS_MD.read_text(encoding="utf-8")
    section = re.search(r"## 阿里云百炼[\s\S]*?(?=##|$)", text)
    block = section.group(0) if section else text
    match = re.search(r"API_KEY\s*=\s*(\S+)", block, re.I)
    if not match:
        raise RuntimeError("Servers.md 中未找到百炼 API_KEY")
    return match.group(1).strip()


def load_high_freq_pool(limit: int = 80) -> str:
    text = HIGH_FREQ_FILE.read_text(encoding="utf-8").strip().rstrip(";")
    words = [w.strip() for w in text.split(",") if w.strip()]
    return ", ".join(words[:limit])


def load_groups() -> list[dict]:
    return json.loads(GROUPS_FILE.read_text(encoding="utf-8"))


def load_existing_content() -> dict[str, dict]:
    merged: dict[str, dict] = {}
    if LEARNING_DONE.exists():
        merged.update(json.loads(LEARNING_DONE.read_text(encoding="utf-8")))
    if OUTPUT_FILE.exists():
        merged.update(json.loads(OUTPUT_FILE.read_text(encoding="utf-8")))
    return merged


def save_content(content: dict[str, dict]) -> None:
    OUTPUT_FILE.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")


def build_prompt(group: dict, high_freq: str) -> str:
    word_lines = "\n".join(f"- {w['word']} ({w['pos']})" for w in group["words"])
    return f"""你是初中英语词汇编写专家，面向英语弱基础学生（北京中考）。

请为场景小组「{group['title']}」中的每个单词生成词汇数据。

## 规则
1. meaning_zh：中文释义，≤20字，仅最常考的一个义项
2. example_en：6～10个英文词，一般现在时，主谓宾/主系表简单句；除目标词外尽量使用熟词
3. example_zh：例句中文对照，自然简洁
4. similar1~3：关联词，优先级：词形变化 > 固定搭配 > 同场景词；禁止 WordNet 生僻同义词
5. 初级组：similar 共 3 项，每项为单词或短语（如 books / read a book / class）
6. 禁止语法错误模板句（如 Students {{word}} new skills、plays an important role）
7. 例句必须语法正确，及物/不及物用法准确
8. 人名/缩写（如 mr, br, li）释义标注「人名/缩写」，例句可简单介绍用法

## 熟词池（例句中优先选用）
{high_freq}

## 单词列表
{word_lines}

## 输出格式
只输出 JSON，不要 markdown 代码块：
{{"words":[{{"word":"...","meaning_zh":"...","example_en":"...","example_zh":"...","similar1":"...","similar2":"...","similar3":"..."}}]}}
必须覆盖上述每个单词，word 字段与列表完全一致。"""


def call_qwen(prompt: str, api_key: str, model: str) -> dict:
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    content = payload["choices"][0]["message"]["content"]
    return json.loads(content)


def validate_entry(entry: dict, word: str) -> bool:
    required = ("meaning_zh", "example_en", "example_zh", "similar1")
    if entry.get("word") != word:
        return False
    return all(entry.get(k) for k in required)


def apply_to_db(content: dict[str, dict]) -> int:
    conn = sqlite3.connect(DB_FILE)
    updated = 0
    for word, entry in content.items():
        cur = conn.execute(
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
                word,
            ),
        )
        if cur.rowcount:
            updated += 1
    conn.commit()
    conn.close()
    return updated


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--theme", help="仅处理标题以该场景开头的组，如 家庭、个人")
    parser.add_argument("--from-index", type=int, default=0, help="从 group_index 开始")
    parser.add_argument("--limit", type=int, default=0, help="最多处理多少组，0=全部")
    parser.add_argument("--apply-only", action="store_true", help="仅写入数据库，不调用 API")
    args = parser.parse_args()

    content = load_existing_content()
    if args.apply_only:
        n = apply_to_db(content)
        print(f"已写入数据库 {n} 词")
        return

    api_key = load_api_key()
    high_freq = load_high_freq_pool()
    groups = load_groups()

    if args.theme:
        groups = [g for g in groups if g["title"].startswith(args.theme)]
    if args.from_index:
        groups = [g for g in groups if g["group_index"] >= args.from_index]
    if args.limit:
        groups = groups[: args.limit]

    print(f"待处理 {len(groups)} 个小组，已有 {len(content)} 词")

    for i, group in enumerate(groups, 1):
        pending = [w for w in group["words"] if w["word"] not in content]
        if not pending:
            print(f"[{i}/{len(groups)}] 跳过 {group['title']}（已全部生成）")
            continue

        sub = {**group, "words": pending}
        print(f"[{i}/{len(groups)}] 生成 {group['title']} ({len(pending)} 词)...", flush=True)
        try:
            result = call_qwen(build_prompt(sub, high_freq), api_key, args.model)
            for entry in result.get("words", []):
                word = entry.get("word", "")
                if validate_entry(entry, word):
                    content[word] = entry
                else:
                    print(f"  WARN 无效条目: {word}")
            save_content(content)
            print(f"  OK 累计 {len(content)} 词")
        except (urllib.error.HTTPError, json.JSONDecodeError, KeyError) as err:
            print(f"  FAIL {group['title']}: {err}")
        time.sleep(0.5)

    n = apply_to_db(content)
    print(f"\n完成：词库 {len(content)} 条，本次写入数据库 {n} 词")


if __name__ == "__main__":
    main()
