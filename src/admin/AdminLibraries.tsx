import { useEffect, useState } from 'react'
import { adminApiFetch } from './adminApiFetch'

interface AdminLibrary {
  id: string
  name: string
  description: string
  sourceTier: string | null
  wordCount: number
  sortOrder: number
  isActive: boolean
}

const TIER_OPTIONS = [
  { id: 'beginner', label: '初级' },
  { id: 'intermediate', label: '中级' },
  { id: 'advanced', label: '高级' },
]

export function AdminLibraries() {
  const [libraries, setLibraries] = useState<AdminLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sourceTier, setSourceTier] = useState('beginner')

  const load = () => {
    setLoading(true)
    adminApiFetch<{ libraries: AdminLibrary[] }>('/admin/libraries')
      .then(({ libraries: list }) => setLibraries(list))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const create = async () => {
    setError('')
    try {
      await adminApiFetch('/admin/libraries', {
        method: 'POST',
        body: JSON.stringify({ name, description, sourceTier }),
      })
      setName('')
      setDescription('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    }
  }

  const toggleActive = async (lib: AdminLibrary) => {
    await adminApiFetch(`/admin/libraries/${lib.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !lib.isActive }),
    })
    load()
  }

  const remove = async (lib: AdminLibrary) => {
    if (!window.confirm(`确定删除学习库「${lib.name}」？`)) return
    await adminApiFetch(`/admin/libraries/${lib.id}`, { method: 'DELETE' })
    load()
  }

  const importTier = async (lib: AdminLibrary, tier: string) => {
    setError('')
    try {
      await adminApiFetch(`/admin/libraries/${lib.id}/words/from-tier`, {
        method: 'POST',
        body: JSON.stringify({ tier }),
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    }
  }

  return (
    <div>
      <header className="admin-page-hero">
        <div>
          <h1>学习库管理</h1>
          <p>在标准单词库基础上创建自定义学习库，作为学员的学习目标。</p>
        </div>
      </header>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>新建学习库</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>名称</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：中考核心800词" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
            <span>描述</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>来源档位</span>
            <select value={sourceTier} onChange={(e) => setSourceTier(e.target.value)}>
              {TIER_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="admin-primary-button" onClick={create} disabled={!name.trim()}>
            创建
          </button>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>学习库列表</h2>
        </div>
        {loading ? (
          <p className="admin-status">加载中...</p>
        ) : (
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>名称</th>
                <th>描述</th>
                <th>词数</th>
                <th>来源</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {libraries.map((lib) => (
                <tr key={lib.id}>
                  <td>{lib.name}</td>
                  <td>{lib.description || '—'}</td>
                  <td>{lib.wordCount}</td>
                  <td>{lib.sourceTier ?? '混合'}</td>
                  <td>{lib.isActive ? '上架' : '下架'}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) importTier(lib, e.target.value)
                        e.target.value = ''
                      }}
                    >
                      <option value="">导入档位单词…</option>
                      {TIER_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="admin-ghost-button" onClick={() => toggleActive(lib)}>
                      {lib.isActive ? '下架' : '上架'}
                    </button>
                    <button type="button" className="admin-ghost-button" onClick={() => remove(lib)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
