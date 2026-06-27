import type { AuthUser } from '../modules/auth/authApi'

interface HomePageProps {
  user: AuthUser | null
  authLoading: boolean
  onLogout: () => void
  onEnterVocabTraining: () => void
  onEnterPrepGame: () => void
  onEnterSentenceGame: () => void
  onEnterFreeVocab: () => void
}

export function HomePage({
  user,
  authLoading,
  onLogout,
  onEnterVocabTraining,
  onEnterPrepGame,
  onEnterSentenceGame,
  onEnterFreeVocab,
}: HomePageProps) {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>LearningKids</h1>
        <p>少儿互动学习平台，选择一个模块开始练习</p>
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
        <button
          type="button"
          className="home-entry home-entry-prep"
          onClick={onEnterPrepGame}
        >
          <span className="home-entry-icon" aria-hidden="true">
            in
          </span>
          <span className="home-entry-title">精灵起源</span>
          <span className="home-entry-desc">
            自动生成中考精灵题，每次练习句子不同，可反复刷题
          </span>
        </button>

        <button
          type="button"
          className="home-entry home-entry-sentence"
          onClick={onEnterSentenceGame}
        >
          <span className="home-entry-icon" aria-hidden="true">
            SVO
          </span>
          <span className="home-entry-title">句型侦探</span>
          <span className="home-entry-desc">
            主谓宾定状补填空练习，掌握动词时态、状语与形副用法
          </span>
        </button>

        <button
          type="button"
          className="home-entry home-entry-free-vocab"
          onClick={onEnterFreeVocab}
        >
          <span className="home-entry-icon" aria-hidden="true">
            FV
          </span>
          <span className="home-entry-title">自由背单词</span>
          <span className="home-entry-desc">
            先筛选 100 个基础词，再按句型与 AI 自由选词背诵
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
