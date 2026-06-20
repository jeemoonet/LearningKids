import { useEffect, useMemo, useState } from 'react'
import { GroupCoverImage } from '../../components/GroupCoverImage'
import { collectSceneThemes, hasGroupCover, parseGroupTheme } from './groupCover'
import { isGroupUnlocked } from './scheduler'
import type { VocabGroup, VocabTier, VocabTierId } from './types'

const TIER_SHORT_LABEL: Record<VocabTierId, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

interface VocabGroupListPageProps {
  tiers: VocabTier[]
  selectedTierId: VocabTierId | null
  onTierChange: (tierId: VocabTierId) => void
  groups: VocabGroup[]
  completedGroups: Set<string>
  error: string
  onBack: () => void
  onOpenGroup: (group: VocabGroup) => void
  onOpenWordbook: () => void
  wordbookCount: number
}

export function VocabGroupListPage({
  tiers,
  selectedTierId,
  onTierChange,
  groups,
  completedGroups,
  error,
  onBack,
  onOpenGroup,
  onOpenWordbook,
  wordbookCount,
}: VocabGroupListPageProps) {
  const [sceneFilter, setSceneFilter] = useState('全部')

  const sceneThemes = useMemo(() => collectSceneThemes(groups), [groups])

  useEffect(() => {
    setSceneFilter('全部')
  }, [selectedTierId])

  const filteredGroups = useMemo(() => {
    if (sceneFilter === '全部') return groups
    return groups.filter((group) => parseGroupTheme(group.title) === sceneFilter)
  }, [groups, sceneFilter])

  return (
    <div className="module module-vocab-training">
      <header className="vocab-home-header">
        <button type="button" className="module-back-button" onClick={onBack}>
          ← 返回首页
        </button>
        <div className="vocab-home-header-row">
          <div className="vocab-home-title-block">
            <h1>单词记忆</h1>
            <p>记忆 · 闪卡 · 测试，按熟悉度智能复习</p>
          </div>
          <div className="vocab-tier-tabs vocab-tier-tabs--header" role="tablist" aria-label="大组选择">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                role="tab"
                aria-selected={selectedTierId === tier.id}
                className={`mode-tab mode-tab--compact${selectedTierId === tier.id ? ' is-active' : ''}`}
                onClick={() => onTierChange(tier.id)}
              >
                {TIER_SHORT_LABEL[tier.id]}
              </button>
            ))}
            <button
              type="button"
              className="vocab-wordbook-entry"
              onClick={onOpenWordbook}
            >
              单词本{wordbookCount > 0 ? ` (${wordbookCount})` : ''}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main app-main-vocab-home">
        <div className="vocab-home-center">
        {error && <p className="vocab-inline-error">{error}</p>}

        {sceneThemes.length > 0 && (
          <div className="vocab-scene-filters" role="tablist" aria-label="场景筛选">
            <button
              type="button"
              role="tab"
              aria-selected={sceneFilter === '全部'}
              className={`vocab-scene-chip${sceneFilter === '全部' ? ' is-active' : ''}`}
              onClick={() => setSceneFilter('全部')}
            >
              全部
            </button>
            {sceneThemes.map((theme) => (
              <button
                key={theme}
                type="button"
                role="tab"
                aria-selected={sceneFilter === theme}
                className={`vocab-scene-chip${sceneFilter === theme ? ' is-active' : ''}`}
                onClick={() => setSceneFilter(theme)}
              >
                {theme}
              </button>
            ))}
          </div>
        )}

        <div className="vocab-group-grid vocab-group-grid--five">
          {groups.length === 0 && (
            <p className="vocab-status vocab-status--full">
              本大组暂无可用小组，请联系管理员在后台配置分组。
            </p>
          )}
          {filteredGroups.length === 0 && groups.length > 0 && (
            <p className="vocab-status vocab-status--full">该场景下暂无小组。</p>
          )}
          {filteredGroups.map((group) => {
            const unlocked = isGroupUnlocked(
              group.tierId,
              group.groupIndex,
              completedGroups,
              group.title,
            )
            const hasCover = hasGroupCover(group.tierId, group.groupIndex)

            return (
              <button
                key={group.id}
                type="button"
                className={`vocab-group-card vocab-group-card--compact${unlocked ? '' : ' is-locked'}`}
                disabled={!unlocked}
                onClick={() => onOpenGroup(group)}
              >
                <div className="vocab-group-card-media">
                  <GroupCoverImage
                    tierId={group.tierId}
                    groupIndex={group.groupIndex}
                    title={group.title}
                    className="vocab-group-cover"
                  />
                  {!hasCover && <div className="vocab-group-cover-placeholder" aria-hidden="true" />}
                  {!unlocked && <span className="vocab-group-lock-badge">🔒</span>}
                </div>
                <span className="vocab-group-card-title">{group.title}</span>
              </button>
            )
          })}
        </div>
        </div>
      </main>
    </div>
  )
}
