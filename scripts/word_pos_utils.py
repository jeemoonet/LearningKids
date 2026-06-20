"""词性细分工具：将 other 类进一步划分为 adj / adv / other。"""

from __future__ import annotations

from nltk.corpus import wordnet as wn

# 功能词、代词、介词、连词等 — 保持 other
FUNCTION_WORDS = {
    "a", "an", "the", "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them", "my", "your", "his", "its", "our", "their",
    "mine", "yours", "hers", "ours", "theirs", "myself", "yourself", "himself",
    "herself", "itself", "ourselves", "themselves",
    "in", "on", "at", "for", "with", "from", "to", "of", "by", "about", "into",
    "through", "during", "before", "after", "between", "under", "over", "above",
    "below", "across", "against", "without", "within", "upon", "among", "along",
    "around", "behind", "beside", "beyond", "inside", "outside", "toward", "towards",
    "and", "or", "but", "so", "if", "because", "while", "though", "when", "where",
    "why", "how", "what", "who", "which", "that", "this", "these", "those",
    "both", "either", "neither", "not", "no", "yes", "nor",
    "very", "quite", "just", "only", "even", "still", "already", "yet", "again",
    "here", "there", "now", "then", "as", "than", "such", "whether",
    "mr", "dr", "ms", "mrs", "docx", "didn", "aske", "fixe", "rin", "sara",
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
    "other": "其他",
}


def _adj_synsets(word: str) -> list:
    return wn.synsets(word, pos="a") + wn.synsets(word, pos="s")


def _adv_synsets(word: str) -> list:
    return wn.synsets(word, pos="r")


def refine_other_pos(word: str) -> str:
    """将原 other 类细分为 adj / adv / other。"""
    w = word.lower()

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
