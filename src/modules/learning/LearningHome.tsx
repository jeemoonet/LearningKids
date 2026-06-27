import type { LearningNav } from './LearningModule'
import type { LearningProfile, LearningSet } from './api'

interface LearningHomeProps {
  profile: LearningProfile | null
  activeSet: LearningSet | null
  nav: LearningNav
  onRefresh: () => Promise<void>
}

function StepCard({
  index,
  title,
  desc,
  done,
  actionLabel,
  onAction,
  disabled,
}: {
  index: number
  title: string
  desc: string
  done: boolean
  actionLabel: string
  onAction: () => void
  disabled?: boolean
}) {
  return (
    <div className={`learning-step${done ? ' is-done' : ''}`}>
      <span className="learning-step-index">{done ? '✓' : index}</span>
      <div className="learning-step-body">
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
      <button type="button" className="learning-step-action" onClick={onAction} disabled={disabled}>
        {actionLabel}
      </button>
    </div>
  )
}

export function LearningHome({ profile, activeSet, nav }: LearningHomeProps) {
  const initDone = profile?.initDone ?? false
  const hasLibrary = Boolean(profile?.currentLibraryId)
  const passedCount = activeSet?.sections.filter((s) => s.status === 'passed').length ?? 0

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <h1>学习中心</h1>
        <p>按四步建立你的单词学习闭环：初始化 → 选库 → 拆节学习 → 测评纳入</p>
      </header>

      <section className="learning-stats">
        <div className="learning-stat">
          <span className="learning-stat-num">{profile?.knownCount ?? 0}</span>
          <span className="learning-stat-label">我的单词库</span>
        </div>
        <div className="learning-stat">
          <span className="learning-stat-num">{profile?.currentLibraryName ?? '未选择'}</span>
          <span className="learning-stat-label">当前学习库</span>
        </div>
        <div className="learning-stat">
          <span className="learning-stat-num">
            {activeSet ? `${passedCount}/${activeSet.sectionCount}` : '—'}
          </span>
          <span className="learning-stat-label">学习集小节进度</span>
        </div>
      </section>

      <section className="learning-steps">
        <StepCard
          index={1}
          title="我的单词库"
          desc={initDone ? '已完成基础词初始化' : '抽取认识的单词，建立学习白名单'}
          done={initDone}
          actionLabel={initDone ? '查看词库' : '去建立'}
          onAction={() => nav.go('init')}
        />
        <StepCard
          index={2}
          title="选择学习库"
          desc={hasLibrary ? `当前目标：${profile?.currentLibraryName}` : '挑选一个学习库作为整体学习目标'}
          done={hasLibrary}
          actionLabel={hasLibrary ? '更换学习库' : '去选库'}
          onAction={() => nav.go('library')}
          disabled={!initDone}
        />
        <StepCard
          index={3}
          title="设定学习集与小节"
          desc={activeSet ? `进行中：${activeSet.libraryName}（${activeSet.size}词/${activeSet.sectionCount}节）` : '从学习库抽取 100 个未掌握词，拆成多个小节'}
          done={Boolean(activeSet)}
          actionLabel={activeSet ? '继续学习' : '创建学习集'}
          onAction={() => nav.go('plan')}
          disabled={!hasLibrary}
        />
        <StepCard
          index={4}
          title="学习与测评"
          desc="多课件巩固每个小节，完形填空测评通过后纳入我的库"
          done={false}
          actionLabel="进入小节"
          onAction={() => nav.go('plan')}
          disabled={!activeSet}
        />
      </section>
    </div>
  )
}
