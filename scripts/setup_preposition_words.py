"""补充位置介词词条，供「介词」场景分组使用。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "server" / "data" / "app.db"
TIER_ID = "beginner"
THEME = "介词、位置关系"
DEFAULT_GROUP_ID = 1

ALL_PREPOSITION_WORDS = [
    "in", "on", "at", "under", "above", "below",
    "behind", "in front of", "beside", "between", "among", "opposite",
    "near", "far from", "around", "inside", "outside", "over",
    "into", "out of", "from", "onto", "off", "to",
    "towards", "away from", "along", "past", "across", "through",
]

NEW_WORDS = [
    {
        "word": "under",
        "phonetic": "/ˈʌndə(r)/",
        "meaning_zh": "在……正下方",
        "example_en": "The cat is under the table.",
        "example_zh": "猫在桌子下面。",
        "similar1": "below",
        "similar2": "on",
        "similar3": "in",
    },
    {
        "word": "above",
        "phonetic": "/əˈbʌv/",
        "meaning_zh": "在……上方",
        "example_en": "The plane is above the city.",
        "example_zh": "飞机在城市上空。",
        "similar1": "over",
        "similar2": "below",
        "similar3": "on",
    },
    {
        "word": "below",
        "phonetic": "/bɪˈləʊ/",
        "meaning_zh": "在……下方",
        "example_en": "The village is below the hill.",
        "example_zh": "村庄在山脚下。",
        "similar1": "under",
        "similar2": "above",
        "similar3": "near",
    },
    {
        "word": "behind",
        "phonetic": "/bɪˈhaɪnd/",
        "meaning_zh": "在……后面",
        "example_en": "Tom stands behind me.",
        "example_zh": "汤姆站在我后面。",
        "similar1": "in front of",
        "similar2": "beside",
        "similar3": "near",
    },
    {
        "word": "in front of",
        "phonetic": "/ɪn frʌnt ɒv/",
        "meaning_zh": "在……前面",
        "example_en": "The tree is in front of the house.",
        "example_zh": "树在房子前面。",
        "similar1": "behind",
        "similar2": "beside",
        "similar3": "near",
    },
    {
        "word": "beside",
        "phonetic": "/bɪˈsaɪd/",
        "meaning_zh": "在……旁边",
        "example_en": "Sit beside me, please.",
        "example_zh": "请坐在我旁边。",
        "similar1": "near",
        "similar2": "behind",
        "similar3": "between",
    },
    {
        "word": "between",
        "phonetic": "/bɪˈtwiːn/",
        "meaning_zh": "在……之间（两者）",
        "example_en": "The shop is between the bank and the park.",
        "example_zh": "商店在银行和公园之间。",
        "similar1": "among",
        "similar2": "beside",
        "similar3": "near",
    },
    {
        "word": "among",
        "phonetic": "/əˈmʌŋ/",
        "meaning_zh": "在……之中（三者及以上）",
        "example_en": "He is popular among his classmates.",
        "example_zh": "他在同学中很受欢迎。",
        "similar1": "between",
        "similar2": "beside",
        "similar3": "around",
    },
    {
        "word": "opposite",
        "phonetic": "/ˈɒpəzɪt/",
        "meaning_zh": "在……对面",
        "example_en": "The bank is opposite the supermarket.",
        "example_zh": "银行在超市对面。",
        "similar1": "near",
        "similar2": "beside",
        "similar3": "behind",
    },
    {
        "word": "far from",
        "phonetic": "/fɑː frɒm/",
        "meaning_zh": "离……远",
        "example_en": "My home is far from school.",
        "example_zh": "我家离学校很远。",
        "similar1": "near",
        "similar2": "away from",
        "similar3": "from",
    },
    {
        "word": "around",
        "phonetic": "/əˈraʊnd/",
        "meaning_zh": "在……周围",
        "example_en": "There are trees around the lake.",
        "example_zh": "湖周围有许多树。",
        "similar1": "near",
        "similar2": "among",
        "similar3": "inside",
    },
    {
        "word": "inside",
        "phonetic": "/ˌɪnˈsaɪd/",
        "meaning_zh": "在……内部",
        "example_en": "Wait inside the classroom.",
        "example_zh": "在教室里等。",
        "similar1": "outside",
        "similar2": "in",
        "similar3": "into",
    },
    {
        "word": "outside",
        "phonetic": "/ˌaʊtˈsaɪd/",
        "meaning_zh": "在……外部",
        "example_en": "Wait outside the door.",
        "example_zh": "在门外等。",
        "similar1": "inside",
        "similar2": "out of",
        "similar3": "near",
    },
    {
        "word": "over",
        "phonetic": "/ˈəʊvə(r)/",
        "meaning_zh": "在……正上方；越过",
        "example_en": "A lamp hangs over the bed.",
        "example_zh": "一盏灯悬在床正上方。",
        "similar1": "above",
        "similar2": "on",
        "similar3": "under",
    },
    {
        "word": "into",
        "phonetic": "/ˈɪntuː/",
        "meaning_zh": "进入……",
        "example_en": "Walk into the room.",
        "example_zh": "走进房间。",
        "similar1": "in",
        "similar2": "out of",
        "similar3": "onto",
    },
    {
        "word": "out of",
        "phonetic": "/aʊt ɒv/",
        "meaning_zh": "从……出来",
        "example_en": "He ran out of the room.",
        "example_zh": "他跑出了房间。",
        "similar1": "into",
        "similar2": "from",
        "similar3": "outside",
    },
    {
        "word": "from",
        "phonetic": "/frɒm/",
        "meaning_zh": "从……；来自",
        "example_en": "I come from Beijing.",
        "example_zh": "我来自北京。",
        "similar1": "to",
        "similar2": "out of",
        "similar3": "into",
    },
    {
        "word": "to",
        "phonetic": "/tuː/",
        "meaning_zh": "到……；向",
        "example_en": "We go to school every day.",
        "example_zh": "我们每天去学校。",
        "similar1": "from",
        "similar2": "into",
        "similar3": "towards",
    },
    {
        "word": "towards",
        "phonetic": "/təˈwɔːdz/",
        "meaning_zh": "朝……方向",
        "example_en": "Run towards the door.",
        "example_zh": "朝门口跑。",
        "similar1": "to",
        "similar2": "away from",
        "similar3": "along",
    },
    {
        "word": "away from",
        "phonetic": "/əˈweɪ frɒm/",
        "meaning_zh": "远离……",
        "example_en": "Stay away from the fire.",
        "example_zh": "远离火。",
        "similar1": "far from",
        "similar2": "towards",
        "similar3": "from",
    },
    {
        "word": "along",
        "phonetic": "/əˈlɒŋ/",
        "meaning_zh": "沿着……",
        "example_en": "Walk along the river.",
        "example_zh": "沿着河走。",
        "similar1": "across",
        "similar2": "through",
        "similar3": "past",
    },
    {
        "word": "across",
        "phonetic": "/əˈkrɒs/",
        "meaning_zh": "横穿；横跨",
        "example_en": "Walk across the street.",
        "example_zh": "过马路。",
        "similar1": "through",
        "similar2": "along",
        "similar3": "over",
    },
    {
        "word": "through",
        "phonetic": "/θruː/",
        "meaning_zh": "穿过……",
        "example_en": "Walk through the forest.",
        "example_zh": "穿过森林。",
        "similar1": "across",
        "similar2": "into",
        "similar3": "along",
    },
]

UPDATES = {
    "near": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在……附近",
        "example_en": "My home is near school.",
        "example_zh": "我家在学校附近。",
        "similar1": "far from",
        "similar2": "beside",
        "similar3": "around",
    },
    "past": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "经过；越过",
        "example_en": "Walk past the library.",
        "example_zh": "经过图书馆。",
        "similar1": "through",
        "similar2": "along",
        "similar3": "across",
    },
    "off": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "从……离开",
        "example_en": "The cat jumped off the table.",
        "example_zh": "猫从桌上跳下来。",
        "similar1": "onto",
        "similar2": "from",
        "similar3": "out of",
    },
    "in": {
        "similar1": "on",
        "similar2": "at",
        "similar3": "into",
    },
    "on": {
        "similar1": "in",
        "similar2": "at",
        "similar3": "onto",
    },
    "at": {
        "similar1": "in",
        "similar2": "on",
        "similar3": "near",
    },
    "onto": {
        "similar1": "on",
        "similar2": "into",
        "similar3": "off",
    },
}


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    max_sort = cur.execute(
        "SELECT COALESCE(MAX(sort_order), 0) FROM words WHERE tier_id = ?",
        (TIER_ID,),
    ).fetchone()[0]
    next_sort = max_sort + 1

    inserted = 0
    moved = 0
    for record in NEW_WORDS:
        exists = cur.execute(
            "SELECT id FROM words WHERE word = ?",
            (record["word"],),
        ).fetchone()
        if exists:
            print(f"skip exists: {record['word']}")
            continue

        cur.execute(
            """
            INSERT INTO words (
                word, phonetic, pos, pos_label, meaning_zh,
                similar1, similar2, similar3,
                example_en, example_zh,
                tier_id, group_id, theme, sort_order,
                freq_level, freq_label, exam_year_count, exam_total_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["word"],
                record.get("phonetic", ""),
                "other",
                "介词",
                record["meaning_zh"],
                record.get("similar1", ""),
                record.get("similar2", ""),
                record.get("similar3", ""),
                record["example_en"],
                record.get("example_zh", ""),
                TIER_ID,
                DEFAULT_GROUP_ID,
                THEME,
                next_sort,
                "medium",
                "中频",
                0,
                0,
            ),
        )
        next_sort += 1
        inserted += 1
        print(f"insert: {record['word']}")

    for word, fields in UPDATES.items():
        row = cur.execute(
            "SELECT id FROM words WHERE word = ?",
            (word,),
        ).fetchone()
        if not row:
            print(f"skip update missing: {word}")
            continue

        assignments = ", ".join(f"{key} = ?" for key in fields)
        values = list(fields.values()) + [row["id"]]
        cur.execute(f"UPDATE words SET {assignments} WHERE id = ?", values)
        print(f"update: {word}")

    for word in ALL_PREPOSITION_WORDS:
        row = cur.execute(
            "SELECT id, tier_id FROM words WHERE word = ?",
            (word,),
        ).fetchone()
        if not row:
            continue
        if row["tier_id"] != TIER_ID:
            cur.execute(
                """
                UPDATE words
                SET tier_id = ?, group_id = ?, theme = ?, pos = 'other', pos_label = '介词'
                WHERE id = ?
                """,
                (TIER_ID, DEFAULT_GROUP_ID, THEME, row["id"]),
            )
            moved += 1
            print(f"move to beginner: {word}")

    for tier_id in ("beginner", "intermediate", "advanced"):
        cur.execute(
            "UPDATE tiers SET word_count = (SELECT COUNT(*) FROM words WHERE tier_id = ?) WHERE id = ?",
            (tier_id, tier_id),
        )

    conn.commit()
    conn.close()
    print(f"done, inserted {inserted} words, moved {moved} to beginner")


if __name__ == "__main__":
    main()
