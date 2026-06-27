import { useEffect, useMemo, useState } from 'react'
import { AdminBattleMapEditor } from './components/AdminBattleMapEditor'
import { AdminContinentMapPicker } from './components/AdminContinentMapPicker'
import {
  fetchAdminKingdoms,
  resetAdminKingdomOverride,
  updateAdminKingdom,
  type AdminKingdom,
  type BattleMapLayoutConfig,
} from './adminApi'
import { getKingdomMapImage } from '../modules/conquer-planet/components/ImageKingdomMapScene'

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
  const [battleMapLayout, setBattleMapLayout] = useState<BattleMapLayoutConfig | null>(null)

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

  const battleMapImage = selected ? getKingdomMapImage(selected.id) : null

  useEffect(() => {
    if (!selected) return
    setName(selected.name)
    setSubtitle(selected.subtitle)
    setMapX(selected.mapPosition.x)
    setMapY(selected.mapPosition.y)
    setMapRegion(selected.mapPosition.region)
    setBattleMapLayout(selected.battleMapLayout ? structuredClone(selected.battleMapLayout) : null)
  }, [selected])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateAdminKingdom(selected.id, {
        name: name.trim(),
        subtitle: subtitle.trim(),
        mapX,
        mapY,
        mapRegion: mapRegion.trim(),
        battleMapLayout,
      })
      setKingdoms((prev) => prev.map((k) => (k.id === updated.id ? updated : k)))
      setMessage('已保存到服务端')
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

  return (
    <div>
      <header className="admin-page-hero admin-page-hero-split">
        <div>
          <h1>征服星球 · 七王国</h1>
          <p>在管理台标注大陆位置与战斗地图节点，保存后玩家端即时生效。</p>
        </div>
        {selected && (
          <div className="admin-page-actions">
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
        )}
      </header>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert">{message}</p>}

      {loading ? (
        <p className="admin-status">加载中...</p>
      ) : (
        <div className="admin-planet-layout">
          <aside className="admin-section admin-planet-sidebar">
            <h2>王国列表</h2>
            <nav className="admin-planet-nav">
              {kingdoms.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`admin-nav-item${selectedId === k.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedId(k.id)}
                >
                  <span>{k.order}. {k.name}</span>
                  {k.hasOverride && <span className="admin-nav-badge">已定制</span>}
                </button>
              ))}
            </nav>
          </aside>

          {selected && (
            <div className="admin-planet-main">
              <section className="admin-section">
                <div className="admin-section-head">
                  <h2>基本信息</h2>
                </div>
                <div className="admin-form-card">
                  <div className="admin-field-grid admin-field-grid--basic">
                    <label className="admin-field admin-field--md">
                      <span className="admin-field__label">王国名称</span>
                      <input
                        className="admin-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="输入王国名称"
                      />
                    </label>
                    <label className="admin-field admin-field--full">
                      <span className="admin-field__label">副标题</span>
                      <input
                        className="admin-input"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="输入副标题描述"
                      />
                    </label>
                  </div>
                  <div className="admin-meta-tags">
                    <span className="admin-meta-tag">难度 {selected.difficulty}</span>
                    <span className="admin-meta-tag">主题 {selected.theme}</span>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section-head">
                  <h2>大陆全景图标注</h2>
                </div>
                <AdminContinentMapPicker
                  mapX={mapX}
                  mapY={mapY}
                  mapRegion={mapRegion}
                  kingdomName={name}
                  onPositionChange={(x, y) => {
                    setMapX(x)
                    setMapY(y)
                  }}
                  onRegionChange={setMapRegion}
                />
              </section>

              {battleMapLayout && (
                <section className="admin-section">
                  <div className="admin-section-head">
                    <h2>战斗地图节点标注</h2>
                    <span className="admin-status">
                      {selected.id}
                      {battleMapImage ? ' · 底图对齐模式' : ' · 坐标模式'}
                    </span>
                  </div>
                  <div className="admin-battle-map">
                    <AdminBattleMapEditor
                      layout={battleMapLayout}
                      mapImage={battleMapImage}
                      mapLabel={`${name} 战斗地图`}
                      onLayoutChange={setBattleMapLayout}
                    />
                  </div>
                </section>
              )}

              {!battleMapLayout && (
                <section className="admin-section">
                  <p className="admin-status">该王国尚未配置战斗地图布局。</p>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
