"""词性细分工具：将 other 类进一步划分为 adj / adv / other。"""

from __future__ import annotations

from nltk.corpus import wordnet as wn

# 自由背单词初始化：固定基础代词（自动种入已掌握词库，不参与抽题）
FIXED_PRONOUNS = {
    "i", "you", "he", "she", "it", "we", "they",
    "this", "that",
    "my", "your", "his", "her", "its", "our", "their",
}

# 介词 — 标 prep（军团「精灵」编队）
PREPOSITION_WORDS = {
    "at", "on", "in", "for", "by", "from", "to", "of", "with", "about", "into",
    "through", "during", "before", "after", "between", "under", "over", "above",
    "below", "across", "against", "without", "within", "upon", "among", "along",
    "around", "behind", "beside", "beyond", "inside", "outside", "toward", "towards",
    "until", "since", "past", "off", "ago",
}

# 连词、冠词等功能词 — 保持 other（代词单独标 pronoun）
FUNCTION_WORDS = {
    "a", "an", "the",
    "me", "him", "us", "them",
    "mine", "yours", "hers", "ours", "theirs", "myself", "yourself", "himself",
    "herself", "itself", "ourselves", "themselves",
    "and", "or", "but", "so", "if", "because", "while", "though", "when", "where",
    "why", "how", "what", "who", "which",
    "both", "either", "neither", "not", "no", "yes", "nor",
    "very", "quite", "just", "only", "even", "still", "already", "yet", "again",
    "here", "there", "now", "then", "as", "than", "such", "whether",
    "mr", "dr", "ms", "mrs", "docx", "didn", "fixe", "rin", "sara",
    "eric", "wang", "dave", "tina", "tim",
}

# 手动覆盖：WordNet 易误判或中考常见词
MANUAL_ADJ = {
    "new", "hard", "easy", "big", "small", "good", "bad", "hot", "cold", "warm",
    "cool", "busy", "free", "safe", "ready", "late", "early", "fast", "slow",
    "high", "low", "long", "short", "right", "wrong", "quiet", "real", "daily",
    "fair", "clear", "dark", "light", "full", "empty", "different", "important",
    "beautiful", "strong", "able", "sorry", "meaningful", "successful", "online",
    "lazy", "cute", "tiny", "sad", "happy", "many", "some", "any", "each", "every",
    "other", "another", "same", "main", "mainly", "next", "last", "first", "second",
    "third", "whole", "half", "enough", "less", "more", "most", "least", "several",
    "own", "sure", "true", "false", "possible", "impossible", "necessary",
    "friendly", "lovely", "lonely", "likely", "lively", "ugly", "silly", "hungry",
    "thirsty", "tired", "afraid", "alone", "alive", "asleep", "awake", "glad",
    "proud", "worried", "excited", "surprised", "interested", "bored", "careful",
    "helpful", "useful", "wonderful", "powerful", "peaceful", "colorful",
}

MANUAL_ADV = {
    "also", "too", "often", "always", "sometimes", "never", "usually", "really",
    "probably", "maybe", "perhaps", "almost", "nearly", "hardly", "simply",
    "finally", "suddenly", "quickly", "slowly", "carefully", "quietly", "loudly",
    "together", "however", "instead", "especially", "actually", "exactly",
    "directly", "immediately", "recently", "finally", "mainly", "mostly",
    "especially", "certainly", "clearly", "deeply", "easily", "greatly",
    "highly", "largely", "merely", "nearly", "partly", "perfectly", "poorly",
    "rapidly", "rarely", "really", "seriously", "slightly", "strongly", "truly",
    "widely", "badly", "well", "soon", "once", "twice", "away", "back", "down",
    "up", "out", "off", "over", "under", "again", "ever", "else", "rather",
    "quite", "extremely", "absolutely", "completely", "totally", "fully",
}

# -ly 结尾但是形容词
LY_ADJECTIVES = {
    "friendly", "lovely", "lonely", "likely", "lively", "ugly", "silly", "holy",
    "costly", "cowardly", "elderly", "jolly", "kindly", "lively", "lonely",
    "lovely", "manly", "motherly", "scholarly", "silly", "timely", "womanly",
}

POS_LABEL = {
    "noun": "名词",
    "verb": "动词",
    "adj": "形容词",
    "adv": "副词",
    "prep": "介词",
    "pronoun": "代词",
    "other": "其他",
}


def is_pronoun(word: str) -> bool:
    return word.lower() in FIXED_PRONOUNS


def _adj_synsets(word: str) -> list:
    return wn.synsets(word, pos="a") + wn.synsets(word, pos="s")


def _adv_synsets(word: str) -> list:
    return wn.synsets(word, pos="r")


def is_preposition(word: str) -> bool:
    return word.lower() in PREPOSITION_WORDS


def refine_other_pos(word: str) -> str:
    """将原 other 类细分为 pronoun / prep / adj / adv / other。"""
    w = word.lower()

    if is_pronoun(w):
        return "pronoun"
    if is_preposition(w):
        return "prep"
    if w in FUNCTION_WORDS:
        return "other"
    if w in MANUAL_ADJ:
        return "adj"
    if w in MANUAL_ADV:
        return "adv"

    adj = _adj_synsets(w)
    adv = _adv_synsets(w)

    if w.endswith("ly"):
        if w in LY_ADJECTIVES or (adj and not adv):
            return "adj"
        if adv or not adj:
            return "adv"

    if adj and adv:
        first = wn.synsets(w)
        if first:
            pos = first[0].pos()
            if pos in ("a", "s"):
                return "adj"
            if pos == "r":
                return "adv"
        return "adj"

    if adj:
        return "adj"
    if adv:
        return "adv"
    return "other"


def classify_word_pos(word: str, coarse: str) -> str:
    """根据粗分类（noun/verb/other）返回细分类。"""
    if coarse == "noun":
        return "noun"
    if coarse == "verb":
        return "verb"
    return refine_other_pos(word)
