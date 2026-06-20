import type { AuthUser } from '../modules/auth/authApi'

interface HomePageProps {
  user: AuthUser | null
  authLoading: boolean
  onLogout: () => void
  onEnterGraph: () => void
  onEnterSignTraining: () => void
  onEnterVocabTraining: () => void
}

export function HomePage({
  user,
  authLoading,
  onLogout,
  onEnterGraph,
  onEnterSignTraining,
  onEnterVocabTraining,
}: HomePageProps) {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>初中数学练习</h1>
        <p>选择一个模块开始练习</p>
        <div className="home-auth-bar">
          {authLoading ? (
            <span className="home-auth-status">登录状态加载中…</span>
          ) : user ? (
            <>
              <span className="home-auth-status">已登录：{user.displayName}</span>
              <button type="button" className="home-auth-button" onClick={onLogout}>
                退出
              </button>
            </>
          ) : (
            <span className="home-auth-status">单词记忆需登录后使用</span>
          )}
        </div>
      </header>

      <div className="home-entries">
        <button type="button" className="home-entry home-entry-graph" onClick={onEnterGraph}>
          <span className="home-entry-icon" aria-hidden="true">
            📈
          </span>
          <span className="home-entry-title">函数图像</span>
          <span className="home-entry-desc">
            输入一次函数、二次函数或反比例函数，在同一坐标系中观察图像
          </span>
        </button>

        <button
          type="button"
          className="home-entry home-entry-sign"
          onClick={onEnterSignTraining}
        >
          <span className="home-entry-icon" aria-hidden="true">
            ±
          </span>
          <span className="home-entry-title">正负训练营</span>
          <span className="home-entry-desc">
            闪卡练习正负号变换：去括号、变号与系数分配
          </span>
        </button>

        <button
          type="button"
          className="home-entry home-entry-vocab"
          onClick={onEnterVocabTraining}
        >
          <span className="home-entry-icon" aria-hidden="true">
            Ab
          </span>
          <span className="home-entry-title">单词记忆</span>
          <span className="home-entry-desc">
            图形记忆、闪卡详解与发音测试，登录后进度保存在服务器
          </span>
        </button>
      </div>

      <footer className="home-footer">
        <a href="/admin" className="home-admin-link">
          管理后台
        </a>
      </footer>
    </div>
  )
}
