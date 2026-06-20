#!/usr/bin/env python3
"""将 DOCX 文件批量转换为 Markdown，保留标题、段落、列表、表格。"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from docx import Document
from docx.document import Document as DocumentType
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph

HEADING_STYLES: dict[str, int] = {
    "Title": 1,
    "标题": 1,
    "Subtitle": 2,
    "副标题": 2,
    **{f"Heading {i}": i for i in range(1, 7)},
    **{f"标题 {i}": i for i in range(1, 7)},
}


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    return name.strip(" .") or "untitled"


def postprocess_markdown(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def runs_to_md(paragraph: Paragraph) -> str:
    parts: list[str] = []
    for run in paragraph.runs:
        text = run.text
        if not text:
            continue
        if run.bold and run.italic:
            text = f"***{text}***"
        elif run.bold:
            text = f"**{text}**"
        elif run.italic:
            text = f"*{text}*"
        parts.append(text)
    return "".join(parts).strip()


def heading_level(paragraph: Paragraph) -> int | None:
    style_name = paragraph.style.name if paragraph.style else ""
    if style_name in HEADING_STYLES:
        return HEADING_STYLES[style_name]
    if style_name.startswith("Heading ") or style_name.startswith("标题 "):
        tail = style_name.split()[-1]
        if tail.isdigit():
            return int(tail)
    return None


def list_prefix(paragraph: Paragraph) -> str | None:
    p_pr = paragraph._element.pPr  # noqa: SLF001
    if p_pr is None or p_pr.numPr is None:
        return None

    ilvl = p_pr.numPr.ilvl
    level = int(ilvl.val) if ilvl is not None and ilvl.val is not None else 0
    indent = "  " * level

    num_id = p_pr.numPr.numId
    if num_id is None or num_id.val is None:
        return f"{indent}- "

    # Word 编号列表与项目符号在 Markdown 中统一用有序/无序近似表示
    is_ordered = paragraph.text[:3].strip().isdigit() if paragraph.text else False
    if is_ordered:
        return f"{indent}1. "
    return f"{indent}- "


def escape_table_cell(text: str) -> str:
    return text.replace("\n", "<br>").replace("|", "\\|").strip()


def table_to_md(table: Table) -> str:
    if not table.rows:
        return ""

    rows: list[list[str]] = []
    for row in table.rows:
        rows.append([escape_table_cell(cell.text) for cell in row.cells])

    col_count = max(len(r) for r in rows)
    for row in rows:
        while len(row) < col_count:
            row.append("")

    lines = [
        "| " + " | ".join(rows[0]) + " |",
        "| " + " | ".join(["---"] * col_count) + " |",
    ]
    for row in rows[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines) + "\n\n"


def iter_block_items(parent: DocumentType):
    for child in parent.element.body:
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def paragraph_to_md(paragraph: Paragraph) -> str:
    text = runs_to_md(paragraph)
    if not text:
        return ""

    level = heading_level(paragraph)
    if level:
        return f"{'#' * level} {text}\n\n"

    prefix = list_prefix(paragraph)
    if prefix:
        return f"{prefix}{text}\n\n"

    return f"{text}\n\n"


def convert_docx_to_md(
    docx_path: Path,
    output_dir: Path | None = None,
) -> Path:
    if not docx_path.exists():
        raise FileNotFoundError(f"文件不存在: {docx_path}")
    if docx_path.suffix.lower() != ".docx":
        raise ValueError(f"仅支持 .docx 文件: {docx_path}")

    out_dir = output_dir or docx_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    stem = sanitize_filename(docx_path.stem)
    md_path = out_dir / f"{stem}.md"

    document = Document(str(docx_path))
    chunks: list[str] = [f"<!-- source: {docx_path.name} -->\n\n"]

    for block in iter_block_items(document):
        if isinstance(block, Paragraph):
            chunks.append(paragraph_to_md(block))
        elif isinstance(block, Table):
            chunks.append(table_to_md(block))

    markdown = postprocess_markdown("".join(chunks))
    md_path.write_text(markdown, encoding="utf-8")
    return md_path


def collect_docx_files(inputs: list[str]) -> list[Path]:
    files: list[Path] = []
    for item in inputs:
        path = Path(item)
        if path.is_dir():
            files.extend(sorted(path.rglob("*.docx")))
        elif path.is_file():
            files.append(path)
        else:
            raise FileNotFoundError(f"路径不存在: {path}")

    seen: set[Path] = set()
    unique: list[Path] = []
    for file_path in files:
        resolved = file_path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            unique.append(file_path)
    return unique


def main() -> int:
    parser = argparse.ArgumentParser(
        description="将 DOCX 批量转换为 Markdown（保留标题、段落、列表、表格）"
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="一个或多个 .docx 文件路径，或包含 .docx 的目录",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="输出目录（默认与源文件同目录）",
    )
    args = parser.parse_args()

    try:
        docx_files = collect_docx_files(args.inputs)
    except (FileNotFoundError, ValueError) as exc:
        print(f"错误: {exc}", file=sys.stderr)
        return 1

    if not docx_files:
        print("未找到 .docx 文件", file=sys.stderr)
        return 1

    ok, fail = 0, 0
    for docx_path in docx_files:
        try:
            md_path = convert_docx_to_md(docx_path, output_dir=args.output)
            print(f"[OK] {docx_path.name} -> {md_path}")
            ok += 1
        except Exception as exc:
            print(f"[FAIL] {docx_path.name}: {exc}", file=sys.stderr)
            fail += 1

    print(f"\n完成: {ok} 成功, {fail} 失败")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
