#!/usr/bin/env python3
"""从 material/english 下的 MD 文件中提炼去重单词表（词形还原 + 词性分类）。"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import simplemma
from nltk.corpus import wordnet as wn

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from word_pos_utils import refine_other_pos

DIR = Path(__file__).resolve().parents[1] / "material" / "english"
OUTPUT = DIR / "单词表.md"
WORD_RE = re.compile(r"[a-zA-Z]+(?:'[a-zA-Z]+)?")

CONTRACTION_FRAGMENTS = {
    "won", "wouldn", "couldn", "shouldn", "doesn", "don", "isn", "aren",
    "wasn", "weren", "hasn", "haven", "hadn", "mightn", "mustn", "needn",
    "shan", "ain",
}

# WordNet 未收录或易误判的常见词，手动指定词性
MANUAL_POS: dict[str, str] = {
    "a": "other",
    "an": "other",
    "the": "other",
    "i": "other",
    "you": "other",
    "he": "other",
    "she": "other",
    "it": "other",
    "we": "other",
    "they": "other",
    "me": "other",
    "him": "other",
    "her": "other",
    "us": "other",
    "them": "other",
    "my": "other",
    "your": "other",
    "his": "other",
    "its": "other",
    "our": "other",
    "their": "other",
    "mine": "other",
    "yours": "other",
    "hers": "other",
    "ours": "other",
    "theirs": "other",
    "myself": "other",
    "yourself": "other",
    "himself": "other",
    "herself": "other",
    "itself": "other",
    "ourselves": "other",
    "themselves": "other",
    "in": "other",
    "on": "other",
    "at": "other",
    "for": "other",
    "with": "other",
    "from": "other",
    "to": "other",
    "of": "other",
    "by": "other",
    "about": "other",
    "into": "other",
    "through": "other",
    "during": "other",
    "before": "other",
    "after": "other",
    "between": "other",
    "under": "other",
    "over": "other",
    "above": "other",
    "below": "other",
    "across": "other",
    "against": "other",
    "without": "other",
    "within": "other",
    "and": "other",
    "or": "other",
    "but": "other",
    "so": "other",
    "if": "other",
    "because": "other",
    "while": "other",
    "though": "other",
    "when": "other",
    "where": "other",
    "why": "other",
    "how": "other",
    "what": "other",
    "who": "other",
    "which": "other",
    "that": "other",
    "this": "other",
    "these": "other",
    "those": "other",
    "both": "other",
    "either": "other",
    "neither": "other",
    "not": "other",
    "no": "other",
    "yes": "other",
    "too": "other",
    "also": "other",
    "very": "other",
    "quite": "other",
    "just": "other",
    "only": "other",
    "even": "other",
    "still": "other",
    "already": "other",
    "yet": "other",
    "again": "other",
    "here": "other",
    "there": "other",
    "now": "other",
    "then": "other",
    "as": "other",
    "mr": "other",
    "dr": "other",
    "be": "verb",
    "have": "verb",
    "do": "verb",
    "will": "verb",
    "would": "verb",
    "can": "verb",
    "could": "verb",
    "may": "verb",
    "might": "verb",
    "must": "verb",
    "shall": "verb",
    "should": "verb",
}


def normalize_token(raw: str) -> str | None:
    word = raw.lower().strip()

    contractions = {
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
    if word in contractions:
        word = contractions[word]

    if "'" in word:
        word = word.split("'", 1)[0]

    if len(word) < 2 or word in CONTRACTION_FRAGMENTS:
        return None

    return simplemma.lemmatize(word, lang="en").lower()


def classify_pos(word: str) -> str:
    """返回 noun / verb / adj / adv / other"""
    if word in MANUAL_POS:
        coarse = MANUAL_POS[word]
        if coarse in ("noun", "verb"):
            return coarse
        return refine_other_pos(word)

    synsets = wn.synsets(word)
    if not synsets:
        return refine_other_pos(word)

    noun_count = sum(1 for s in synsets if s.pos() == "n")
    verb_count = sum(1 for s in synsets if s.pos() == "v")

    if noun_count > verb_count:
        return "noun"
    if verb_count > noun_count:
        return "verb"
    if noun_count > 0 and verb_count > 0:
        return "noun" if synsets[0].pos() == "n" else "verb"
    if noun_count > 0:
        return "noun"
    if verb_count > 0:
        return "verb"
    return refine_other_pos(word)


def main() -> None:
    lemmas: set[str] = set()
    source_count = 0

    for md in sorted(DIR.glob("*.md")):
        if md.name == OUTPUT.name:
            continue
        source_count += 1
        text = md.read_text(encoding="utf-8")
        for match in WORD_RE.finditer(text):
            lemma = normalize_token(match.group())
            if lemma:
                lemmas.add(lemma)

    buckets: dict[str, list[str]] = {"noun": [], "verb": [], "adj": [], "adv": [], "other": []}
    for word in sorted(lemmas):
        buckets[classify_pos(word)].append(word)

    total = len(lemmas)
    sections = [
        ("名词", buckets["noun"]),
        ("动词", buckets["verb"]),
        ("形容词", buckets["adj"]),
        ("副词", buckets["adv"]),
        ("其他", buckets["other"]),
    ]

    lines = [
        "# 北京中考英语单词表",
        "",
        f"> 来源：material/english 目录下 {source_count} 份试卷 MD",
        f"> 共 {total} 个单词（词形还原去重，按词性分类）",
        (
            f"> 名词 {len(buckets['noun'])} | 动词 {len(buckets['verb'])} "
            f"| 形容词 {len(buckets['adj'])} | 副词 {len(buckets['adv'])} | 其他 {len(buckets['other'])}"
        ),
        "",
    ]

    for title, words in sections:
        lines.append(f"## {title}（{len(words)}）")
        lines.append("")
        lines.extend(words)
        lines.append("")

    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(
        f"[OK] {OUTPUT} (total={total}, "
        f"noun={len(buckets['noun'])}, verb={len(buckets['verb'])}, "
        f"adj={len(buckets['adj'])}, adv={len(buckets['adv'])}, other={len(buckets['other'])})"
    )


if __name__ == "__main__":
    main()
