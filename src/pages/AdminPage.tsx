import { useEffect, useState } from 'react'
import { fetchGameSettings, type GameSettingItem } from '../admin/adminApi'
import { VocabGameSettings } from '../admin/VocabGameSettings'

interface AdminPageProps {
  user: { displayName: string }
  onBack: () => void
  onLogout: () => void
}

type AdminView = 'home' | 'vocab' | 'graph' | 'sign-training'

const NAV_ICONS: Record<string, string> = {
  home: '◫',
  vocab: 'Aa',
  graph: 'ƒ',
  'sign-training': '±',
}

function viewFromSettingId(id: string): AdminView {
  if (id === 'vocab') return 'vocab'
  if (id === 'graph') return 'graph'
  if (id === 'sign-training') return 'sign-training'
  return 'home'
}

export function AdminPage({ user, onBack, onLogout }: AdminPageProps) {
  const [view, setView] = useState<AdminView>('home')
  const [settings, setSettings] = useState<GameSettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGameSettings()
      .then(setSettings)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const navItems: Array<{ id: AdminView; label: string; available: boolean }> = [
    { id: 'home', label: '概览', available: true },
    ...settings.map((item) => ({
      id: viewFromSettingId(item.id),
      label: item.label,
      available: item.available,
    })),
  ]

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">管</span>
          <div>
            <strong>管理后台</strong>
            <span>Learning Console</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="管理导航">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item${view === item.id ? ' is-active' : ''}${item.available ? '' : ' is-disabled'}`}
              disabled={!item.available}
              onClick={() => {
                if (item.available) setView(item.id)
              }}
            >
              <span className="admin-nav-icon">{NAV_ICONS[item.id] ?? '•'}</span>
              <span className="admin-nav-label">{item.label}</span>
              {!item.available && <span className="admin-nav-badge">即将开放</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <span className="admin-user-avatar">{user.displayName.slice(0, 1)}</span>
            <div>
              <strong>{user.displayName}</strong>
              <span>管理员</span>
            </div>
          </div>
          <div className="admin-sidebar-actions">
            <button type="button" className="admin-ghost-button" onClick={onBack}>
              返回首页
            </button>
            <button type="button" className="admin-ghost-button" onClick={onLogout}>
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        {view === 'home' && (
          <>
            <header className="admin-page-hero">
              <div>
                <h1>游戏设置</h1>
                <p>为各训练模块配置分组、难度与学习参数。</p>
              </div>
            </header>

            {loading && <p className="admin-status">加载中...</p>}
            {error && <p className="admin-alert admin-alert-error">{error}</p>}

            <section className="admin-section">
              <div className="admin-section-head">
                <h2>训练模块</h2>
              </div>
              <div className="admin-module-grid">
                {settings.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-module-card${item.available ? '' : ' is-disabled'}`}
                    disabled={!item.available}
                    onClick={() => {
                      if (item.available) setView(viewFromSettingId(item.id))
                    }}
                  >
                    <span className="admin-module-icon">{NAV_ICONS[viewFromSettingId(item.id)] ?? '•'}</span>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                    {!item.available && <em>即将开放</em>}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {view === 'vocab' && <VocabGameSettings />}
      </main>
    </div>
  )
}
