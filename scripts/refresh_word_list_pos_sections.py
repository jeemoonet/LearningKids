#!/usr/bin/env python3
"""将 单词表.md 中「其他」类细分为形容词/副词/其他，保留频率标注。"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from word_pos_utils import POS_LABEL, refine_other_pos

ROOT = Path(__file__).resolve().parents[1]
WORD_LIST = ROOT / "material" / "english" / "单词表.md"

WORD_LINE_RE = re.compile(
    r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)(?:\s+\[(高|中|低)频\]\s+\((\d+届/\d+次)\))?$"
)

SECTION_KEYS = {
    "名词": "noun",
    "动词": "verb",
    "形容词": "adj",
    "副词": "adv",
    "其他": "other",
}
KEY_LABEL = {v: k for k, v in SECTION_KEYS.items()}
FREQ_ORDER = ["高频", "中频", "低频"]


def parse_word_list(path: Path) -> tuple[list[str], dict[str, dict[str, list[str]]]]:
    header: list[str] = []
    buckets: dict[str, dict[str, list[str]]] = {
        pos: {freq: [] for freq in FREQ_ORDER} for pos in SECTION_KEYS.values()
    }

    current_pos: str | None = None
    current_freq: str | None = None

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()

        if not header and (stripped.startswith("#") or stripped.startswith(">") or stripped == ""):
            header.append(line)
            continue

        if stripped.startswith("## "):
            title = stripped[3:].split("（", 1)[0]
            current_pos = SECTION_KEYS.get(title)
            current_freq = None
            continue

        if stripped.startswith("### "):
            freq = stripped[4:]
            current_freq = freq if freq in FREQ_ORDER else None
            continue

        if not stripped or not current_pos:
            continue

        m = WORD_LINE_RE.match(stripped)
        if not m:
            continue

        word = m.group(1).lower()
        freq = current_freq or "低频"
        suffix = ""
        if m.group(2) and m.group(3):
            suffix = f" [{m.group(2)}频] ({m.group(3)})"
        buckets[current_pos][freq].append(f"{word}{suffix}")

    return header, buckets


def refine_other_buckets(buckets: dict[str, dict[str, list[str]]]) -> dict[str, dict[str, list[str]]]:
    refined = {pos: {freq: [] for freq in FREQ_ORDER} for pos in SECTION_KEYS.values()}

    for pos in ("noun", "verb"):
        for freq in FREQ_ORDER:
            refined[pos][freq].extend(buckets[pos][freq])

    for freq in FREQ_ORDER:
        for line in buckets["other"][freq]:
            word = WORD_LINE_RE.match(line).group(1).lower()
            target = refine_other_pos(word)
            refined[target][freq].append(line)

    return refined


def render_word_list(header: list[str], buckets: dict[str, dict[str, list[str]]]) -> str:
    counts = {pos: sum(len(items) for items in freq_map.values()) for pos, freq_map in buckets.items()}
    total = sum(counts.values())

    lines = list(header)
    if lines and lines[-1] != "":
        lines.append("")

    stats = (
        f"> 名词 {counts['noun']} | 动词 {counts['verb']} "
        f"| 形容词 {counts['adj']} | 副词 {counts['adv']} | 其他 {counts['other']}"
    )
    if lines and lines[-1].startswith("> 名词"):
        lines[-1] = stats
    else:
        lines.append(stats)
        lines.append("")

    for pos in ("noun", "verb", "adj", "adv", "other"):
        label = KEY_LABEL[pos]
        lines.append(f"## {label}（{counts[pos]}）")
        lines.append("")
        for freq in FREQ_ORDER:
            words = buckets[pos][freq]
            if not words:
                continue
            lines.append(f"### {freq}（{len(words)}）")
            lines.append("")
            lines.extend(words)
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    header, buckets = parse_word_list(WORD_LIST)
    refined = refine_other_buckets(buckets)
    WORD_LIST.write_text(render_word_list(header, refined), encoding="utf-8")

    counts = {pos: sum(len(v) for v in freq_map.values()) for pos, freq_map in refined.items()}
    print("[OK] 单词表.md 已更新")
    for pos, count in counts.items():
        print(f"  {pos} ({POS_LABEL[pos]}): {count}")


if __name__ == "__main__":
    main()
