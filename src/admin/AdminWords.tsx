import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteAdminWord,
  exportAdminWords,
  fetchAdminLibraryOptions,
  fetchAdminWords,
  regenerateAdminWord,
  updateAdminWord,
  type AdminLibraryOption,
  type AdminWordsResponse,
} from './adminApi'
import type { VocabTierId, VocabWord } from '../modules/vocab-training/types'
import { AdminWordDetailCard } from './AdminWordDetailCard'
import { AdminWordEditModal } from './AdminWordEditModal'

const PAGE_SIZE = 48

const TIER_OPTIONS: Array<{ id: VocabTierId; label: string }> = [
  { id: 'beginner', label: '初级' },
  { id: 'intermediate', label: '中级' },
  { id: 'advanced', label: '高级' },
]

type WordSource =
  | { kind: 'all' }
  | { kind: 'tier'; id: VocabTierId }
  | { kind: 'library'; id: string }

function sourceValue(source: WordSource): string {
  if (source.kind === 'all') return 'all'
  if (source.kind === 'tier') return `tier:${source.id}`
  return `library:${source.id}`
}

function parseSource(value: string): WordSource {
  if (value.startsWith('tier:')) {
    return { kind: 'tier', id: value.slice(5) as VocabTierId }
  }
  if (value.startsWith('library:')) {
    return { kind: 'library', id: value.slice(8) }
  }
  return { kind: 'all' }
}

function sourceLabel(source: WordSource, libraries: AdminLibraryOption[]): string {
  if (source.kind === 'all') return '全部单词'
  if (source.kind === 'tier') {
    return TIER_OPTIONS.find((t) => t.id === source.id)?.label ?? source.id
  }
  return libraries.find((l) => l.id === source.id)?.name ?? source.id
}

export function AdminWords() {
  const [words, setWords] = useState<VocabWord[]>([])
  const [libraries, setLibraries] = useState<AdminLibraryOption[]>([])
  const [pagination, setPagination] = useState<AdminWordsResponse['pagination']>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [source, setSource] = useState<WordSource>({ kind: 'all' })
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [regeneratingWordId, setRegeneratingWordId] = useState<number | null>(null)
  const [regenerateError, setRegenerateError] = useState('')
  const [deletingWordId, setDeletingWordId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetchAdminLibraryOptions()
      .then(setLibraries)
      .catch(() => {
        /* 学习库列表加载失败时不阻塞单词列表 */
      })
  }, [])

  const fetchParams = useMemo(() => {
    const base = { q: query, limit: PAGE_SIZE }
    if (source.kind === 'tier') return { ...base, tierId: source.id }
    if (source.kind === 'library') return { ...base, libraryId: source.id }
    return base
  }, [query, source])

  const load = useCallback(
    async (page = 1) => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAdminWords({ ...fetchParams, page })
        setWords(data.words)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [fetchParams],
  )

  useEffect(() => {
    void load(1)
  }, [query, source, load])

  const handleSearch = () => {
    setQuery(searchInput.trim())
  }

  const handleSourceChange = (value: string) => {
    setSource(parseSource(value))
  }

  const handleSave = async (patch: {
    meaningZh: string
    exampleEn: string
    exampleZh: string
    pos: VocabWord['pos']
  }) => {
    if (!editingWord) return
    setSaving(true)
    setSaveError('')
    try {
      const updated = await updateAdminWord(editingWord.id, patch)
      setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
      setEditingWord(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateWord = async (word: VocabWord) => {
    setRegeneratingWordId(word.id)
    setRegenerateError('')
    try {
      const updated = await regenerateAdminWord(word.id)
      setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : 'AI 优化失败')
    } finally {
      setRegeneratingWordId(null)
    }
  }

  const handleDeleteWord = async (word: VocabWord) => {
    if (!window.confirm(`确定删除单词「${word.word}」？此操作不可恢复。`)) return

    setDeletingWordId(word.id)
    setDeleteError('')
    try {
      await deleteAdminWord(word.id)
      if (editingWord?.id === word.id) {
        setEditingWord(null)
        setSaveError('')
      }
      const remainingOnPage = words.length - 1
      const nextPage =
        remainingOnPage <= 0 && pagination.page > 1 ? pagination.page - 1 : pagination.page
      await load(nextPage)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingWordId(null)
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    setExportError('')
    try {
      const title = sourceLabel(source, libraries)
      const params =
        source.kind === 'tier'
          ? { q: query, tierId: source.id, title }
          : source.kind === 'library'
            ? { q: query, libraryId: source.id, title }
            : { q: query, title }
      const { blob, filename } = await exportAdminWords(params)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <header className="admin-page-hero admin-page-hero-split">
        <div>
          <h1>单词库</h1>
          <p>查看并编辑系统标准单词与学习库单词，支持按档位或学习库筛选。</p>
        </div>
        <div className="admin-page-actions">
          <label className="admin-inline-field">
            <span>词库</span>
            <select value={sourceValue(source)} onChange={(e) => handleSourceChange(e.target.value)}>
              <option value="all">全部单词</option>
              <optgroup label="标准档位">
                {TIER_OPTIONS.map((o) => (
                  <option key={o.id} value={`tier:${o.id}`}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
              {libraries.length > 0 && (
                <optgroup label="学习库">
                  {libraries.map((lib) => (
                    <option key={lib.id} value={`library:${lib.id}`}>
                      {lib.name}（{lib.wordCount}）
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <label className="admin-inline-field" style={{ minWidth: 220 }}>
            <span>搜索</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="单词或释义"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
            />
          </label>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleSearch}>
            搜索
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            disabled={exporting || loading}
            onClick={() => void handleExportPdf()}
          >
            {exporting ? '导出中…' : '导出 PDF'}
          </button>
        </div>
      </header>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {exportError && <p className="admin-alert admin-alert-error">{exportError}</p>}
      {regenerateError && <p className="admin-alert admin-alert-error">{regenerateError}</p>}
      {deleteError && <p className="admin-alert admin-alert-error">{deleteError}</p>}

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>
            单词详情
            {!loading && (
              <span style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: 8 }}>
                {sourceLabel(source, libraries)} · 共 {pagination.total} 条
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <p className="admin-status">加载中...</p>
        ) : (
          <>
            {words.length > 0 ? (
              <div className="admin-word-detail-list admin-word-detail-list--4col">
                {words.map((word) => (
                  <AdminWordDetailCard
                    key={word.id}
                    word={word}
                    alwaysShowEdit
                    showRegenerate
                    regenerating={regeneratingWordId === word.id}
                    deleting={deletingWordId === word.id}
                    onEdit={setEditingWord}
                    onRegenerate={(item) => void handleRegenerateWord(item)}
                    onDelete={(item) => void handleDeleteWord(item)}
                  />
                ))}
              </div>
            ) : (
              <p className="admin-status">暂无匹配单词</p>
            )}

            <div className="admin-word-bank-pagination">
              <span className="admin-status">
                第 {pagination.page} / {pagination.totalPages} 页
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="admin-ghost-button"
                  disabled={pagination.page <= 1}
                  onClick={() => void load(pagination.page - 1)}
                >
                  上一页
                </button>
                <button
                  type="button"
                  className="admin-ghost-button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => void load(pagination.page + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <AdminWordEditModal
        open={Boolean(editingWord)}
        word={editingWord}
        saving={saving}
        error={saveError}
        onClose={() => {
          if (!saving) {
            setEditingWord(null)
            setSaveError('')
          }
        }}
        onSave={handleSave}
      />
    </div>
  )
}
