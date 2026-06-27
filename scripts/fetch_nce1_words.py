#!/usr/bin/env python3
"""从新东方在线抓取新概念英语1词汇表，写入 server/data/新概念英语1.md"""

from __future__ import annotations

import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_FILE = ROOT / "server" / "data" / "新概念英语1.md"
SOURCE_URL = "https://www.koolearn.com/dict/tag_468_{}.html"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def fetch_words() -> list[str]:
    headers = {"User-Agent": USER_AGENT}
    all_words: list[str] = []
    for page in range(1, 5):
        req = urllib.request.Request(SOURCE_URL.format(page), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        left_match = re.search(
            r'<div class="left-content">(.*?)</div>\s*<div class="right-content">',
            html,
            re.S,
        )
        left = left_match.group(1) if left_match else html
        words = re.findall(r'<a class="word" href="/dict/wd_\d+\.html">([^<]+)</a>', left)
        all_words.extend(words)

    seen: set[str] = set()
    unique: list[str] = []
    for word in all_words:
        normalized = word.strip().lower()
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique.append(normalized)
    return unique


def main() -> None:
    words = fetch_words()
    OUT_FILE.write_text(",".join(words) + ";", encoding="utf-8")
    print(f"已写入 {len(words)} 个单词到 {OUT_FILE}")


if __name__ == "__main__":
    main()
