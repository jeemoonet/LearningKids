"""补充时间介词词条，供「时间」场景分组使用。"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "server" / "data" / "app.db"
TIER_ID = "beginner"
THEME = "时间介词"
DEFAULT_GROUP_ID = 1

ALL_TIME_WORDS = [
    "at", "on", "in",
    "for", "since", "during", "through",
    "before", "after", "by", "until", "from",
    "past", "to", "around", "over", "between",
    "ago", "later", "every", "each",
]

NEW_WORDS = [
    {
        "word": "later",
        "phonetic": "/ˈleɪtə(r)/",
        "meaning_zh": "稍后；以后",
        "example_en": "Call me later tonight.",
        "example_zh": "今晚晚点给我打电话。",
        "similar1": "after",
        "similar2": "soon",
        "similar3": "ago",
    },
]

UPDATES = {
    "at": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在（具体时刻）",
        "example_en": "The bus leaves at half past seven.",
        "example_zh": "公交车七点半出发。",
        "similar1": "on",
        "similar2": "in",
        "similar3": "by",
    },
    "on": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在（星期/日期）",
        "example_en": "My birthday is on May 8th.",
        "example_zh": "我的生日在 5 月 8 日。",
        "similar1": "in",
        "similar2": "at",
        "similar3": "by",
    },
    "in": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在（年月/季节/时段）",
        "example_en": "The park is quiet in the evening.",
        "example_zh": "傍晚公园很安静。",
        "similar1": "on",
        "similar2": "at",
        "similar3": "during",
    },
    "for": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "持续（时间段）",
        "example_en": "She slept for eight hours last night.",
        "example_zh": "她昨晚睡了八个小时。",
        "similar1": "since",
        "similar2": "during",
        "similar3": "through",
    },
    "since": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "自从（过去某时至今）",
        "example_en": "Dad has worked here since last year.",
        "example_zh": "爸爸从去年起在这里工作。",
        "similar1": "for",
        "similar2": "from",
        "similar3": "after",
    },
    "during": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在……期间",
        "example_en": "It rained during the trip.",
        "example_zh": "旅行期间下雨了。",
        "similar1": "in",
        "similar2": "for",
        "similar3": "through",
    },
    "through": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "贯穿；经过（时期）",
        "example_en": "Lights stayed on through the storm.",
        "example_zh": "暴风雪中灯一直亮着。",
        "similar1": "during",
        "similar2": "for",
        "similar3": "past",
    },
    "before": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在……之前",
        "example_en": "Wash your hands before lunch.",
        "example_zh": "午饭前洗手。",
        "similar1": "after",
        "similar2": "by",
        "similar3": "until",
    },
    "after": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在……之后",
        "example_en": "Tom called me after the game.",
        "example_zh": "比赛结束后汤姆给我打了电话。",
        "similar1": "before",
        "similar2": "later",
        "similar3": "since",
    },
    "by": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "不晚于（截止）",
        "example_en": "The shop closes by nine tonight.",
        "example_zh": "这家店今晚九点前关门。",
        "similar1": "before",
        "similar2": "until",
        "similar3": "at",
    },
    "until": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "直到……为止",
        "example_en": "The store is open until six.",
        "example_zh": "商店营业到六点。",
        "similar1": "by",
        "similar2": "before",
        "similar3": "after",
    },
    "from": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "从（时间起点）",
        "example_en": "Class runs from nine to three.",
        "example_zh": "课从九点上到三点。",
        "similar1": "to",
        "similar2": "since",
        "similar3": "until",
    },
    "past": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "过（几分）",
        "example_en": "The film starts at twenty past seven.",
        "example_zh": "电影七点二十分开始。",
        "similar1": "to",
        "similar2": "after",
        "similar3": "at",
    },
    "to": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "差（几分）",
        "example_en": "It is five to twelve now.",
        "example_zh": "现在是十一点五十五分。",
        "similar1": "past",
        "similar2": "until",
        "similar3": "from",
    },
    "around": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "大约（时间）",
        "example_en": "Lunch starts around twelve.",
        "example_zh": "午饭大约十二点开始。",
        "similar1": "about",
        "similar2": "at",
        "similar3": "near",
    },
    "over": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在……期间",
        "example_en": "They stayed home over Christmas.",
        "example_zh": "圣诞节期间他们待在家里。",
        "similar1": "during",
        "similar2": "through",
        "similar3": "for",
    },
    "between": {
        "pos": "other",
        "pos_label": "介词",
        "meaning_zh": "在……之间",
        "example_en": "No phones between nine and three.",
        "example_zh": "九点到三点不能用手机。",
        "similar1": "from",
        "similar2": "during",
        "similar3": "among",
    },
    "ago": {
        "pos": "other",
        "pos_label": "副词",
        "meaning_zh": "……以前",
        "example_en": "She moved here two months ago.",
        "example_zh": "她两个月前搬来这里的。",
        "similar1": "before",
        "similar2": "later",
        "similar3": "past",
    },
    "every": {
        "pos": "other",
        "pos_label": "限定词",
        "meaning_zh": "每个；每",
        "example_en": "He runs every day after school.",
        "example_zh": "他放学后每天都跑步。",
        "similar1": "each",
        "similar2": "all",
        "similar3": "daily",
    },
    "each": {
        "pos": "other",
        "pos_label": "限定词",
        "meaning_zh": "每个；各自",
        "example_en": "Each class lasts forty minutes.",
        "example_zh": "每节课四十分钟。",
        "similar1": "every",
        "similar2": "all",
        "similar3": "one",
    },
    "later": {
        "pos": "other",
        "pos_label": "副词",
        "meaning_zh": "稍后；以后",
        "example_en": "Call me later tonight.",
        "example_zh": "今晚晚点给我打电话。",
        "similar1": "after",
        "similar2": "soon",
        "similar3": "ago",
    },
}

THEME_PASSAGES = {
    "时间1-点子面段": {
        "passage_en": (
            "The art show opens at three on Sunday in the city hall. "
            "Many students come in the afternoon to see the work."
        ),
        "passage_zh": "美术展周日下午三点在市政厅开幕。许多学生下午来看作品。",
    },
    "时间2-持续与起点": {
        "passage_en": (
            "We waited for an hour at the station. Mom has cooked here since June. "
            "The game stopped during the rain, but fans stayed through the last minute."
        ),
        "passage_zh": (
            "我们在车站等了一小时。妈妈从六月起在这里做饭。"
            "比赛因雨中止，但球迷坚持到最后一分钟。"
        ),
    },
    "时间3-先后与截止": {
        "passage_en": (
            "Brush your teeth before bed. The bus runs from seven to ten, "
            "and the library stays open until eight. After class, send the photo by five."
        ),
        "passage_zh": (
            "睡前刷牙。公交车从七点到十点运行，图书馆开到八点。"
            "下课后五点前把照片发给我。"
        ),
    },
    "时间4-钟点与其他": {
        "passage_en": (
            "The bell rings at ten past nine. It is a quarter to ten now. "
            "Dinner is around seven. We visit grandma over the weekend, "
            "and nap between one and two."
        ),
        "passage_zh": (
            "铃声响，现在九点十分，差一刻十点。晚饭大约七点。"
            "我们整个周末去看奶奶，一点到两点之间小睡。"
        ),
    },
    "时间5-易混非介词": {
        "passage_en": (
            "Grandpa left the town long ago. Text me later today. "
            "She drinks milk every morning, and each ticket costs ten yuan."
        ),
        "passage_zh": (
            "爷爷很久以前离开了这座小镇。今天晚些时候给我发短信。"
            "她每天早上喝牛奶，每张票十元。"
        ),
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
                tier_id, group_id, theme, sort_order,
                word, phonetic, pos, pos_label, meaning_zh,
                example_en, example_zh,
                similar1, similar2, similar3
            ) VALUES (?, ?, ?, ?, ?, ?, 'other', '介词', ?, ?, ?, ?, ?, ?)
            """,
            (
                TIER_ID,
                DEFAULT_GROUP_ID,
                THEME,
                next_sort,
                record["word"],
                record.get("phonetic", ""),
                record["meaning_zh"],
                record["example_en"],
                record["example_zh"],
                record.get("similar1", ""),
                record.get("similar2", ""),
                record.get("similar3", ""),
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

    for word in ALL_TIME_WORDS:
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
                SET tier_id = ?, group_id = ?, theme = ?
                WHERE id = ?
                """,
                (TIER_ID, DEFAULT_GROUP_ID, THEME, row["id"]),
            )
            moved += 1
            print(f"move to beginner: {word}")

    for title, passage in THEME_PASSAGES.items():
        result = cur.execute(
            """
            UPDATE game_tier_groups
            SET passage_en = ?, passage_zh = ?
            WHERE tier_id = ? AND title = ?
            """,
            (passage["passage_en"], passage["passage_zh"], TIER_ID, title),
        )
        if result.rowcount:
            print(f"passage: {title}")
        else:
            print(f"skip passage missing group: {title}")

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
