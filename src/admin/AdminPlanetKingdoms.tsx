import { useEffect, useMemo, useState } from 'react'
import {
  fetchAdminKingdoms,
  resetAdminKingdomOverride,
  updateAdminKingdom,
  type AdminKingdom,
  type BattleMapNodeConfig,
} from './adminApi'

const TERRAIN_OPTIONS = [
  'camp',
  'village',
  'forest',
  'valley',
  'castle',
  'fork',
  'waypoint',
  'tower',
] as const

export function AdminPlanetKingdoms() {
  const [kingdoms, setKingdoms] = useState<AdminKingdom[]>([])
  const [selectedId, setSelectedId] = useState<string>('kingdom-1')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [mapX, setMapX] = useState(50)
  const [mapY, setMapY] = useState(50)
  const [mapRegion, setMapRegion] = useState('')
  const [nodes, setNodes] = useState<BattleMapNodeConfig[]>([])

  const load = () => {
    setLoading(true)
    setError('')
    fetchAdminKingdoms()
      .then((list) => {
        setKingdoms(list)
        if (!list.some((k) => k.id === selectedId) && list[0]) {
          setSelectedId(list[0].id)
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const selected = useMemo(
    () => kingdoms.find((k) => k.id === selectedId) ?? null,
    [kingdoms, selectedId],
  )

  useEffect(() => {
    if (!selected) return
    setName(selected.name)
    setSubtitle(selected.subtitle)
    setMapX(selected.mapPosition.x)
    setMapY(selected.mapPosition.y)
    setMapRegion(selected.mapPosition.region)
    const layout = selected.battleMapLayout
    if (layout) {
      const path = [...layout.spineBeforeFork, ...layout.spineAfterFork]
      const ordered = path.length > 0 ? path : Object.keys(layout.nodes)
      setNodes(
        ordered
          .map((id) => layout.nodes[id])
          .filter(Boolean)
          .concat(
            Object.values(layout.nodes).filter((n) => !ordered.includes(n.id)),
          ),
      )
    } else {
      setNodes([])
    }
  }, [selected])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      let battleMapLayout = selected.battleMapLayout
      if (battleMapLayout && nodes.length > 0) {
        const nodeMap: Record<string, BattleMapNodeConfig> = {}
        for (const node of nodes) {
          nodeMap[node.id] = { ...node }
        }
        battleMapLayout = {
          ...battleMapLayout,
          nodes: nodeMap,
        }
      }

      const updated = await updateAdminKingdom(selected.id, {
        name: name.trim(),
        subtitle: subtitle.trim(),
        mapX,
        mapY,
        mapRegion: mapRegion.trim(),
        battleMapLayout,
      })
      setKingdoms((prev) => prev.map((k) => (k.id === updated.id ? updated : k)))
      setMessage('已保存')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const resetOverride = async () => {
    if (!selected) return
    if (!window.confirm(`确定将「${selected.name}」恢复为默认配置？`)) return
    setSaving(true)
    setError('')
    try {
      const updated = await resetAdminKingdomOverride(selected.id)
      setKingdoms((prev) => prev.map((k) => (k.id === updated.id ? updated : k)))
      setMessage('已恢复默认')
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败')
    } finally {
      setSaving(false)
    }
  }

  const updateNode = (index: number, patch: Partial<BattleMapNodeConfig>) => {
    setNodes((prev) => prev.map((n, i) => (i === index ? { ...n, ...patch } : n)))
  }

  return (
    <div>
      <header className="admin-page-hero">
        <div>
          <h1>征服星球 · 七王国</h1>
          <p>管理王国名称、大陆全景图标注位置，以及战斗地图节点标注。</p>
        </div>
      </header>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert">{message}</p>}

      {loading ? (
        <p className="admin-status">加载中...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
          <aside className="admin-section" style={{ padding: 12 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>王国列表</h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {kingdoms.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`admin-nav-item${selectedId === k.id ? ' is-active' : ''}`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => setSelectedId(k.id)}
                >
                  <span>{k.order}. {k.name}</span>
                  {k.hasOverride && (
                    <span className="admin-nav-badge" style={{ marginLeft: 'auto' }}>
                      已定制
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <section className="admin-section">
                <div className="admin-section-head">
                  <h2>基本信息</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selected.hasOverride && (
                      <button
                        type="button"
                        className="admin-ghost-button"
                        disabled={saving}
                        onClick={() => void resetOverride()}
                      >
                        恢复默认
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      disabled={saving || !name.trim()}
                      onClick={() => void save()}
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>王国名称</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                    <span>副标题</span>
                    <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                  </label>
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section-head">
                  <h2>大陆全景图标注</h2>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 360px) 1fr',
                    gap: 16,
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '1000 / 700',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#1a1208 url(/assets/conquer-planet/world-map-bg.png) center/cover',
                    }}
                  >
                    <div
                      title={name}
                      style={{
                        position: 'absolute',
                        left: `${mapX}%`,
                        top: `${mapY}%`,
                        transform: 'translate(-50%, -50%)',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#f5c842',
                        border: '2px solid #fff',
                        boxShadow: '0 0 8px rgba(245,200,66,0.8)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>区域名称</span>
                      <input value={mapRegion} onChange={(e) => setMapRegion(e.target.value)} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>横坐标 X（%）</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={mapX}
                        onChange={(e) => setMapX(Number(e.target.value))}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>纵坐标 Y（%）</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={mapY}
                        onChange={(e) => setMapY(Number(e.target.value))}
                      />
                    </label>
                    <p className="admin-status">难度：{selected.difficulty} · 主题：{selected.theme}</p>
                  </div>
                </div>
              </section>

              {nodes.length > 0 && (
                <section className="admin-section">
                  <div className="admin-section-head">
                    <h2>战斗地图节点标注</h2>
                    <span className="admin-status">王国 {selected.id} · {nodes.length} 个节点</span>
                  </div>
                  <table className="admin-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>节点 ID</th>
                        <th>名称</th>
                        <th>X (%)</th>
                        <th>Y (%)</th>
                        <th>地形</th>
                        <th>关卡</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map((node, index) => (
                        <tr key={node.id}>
                          <td>{node.id}</td>
                          <td>
                            <input
                              value={node.label}
                              onChange={(e) => updateNode(index, { label: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step={0.1}
                              value={node.x}
                              onChange={(e) => updateNode(index, { x: Number(e.target.value) })}
                              style={{ width: 72 }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step={0.1}
                              value={node.y}
                              onChange={(e) => updateNode(index, { y: Number(e.target.value) })}
                              style={{ width: 72 }}
                            />
                          </td>
                          <td>
                            <select
                              value={node.terrain}
                              onChange={(e) => updateNode(index, { terrain: e.target.value })}
                            >
                              {TERRAIN_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{node.levelId ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
