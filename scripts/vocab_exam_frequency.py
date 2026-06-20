#!/usr/bin/env python3
"""统计单词表各词在历次中考英语真题中的出现频率，并更新 单词表.md。"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from pathlib import Path

import simplemma

DIR = Path(__file__).resolve().parents[1] / "material" / "english"
VOCAB_FILE = DIR / "单词表.md"
WORD_RE = re.compile(r"[a-zA-Z]+(?:'[a-zA-Z]+)?")

CONTRACTION_FRAGMENTS = {
    "won", "wouldn", "couldn", "shouldn", "doesn", "don", "isn", "aren",
    "wasn", "weren", "hasn", "haven", "hadn", "mightn", "mustn", "needn",
    "shan", "ain",
}

CONTRACTIONS = {
    "won't": "will",
    "wouldn't": "would",
    "couldn't": "could",
    "shouldn't": "should",
    "can't": "can",
    "don't": "do",
    "doesn't": "do",
    "didn't": "do",
    "isn't": "be",
    "aren't": "be",
    "wasn't": "be",
    "weren't": "be",
    "hasn't": "have",
    "haven't": "have",
    "hadn't": "have",
    "it's": "it",
    "that's": "that",
    "there's": "there",
    "here's": "here",
    "what's": "what",
    "who's": "who",
    "i'm": "be",
    "you're": "be",
    "we're": "be",
    "they're": "be",
    "i've": "have",
    "you've": "have",
    "we've": "have",
    "they've": "have",
    "i'll": "will",
    "you'll": "will",
    "we'll": "will",
    "they'll": "will",
    "i'd": "would",
    "you'd": "would",
    "we'd": "would",
    "they'd": "would",
}

# 按年份合并该届空白卷与解析卷，避免重复计数又覆盖全部词源
EXAM_YEAR_RE = re.compile(r"(\d{4})")

FREQ_LABEL = {"high": "高频", "medium": "中频", "low": "低频"}


def normalize_token(raw: str) -> str | None:
    word = raw.lower().strip()
    if word in CONTRACTIONS:
        word = CONTRACTIONS[word]
    if "'" in word:
        word = word.split("'", 1)[0]
    if len(word) < 2 or word in CONTRACTION_FRAGMENTS:
        return None
    return simplemma.lemmatize(word, lang="en").lower()


def parse_vocab(path: Path) -> dict[str, str]:
    """解析单词表，返回 {lemma: pos_section}。"""
    text = path.read_text(encoding="utf-8")
    current_section = ""
    vocab: dict[str, str] = {}
    for line in text.splitlines():
        if line.startswith("## "):
            current_section = line.strip()
            continue
        if line.startswith("### "):
            continue
        raw = line.strip()
        if not raw or raw.startswith(">") or raw.startswith("#"):
            continue
        # 格式：word [高频] (N届/M次) 或纯 word
        m = re.match(r"^([a-zA-Z]+(?:'[a-zA-Z]+)?)", raw)
        if m:
            vocab[m.group(1).lower()] = current_section
    return vocab


def classify_frequency(exam_count: int, total_exams: int) -> str:
    """按「出现在几份试卷中」划分高/中/低频。"""
    if total_exams <= 0 or exam_count <= 0:
        return "low"
    # 5 届为例：高频 ≥3 届，中频 2 届，低频 1 届
    high_threshold = max(3, int(total_exams * 0.6 + 0.5))
    if exam_count >= high_threshold:
        return "high"
    if exam_count >= 2:
        return "medium"
    return "low"


def scan_exams() -> tuple[list[str], dict[str, Counter[str]], dict[str, int]]:
    """按年份扫描试卷，返回 (年份列表, 每届词频, 总词频)。"""
    by_year: dict[str, list[Path]] = defaultdict(list)
    for md in sorted(DIR.glob("*.md")):
        if md.name == VOCAB_FILE.name:
            continue
        m = EXAM_YEAR_RE.search(md.name)
        if m:
            by_year[m.group(1)].append(md)

    years = sorted(by_year)
    per_exam: dict[str, Counter[str]] = {}
    total_counts: Counter[str] = Counter()

    for year in years:
        counts: Counter[str] = Counter()
        for exam in by_year[year]:
            text = exam.read_text(encoding="utf-8")
            for match in WORD_RE.finditer(text):
                lemma = normalize_token(match.group())
                if lemma:
                    counts[lemma] += 1
        per_exam[year] = counts
        total_counts.update(counts)

    return years, per_exam, dict(total_counts)


def build_markdown(
    vocab: dict[str, str],
    years: list[str],
    per_exam: dict[str, Counter[str]],
    total_counts: dict[str, int],
) -> str:
    total_exams = len(years)
    exam_years = ", ".join(years)

    # 统计每词出现在几份试卷
    exam_presence: dict[str, int] = defaultdict(int)
    for lemma in vocab:
        for counts in per_exam.values():
            if counts.get(lemma, 0) > 0:
                exam_presence[lemma] += 1

    freq_stats = Counter()
    for lemma in vocab:
        ec = exam_presence.get(lemma, 0)
        freq_stats[classify_frequency(ec, total_exams)] += 1

    # 按原有词性分组，组内按频率（高→低）再按字母序
    sections: dict[str, list[tuple[str, str, int, int]]] = defaultdict(list)
    freq_order = {"high": 0, "medium": 1, "low": 2}

    for lemma, section in vocab.items():
        ec = exam_presence.get(lemma, 0)
        tc = total_counts.get(lemma, 0)
        freq = classify_frequency(ec, total_exams)
        freq_stats[freq]  # ensure counted
        sections[section].append((lemma, freq, ec, tc))

    lines = [
        "# 北京中考英语单词表",
        "",
        f"> 来源：material/english 目录下 {total_exams} 届中考英语真题（{exam_years}，每届含空白卷+解析卷）",
        f"> 共 {len(vocab)} 个单词（词形还原去重，按词性分类）",
        f"> 频率说明：按单词出现在几届考试中的次数划分 — "
        f"高频 ≥{max(3, int(total_exams * 0.6 + 0.5))} 届 / 中频 2 届 / 低频 1 届；括号内为 (出现届数/总出现次数)",
        f"> 高频 {freq_stats['high']} | 中频 {freq_stats['medium']} | 低频 {freq_stats['low']}",
        "",
    ]

    section_order = [s for s in vocab.values()]
    seen_sections: list[str] = []
    for s in section_order:
        if s not in seen_sections:
            seen_sections.append(s)

    for section in seen_sections:
        words = sections[section]
        # 提取词性名称与数量
        m = re.match(r"## (.+?)（(\d+)）", section)
        title = m.group(1) if m else section.replace("## ", "")
        lines.append(f"## {title}（{len(words)}）")
        lines.append("")

        # 先按频率分组输出
        for freq_key in ("high", "medium", "low"):
            group = [w for w in words if w[1] == freq_key]
            if not group:
                continue
            group.sort(key=lambda x: (-x[2], -x[3], x[0]))
            lines.append(f"### {FREQ_LABEL[freq_key]}（{len(group)}）")
            lines.append("")
            for lemma, _, ec, tc in group:
                lines.append(f"{lemma} [{FREQ_LABEL[freq_key]}] ({ec}届/{tc}次)")
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    vocab = parse_vocab(VOCAB_FILE)
    years, per_exam, total_counts = scan_exams()

    if not years:
        raise SystemExit(f"未找到试卷：{DIR}")

    output = build_markdown(vocab, years, per_exam, total_counts)
    VOCAB_FILE.write_text(output, encoding="utf-8")

    # 控制台摘要
    total_exams = len(years)
    exam_presence = defaultdict(int)
    for lemma in vocab:
        for counts in per_exam.values():
            if counts.get(lemma, 0) > 0:
                exam_presence[lemma] += 1

    stats = Counter(classify_frequency(exam_presence.get(w, 0), total_exams) for w in vocab)
    zero_count = sum(1 for w in vocab if exam_presence.get(w, 0) == 0)
    print(f"[OK] 已更新 {VOCAB_FILE}")
    print(f"     届数: {total_exams}")
    print(f"     高频: {stats['high']} | 中频: {stats['medium']} | 低频: {stats['low']}")
    if zero_count:
        print(f"     警告: {zero_count} 个词未在任何试卷中匹配")


if __name__ == "__main__":
    main()
