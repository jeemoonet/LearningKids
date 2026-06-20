import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import {
  autoGroupTier,
  clearTierGroups,
  fetchAdminTierGroups,
  fetchTiersForAdmin,
  themeGroupTier,
  type AdminTierGroup,
} from './adminApi'
import type { VocabTier, VocabTierId } from '../modules/vocab-training/types'
import { getWordDisplay } from '../modules/vocab-training/wordFrequency'
import {
  BEGINNER_SCENE_ORDER,
  groupCoverUrl,
  hasGroupCover,
  parseGroupTheme,
} from '../modules/vocab-training/groupCover'
import { GroupCoverBadge, GroupCoverPreviewModal } from '../components/GroupCoverPreviewModal'
import { GroupCoverImage } from '../components/GroupCoverImage'
import { AdminGroupDetail } from './AdminGroupDetail'

type SceneFilter = 'all' | string

export function VocabGameSettings() {
  const [tiers, setTiers] = useState<VocabTier[]>([])
  const [selectedTierId, setSelectedTierId] = useState<VocabTierId | null>(null)
  const [groupSize, setGroupSize] = useState(6)
  const [groups, setGroups] = useState<AdminTierGroup[]>([])
  const [stats, setStats] = useState({ totalWords: 0, assignedWords: 0, unassignedWords: 0, groupCount: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScene, setSelectedScene] = useState<SceneFilter>('all')
  const [previewCover, setPreviewCover] = useState<{ title: string; url: string } | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<AdminTierGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedTier = tiers.find((tier) => tier.id === selectedTierId) ?? null

  const loadTierGroups = useCallback(async (tierId: VocabTierId) => {
    const data = await fetchAdminTierGroups(tierId)
    setGroups(data.groups)
    setStats(data.stats)
    setGroupSize(data.groupSize)
  }, [])

  useEffect(() => {
    fetchTiersForAdmin()
      .then((tierData) => {
        setTiers(tierData)
        if (tierData.length > 0) {
          setSelectedTierId(tierData[0].id)
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTierId) return
    setError('')
    setSelectedScene('all')
    setPreviewCover(null)
    setSelectedGroup(null)
    loadTierGroups(selectedTierId).catch((err: Error) => setError(err.message))
  }, [selectedTierId, loadTierGroups])

  const sceneNavItems = useMemo(() => {
    const counts = new Map<string, number>()
    for (const group of groups) {
      const theme = parseGroupTheme(group.title)
      counts.set(theme, (counts.get(theme) ?? 0) + 1)
    }

    const ordered =
      selectedTierId === 'beginner'
        ? BEGINNER_SCENE_ORDER.filter((theme) => counts.has(theme))
        : [...counts.keys()].sort((a, b) => a.localeCompare(b, 'zh-CN'))

    return ordered.map((theme) => ({
      id: theme,
      label: theme,
      count: counts.get(theme) ?? 0,
      coverCount: groups.filter(
        (group) =>
          parseGroupTheme(group.title) === theme &&
          selectedTierId &&
          hasGroupCover(selectedTierId, group.groupIndex),
      ).length,
    }))
  }, [groups, selectedTierId])

  const showSceneNav = sceneNavItems.length > 0 && groups.some((group) => group.title.includes('-'))

  const nextGroup = useMemo(() => {
    if (!selectedGroup) return null
    return groups.find((item) => item.groupIndex === selectedGroup.groupIndex + 1) ?? null
  }, [selectedGroup, groups])

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return groups.filter((group) => {
      if (selectedScene !== 'all' && parseGroupTheme(group.title) !== selectedScene) {
        return false
      }
      if (!query) return true
      return group.words.some((word) => {
        const { baseWord } = getWordDisplay(word.word)
        return (
          baseWord.toLowerCase().includes(query) ||
          word.meaningZh.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
        )
      })
    })
  }, [groups, searchQuery, selectedScene])

  const handleAutoGroup = async () => {
    if (!selectedTierId) return
    const confirmed = window.confirm(
      `将为「${selectedTier?.label ?? ''}」重新自动分组（每组 ${groupSize} 词），现有分组将被覆盖。继续吗？`,
    )
    if (!confirmed) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await autoGroupTier(selectedTierId, groupSize)
      await loadTierGroups(selectedTierId)
      setMessage(`已自动分组：共 ${result.groupCount} 个小组，分配 ${result.wordCount} 个单词`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '自动分组失败')
    } finally {
      setBusy(false)
    }
  }

  const handleThemeGroup = async () => {
    if (!selectedTierId || selectedTierId !== 'beginner') return
    const confirmed = window.confirm(
      '将按生活场景重新分组（每组最多 6 词，先名词后动词），现有分组将被覆盖。继续吗？',
    )
    if (!confirmed) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await themeGroupTier(selectedTierId)
      await loadTierGroups(selectedTierId)
      const summary = result.groups.map((group) => `${group.title} ${group.wordCount}词`).join(' · ')
      setMessage(`场景分组完成：${result.groupCount} 个小组，共 ${result.wordCount} 词。${summary}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '场景分组失败')
    } finally {
      setBusy(false)
    }
  }

  const handleClearGroups = async () => {
    if (!selectedTierId) return
    const confirmed = window.confirm('确定清空当前大组下的所有小组分组吗？')
    if (!confirmed) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      await clearTierGroups(selectedTierId)
      await loadTierGroups(selectedTierId)
      setMessage('已清空所有小组分组')
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空失败')
    } finally {
      setBusy(false)
    }
  }

  const handleCardClick = (group: AdminTierGroup) => {
    setSelectedGroup(group)
  }

  const handleCoverPreview = (event: MouseEvent, group: AdminTierGroup) => {
    event.stopPropagation()
    if (!selectedTierId) return
    const url = groupCoverUrl(selectedTierId, group.groupIndex)
    if (url) {
      setPreviewCover({ title: group.title, url })
    }
  }

  if (loading) {
    return <p className="admin-status">加载中...</p>
  }

  if (selectedGroup && selectedTier) {
    return (
      <>
        <AdminGroupDetail
          tier={selectedTier}
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onGroupChange={(updatedGroup) => {
            setSelectedGroup(updatedGroup)
            setGroups((prev) =>
              prev.map((item) => (item.groupIndex === updatedGroup.groupIndex ? updatedGroup : item)),
            )
          }}
          nextGroupTitle={nextGroup?.title ?? null}
          onOpenNextGroup={
            nextGroup
              ? () => {
                  setSelectedGroup(nextGroup)
                }
              : undefined
          }
          onPreviewCover={() => {
            if (!selectedTierId) return
            const url = groupCoverUrl(selectedTierId, selectedGroup.groupIndex)
            if (url) {
              setPreviewCover({ title: selectedGroup.title, url })
            }
          }}
        />
        <GroupCoverPreviewModal
          open={previewCover != null}
          title={previewCover?.title ?? ''}
          imageUrl={previewCover?.url ?? ''}
          onClose={() => setPreviewCover(null)}
        />
      </>
    )
  }

  return (
    <div className="admin-vocab-page">
      <header className="admin-page-hero admin-page-hero-split">
        <div>
          <h1>单词记忆</h1>
          <p>
            {selectedTier
              ? selectedTier.id === 'beginner'
                ? `${selectedTier.label} · 共 ${stats.totalWords} 词 · ${stats.groupCount} 个场景小组（或使用随机分组）`
                : `${selectedTier.label} · 共 ${stats.totalWords} 词 · 已分配 ${stats.assignedWords} 词 · ${stats.groupCount} 个小组`
              : '选择大组后进行场景分组或随机分组'}
          </p>
        </div>
        <div className="admin-page-actions">
          <label className="admin-inline-field">
            <span>每组</span>
            <select
              value={groupSize}
              onChange={(event) => setGroupSize(Number(event.target.value))}
              disabled={busy}
            >
              {[5, 6, 7, 8, 9, 10].map((size) => (
                <option key={size} value={size}>
                  {size} 词
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => void handleAutoGroup()}
            disabled={busy || !selectedTierId}
          >
            {busy ? '处理中...' : '+ 随机分组'}
          </button>
          {selectedTierId === 'beginner' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => void handleThemeGroup()}
              disabled={busy}
            >
              场景分组
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => void handleClearGroups()}
            disabled={busy || !selectedTierId || groups.length === 0}
          >
            清空分组
          </button>
        </div>
      </header>

      <div className="admin-tier-tabs" role="tablist" aria-label="大组选择">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            role="tab"
            aria-selected={selectedTierId === tier.id}
            className={`admin-tier-tab${selectedTierId === tier.id ? ' is-active' : ''}`}
            onClick={() => setSelectedTierId(tier.id)}
          >
            {tier.label}
            <span>{tier.wordCount}</span>
          </button>
        ))}
      </div>

      {stats.unassignedWords > 0 && (
        <p className="admin-alert admin-alert-warn">
          当前大组还有 {stats.unassignedWords} 个单词未分配到小组
        </p>
      )}
      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>小组列表</h2>
          <div className="admin-search">
            <input
              type="search"
              placeholder="搜索单词、释义或小组名"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="admin-empty-state">
            <strong>尚未创建小组</strong>
            <p>选择大组后点击「场景分组」（初级）或「随机分组」。</p>
          </div>
        ) : (
          <div className={`admin-group-layout${showSceneNav ? '' : ' admin-group-layout-single'}`}>
            {showSceneNav && (
              <nav className="admin-scene-nav" aria-label="场景导航">
                <button
                  type="button"
                  className={`admin-scene-nav-item${selectedScene === 'all' ? ' is-active' : ''}`}
                  onClick={() => setSelectedScene('all')}
                >
                  <span>全部</span>
                  <span className="admin-scene-nav-count">{groups.length}</span>
                </button>
                {sceneNavItems.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    className={`admin-scene-nav-item${selectedScene === scene.id ? ' is-active' : ''}`}
                    onClick={() => setSelectedScene(scene.id)}
                  >
                    <span>{scene.label}</span>
                    <span className="admin-scene-nav-meta">
                      <span className="admin-scene-nav-count">{scene.count}</span>
                      {scene.coverCount > 0 && (
                        <span className="admin-scene-nav-cover" title={`${scene.coverCount} 组已有配图`}>
                          图{scene.coverCount}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </nav>
            )}

            <div className="admin-group-main">
              {filteredGroups.length === 0 ? (
                <div className="admin-empty-state">
                  <strong>没有匹配的小组</strong>
                  <p>试试切换场景或更换搜索关键词。</p>
                </div>
              ) : (
                <div className="admin-group-grid">
                  {filteredGroups.map((group) => {
                    const coverAvailable =
                      selectedTierId != null && hasGroupCover(selectedTierId, group.groupIndex)
                    return (
                      <article
                        key={group.groupIndex}
                        className={`admin-group-card is-clickable${coverAvailable ? ' has-cover' : ''}`}
                        onClick={() => handleCardClick(group)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleCardClick(group)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        title="点击查看小组详情"
                      >
                        {coverAvailable && (
                          <button
                            type="button"
                            className="admin-group-cover-badge-btn"
                            onClick={(event) => handleCoverPreview(event, group)}
                            title="查看场景配图"
                            aria-label="查看场景配图"
                          >
                            <GroupCoverBadge />
                          </button>
                        )}
                        {coverAvailable ? (
                          <div className="admin-group-cover-wrap">
                            <GroupCoverImage
                              tierId={selectedTierId!}
                              groupIndex={group.groupIndex}
                              title={group.title}
                              className="admin-group-cover"
                            />
                            <header className="admin-group-card-header">
                              <strong>{group.title}</strong>
                            </header>
                          </div>
                        ) : (
                          <header className="admin-group-card-header">
                            <strong>{group.title}</strong>
                          </header>
                        )}
                        <ul className="admin-word-list">
                          {group.words.map((word) => {
                            const { baseWord } = getWordDisplay(word.word)
                            return (
                              <li key={word.id} className="admin-word-item">
                                {baseWord}
                              </li>
                            )
                          })}
                        </ul>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <GroupCoverPreviewModal
        open={previewCover != null}
        title={previewCover?.title ?? ''}
        imageUrl={previewCover?.url ?? ''}
        onClose={() => setPreviewCover(null)}
      />
    </div>
  )
}
