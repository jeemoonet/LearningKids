#!/usr/bin/env python3
"""备份 app.db 并清洗冗余表与过时数据。

清洗项（与数据库审计结论一致）：
1. DROP 废弃表 word_groups、user_progress
2. 删除已有全局主题（game_tier_groups）的年级下，用户自建分组遗留数据
3. 同步 tiers.group_count（按 game_tier_groups 实际数量）

用法：
  python scripts/cleanup_app_db.py           # 先备份再清洗
  python scripts/cleanup_app_db.py --dry-run # 仅预览
"""

from __future__ import annotations

import argparse
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_DB = ROOT / "server" / "data" / "app.db"
BACKUP_DIR = ROOT / "server" / "data" / "backups"

ORPHAN_TABLES = ("word_groups", "user_progress")


def table_exists(conn: sqlite3.Connection, name: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
        (name,),
    ).fetchone()
    return row is not None


def count_rows(conn: sqlite3.Connection, table: str) -> int:
    if not table_exists(conn, table):
        return 0
    return int(conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0])


def backup_db(dry_run: bool) -> Path:
    if not APP_DB.exists():
        raise SystemExit(f"数据库不存在: {APP_DB}")

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = BACKUP_DIR / f"app.db.{stamp}.bak"

    if dry_run:
        print(f"[dry-run] 将备份到: {dest}")
        return dest

    shutil.copy2(APP_DB, dest)
    print(f"[OK] 已备份: {dest}")
    return dest


def tiers_with_game_groups(conn: sqlite3.Connection) -> list[str]:
    rows = conn.execute(
        "SELECT DISTINCT tier_id FROM game_tier_groups ORDER BY tier_id"
    ).fetchall()
    return [row[0] for row in rows]


def cleanup(conn: sqlite3.Connection, dry_run: bool) -> None:
    report: list[str] = []

    for table in ORPHAN_TABLES:
        n = count_rows(conn, table)
        if n >= 0 and table_exists(conn, table):
            report.append(f"DROP TABLE {table} ({n} 行)")
            if not dry_run:
                conn.execute(f'DROP TABLE IF EXISTS "{table}"')

    game_tiers = tiers_with_game_groups(conn)
    for tier_id in game_tiers:
        ug = conn.execute(
            "SELECT COUNT(*) FROM user_tier_groups WHERE tier_id=?",
            (tier_id,),
        ).fetchone()[0]
        ua = conn.execute(
            "SELECT COUNT(*) FROM user_word_assignments WHERE tier_id=?",
            (tier_id,),
        ).fetchone()[0]
        if ug or ua:
            report.append(
                f"DELETE user_tier_groups/user_word_assignments "
                f"tier={tier_id} ({ug}/{ua} 行)"
            )
            if not dry_run:
                conn.execute(
                    "DELETE FROM user_word_assignments WHERE tier_id=?",
                    (tier_id,),
                )
                conn.execute(
                    "DELETE FROM user_tier_groups WHERE tier_id=?",
                    (tier_id,),
                )

    if not dry_run:
        conn.execute(
            """
            UPDATE tiers
            SET group_count = (
              SELECT COUNT(*) FROM game_tier_groups g WHERE g.tier_id = tiers.id
            )
            """
        )
        report.append("UPDATE tiers.group_count ← game_tier_groups 实际数量")

    print("\n=== 清洗计划 ===")
    for line in report:
        prefix = "[dry-run] " if dry_run else "[OK] "
        print(prefix + line)

    if dry_run:
        print("\n当前表行数预览（清洗后 orphan 表应不存在）:")
        for table in [
            "word_groups",
            "user_progress",
            "user_tier_groups",
            "user_word_assignments",
            "game_tier_groups",
            "tiers",
        ]:
            if table_exists(conn, table):
                print(f"  {table}: {count_rows(conn, table)}")
        rows = conn.execute("SELECT id, group_count FROM tiers ORDER BY id").fetchall()
        print("  tiers.group_count:", dict(rows))


def main() -> None:
    parser = argparse.ArgumentParser(description="备份并清洗 app.db")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅预览，不写库",
    )
    args = parser.parse_args()

    backup_db(dry_run=args.dry_run)

    conn = sqlite3.connect(APP_DB)
    try:
        cleanup(conn, dry_run=args.dry_run)
        if not args.dry_run:
            conn.commit()
            print("\n[OK] 清洗完成")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
