import { accessSync, constants, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from './gameGroups.js'

export interface WordExportFilters {
  q?: string
  tierId?: string
  libraryId?: string
}

export interface WordExportItem {
  word: string
  posLabel: string
  meaningZh: string
  exampleEn: string
}

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function findChrome(): string | null {
  for (const path of CHROME_PATHS) {
    try {
      accessSync(path, constants.X_OK)
      return path
    } catch {
      /* try next */
    }
  }
  return null
}

export function queryWordsForExport(db: DatabaseSync, filters: WordExportFilters): WordExportItem[] {
  const q = (filters.q ?? '').trim().toLowerCase()
  const tierId = (filters.tierId ?? '').trim()
  const libraryId = (filters.libraryId ?? '').trim()

  const conditions: string[] = []
  const params: Array<string | number> = []
  const fromJoin = libraryId
    ? `FROM words w INNER JOIN library_words lw ON lw.word_id = w.id AND lw.library_id = ?`
    : 'FROM words w'

  if (libraryId) {
    params.push(libraryId)
  } else if (tierId) {
    conditions.push('w.tier_id = ?')
    params.push(tierId)
  }
  if (q) {
    conditions.push('(lower(w.word) LIKE ? OR lower(w.meaning_zh) LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderBy = libraryId ? 'lw.sort_order, w.id' : 'w.tier_id, w.sort_order, w.id'

  const rows = db
    .prepare(`SELECT w.* ${fromJoin} ${where} ORDER BY ${orderBy}`)
    .all(...params) as Array<Record<string, unknown>>

  return rows.map((row) => {
    const mapped = mapWordRow(row)
    return {
      word: mapped.word,
      posLabel: mapped.posLabel,
      meaningZh: mapped.meaningZh,
      exampleEn: mapped.exampleEn,
    }
  })
}

function buildWordCell(item: WordExportItem): string {
  const pos = item.posLabel.trim()
  const posHtml = pos ? `<span class="word-pos">${escapeHtml(pos)}</span>` : ''
  const example = item.exampleEn.trim()
  const exampleHtml = example ? `<div class="word-example">${escapeHtml(example)}</div>` : ''

  return `<td class="word-cell">
      <div class="word-head"><span class="word-en">${escapeHtml(item.word)}</span>${posHtml}</div>
      <div class="word-meaning">${escapeHtml(item.meaningZh)}</div>
      ${exampleHtml}
    </td>`
}

export function buildWordListExportHtml(title: string, words: WordExportItem[]): string {
  const cols = 3
  const rows: string[] = []
  for (let i = 0; i < words.length; i += cols) {
    const cells = words.slice(i, i + cols).map(buildWordCell)
    while (cells.length < cols) {
      cells.push('<td class="word-cell empty"></td>')
    }
    rows.push(`<tr>${cells.join('')}</tr>`)
  }

  const exportedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  const tableBody = rows.join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: A4; margin: 12mm; }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
      margin: 24px;
      color: #1a1a1a;
      background: #f7f8fa;
    }
    h1 { font-size: 20px; margin: 0 0 8px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    tr { page-break-inside: avoid; break-inside: avoid; }
    td.word-cell {
      width: 33.33%;
      vertical-align: top;
      padding: 10px 12px;
      border: 1px solid #e8e8e8;
      min-height: 100px;
    }
    td.empty { background: #fafafa; }
    .word-head {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .word-en {
      font-size: 16px;
      font-weight: 700;
      color: #1565c0;
    }
    .word-pos {
      font-size: 11px;
      color: #888;
      background: #f0f4f8;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .word-meaning {
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 6px;
    }
    .word-example {
      font-size: 11px;
      line-height: 1.4;
      color: #555;
      font-style: italic;
    }
    @media print {
      body { background: #fff; margin: 0; }
      table { box-shadow: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">导出时间：${escapeHtml(exportedAt)} · 共 ${words.length} 词 · 每行 3 列</p>
  <table>
    <tbody>
${tableBody}
    </tbody>
  </table>
</body>
</html>`
}

export function htmlToPdf(html: string): Buffer | null {
  const chrome = findChrome()
  if (!chrome) return null

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const htmlPath = join(tmpdir(), `word-export-${stamp}.html`)
  const pdfPath = join(tmpdir(), `word-export-${stamp}.pdf`)

  writeFileSync(htmlPath, html, 'utf8')

  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      htmlPath,
    ],
    { timeout: 120000 },
  )

  try {
    unlinkSync(htmlPath)
  } catch {
    /* ignore */
  }

  if (result.status !== 0 || result.error) {
    try {
      unlinkSync(pdfPath)
    } catch {
      /* ignore */
    }
    return null
  }

  try {
    return readFileSync(pdfPath)
  } finally {
    try {
      unlinkSync(pdfPath)
    } catch {
      /* ignore */
    }
  }
}

export function sanitizeExportFilename(name: string): string {
  return name.replace(/[^\w\u4e00-\u9fff-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'words'
}

/** HTTP 头 filename 仅支持 ASCII，中文名用 filename* */
export function buildAttachmentContentDisposition(filename: string): string {
  const asciiOnly = filename.replace(/[^\x20-\x7E]/g, '').replace(/^[-_.\s]+|[-_.\s]+$/g, '')
  const asciiFallback = (asciiOnly && asciiOnly.length > 1 ? asciiOnly : 'export').replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(filename)
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
}
