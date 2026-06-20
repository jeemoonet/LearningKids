import { useEffect, useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { buildQuizOptions, fetchGroups, fetchTiers, fetchWordsByUserGroup } from './db'
import { importLocalProgressIfNeeded, saveTierGroups } from './progressApi'
import {
  applyQuizResult,
  groupProgressSummary,
  isGroupCompleted,
  isGroupUnlocked,
  loadCompletedGroups,
  loadProgressMap,
  markGroupCompleted,
  saveSingleProgress,
  ensureProgress,
  tierLabel,
} from './scheduler'
import type { VocabGroup, VocabProgress, VocabQuizOption, VocabTab, VocabTier, VocabTierId, VocabWord } from './types'
import { buildClozeVariant, getClozeVariantCount } from './clozeGenerator'
import { VocabClozeCard } from './VocabClozeCard'
import { VocabFlashCard } from './VocabFlashCard'
import { VocabGroupListPage } from './VocabGroupListPage'
import { VocabMemoryCard } from './VocabMemoryCard'
import { VocabQuizCard } from './VocabQuizCard'
import { VocabQuizResult } from './VocabQuizResult'
import { VocabTierInitPage } from './VocabTierInitPage'
import { VocabWordbookPage } from './VocabWordbookPage'
import { addToWordbook, fetchWordbookIds, removeFromWordbook } from './wordbookApi'

interface VocabTrainingModuleProps {
  onBack: () => void
}

export function VocabTrainingModule({ onBack }: VocabTrainingModuleProps) {
  const [tiers, setTiers] = useState<VocabTier[]>([])
  const [selectedTierId, setSelectedTierId] = useState<VocabTierId | null>(null)
  const [groups, setGroups] = useState<VocabGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<VocabGroup | null>(null)
  const [words, setWords] = useState<VocabWord[]>([])
  const [tab, setTab] = useState<VocabTab>('memory')
  const [cardIndex, setCardIndex] = useState(0)
  const [seenCount, setSeenCount] = useState(0)
  const [quizOptions, setQuizOptions] = useState<VocabQuizOption[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [progressMap, setProgressMap] = useState<Map<string, VocabProgress>>(() => new Map())
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(() => new Set())
  const [hasGameGroups, setHasGameGroups] = useState(false)
  const [initTier, setInitTier] = useState<VocabTier | null>(null)
  const [customSessionTitle, setCustomSessionTitle] = useState<string | null>(null)
  const [quizTierId, setQuizTierId] = useState<VocabTierId | null>(null)
  const [quizGroupIndex, setQuizGroupIndex] = useState(0)
  const [quizSessionStart, setQuizSessionStart] = useState<number | null>(null)
  const [quizSessionErrors, setQuizSessionErrors] = useState(0)
  const [quizElapsedSec, setQuizElapsedSec] = useState(0)
  const [quizSessionComplete, setQuizSessionComplete] = useState(false)
  const [clozeVariantIndex, setClozeVariantIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showWordbook, setShowWordbook] = useState(false)
  const [wordbookIds, setWordbookIds] = useState<Set<number>>(() => new Set())
  const [wordbookLoading, setWordbookLoading] = useState(false)

  const summary = useMemo(
    () => groupProgressSummary(words, progressMap),
    [words, progressMap],
  )

  const groupCompleted = useMemo(
    () => isGroupCompleted(words, progressMap),
    [words, progressMap],
  )

  const nextGroup = useMemo(() => {
    if (!selectedGroup) return null
    return (
      groups.find(
        (group) =>
          group.tierId === selectedGroup.tierId &&
          group.groupIndex === selectedGroup.groupIndex + 1,
      ) ?? null
    )
  }, [selectedGroup, groups])

  const clozeExercise = useMemo(() => {
    if (words.length === 0) return null
    return buildClozeVariant(words, {
      themePassageEn: selectedGroup?.passageEn,
      themePassageZh: selectedGroup?.passageZh,
      variantIndex: clozeVariantIndex,
    })
  }, [words, selectedGroup?.passageEn, selectedGroup?.passageZh, clozeVariantIndex])

  const clozeVariantCount = useMemo(
    () =>
      words.length === 0
        ? 0
        : getClozeVariantCount(words, {
            themePassageEn: selectedGroup?.passageEn,
            themePassageZh: selectedGroup?.passageZh,
          }),
    [words, selectedGroup?.passageEn, selectedGroup?.passageZh],
  )

  useEffect(() => {
    if (!selectedGroup || !groupCompleted) return
    void markGroupCompleted(selectedGroup.tierId, selectedGroup.groupIndex).then(() =>
      loadCompletedGroups().then(setCompletedGroups),
    )
  }, [selectedGroup, groupCompleted])

  useEffect(() => {
    Promise.all([importLocalProgressIfNeeded(), fetchTiers(), loadProgressMap(), loadCompletedGroups(), fetchWordbookIds()])
      .then(([, tierData, progress, completed, wordbookIdSet]) => {
        setProgressMap(progress)
        setCompletedGroups(completed)
        setWordbookIds(wordbookIdSet)
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
    fetchGroups(selectedTierId)
      .then(({ groups: groupData, hasGameGroups: gameGroupsEnabled }) => {
        setGroups(groupData)
        setHasGameGroups(gameGroupsEnabled)
      })
      .catch((err: Error) => setError(err.message))
  }, [selectedTierId])

  useEffect(() => {
    if ((tab !== 'quiz' && tab !== 'cloze') || quizSessionStart == null) return
    const tick = () => {
      setQuizElapsedSec(Math.floor((Date.now() - quizSessionStart) / 1000))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [tab, quizSessionStart])

  const resetSession = (groupWords: VocabWord[], tierId: VocabTierId, groupIndex: number) => {
    setWords(groupWords)
    setQuizTierId(tierId)
    setQuizGroupIndex(groupIndex)
    setCardIndex(0)
    setTab('memory')
    setQuizSessionStart(null)
    setQuizSessionErrors(0)
    setQuizElapsedSec(0)
    setQuizSessionComplete(false)
    setClozeVariantIndex(0)
  }

  const openGroup = async (group: VocabGroup) => {
    if (!isGroupUnlocked(group.tierId, group.groupIndex, completedGroups, group.title)) {
      setError('请先完成上一组：本组 80% 单词熟悉度需达到 4 级以上')
      return
    }

    setError('')
    setCustomSessionTitle(null)
    setSelectedGroup(group)
    const groupWords = await fetchWordsByUserGroup(group.tierId, group.groupIndex)
    resetSession(groupWords, group.tierId, group.groupIndex)
  }

  const openInitTier = (tier: VocabTier) => {
    setError('')
    setInitTier(tier)
  }

  const openCustomStudy = (studyWordList: VocabWord[], title: string) => {
    setError('')
    setInitTier(null)
    setSelectedGroup(null)
    setCustomSessionTitle(title)
    resetSession(studyWordList, studyWordList[0]?.tierId ?? 'beginner', 0)
  }

  const handleFinishInit = async (chunks: VocabWord[][]) => {
    if (!initTier) return
    const payload = chunks.map((chunk, index) => ({
      groupIndex: index + 1,
      wordIds: chunk.map((word) => word.id),
    }))
    await saveTierGroups(initTier.id, payload)
    const { groups: nextGroups, hasGameGroups: gameGroupsEnabled } = await fetchGroups(initTier.id)
    setGroups(nextGroups)
    setHasGameGroups(gameGroupsEnabled)
    setInitTier(null)
  }

  const handleInitProgressChange = (progress: VocabProgress) => {
    setProgressMap((current) => {
      const next = new Map(current)
      next.set(progress.word, progress)
      return next
    })
  }

  const persistProgress = (progress: VocabProgress) => {
    void saveSingleProgress(progress).catch((err: Error) => setError(err.message))
  }

  const currentWord = words[cardIndex]

  const updateProgress = (
    targetWord: VocabWord,
    updater: (progress: VocabProgress) => VocabProgress,
  ) => {
    let updated: VocabProgress | null = null
    setProgressMap((current) => {
      const next = new Map(current)
      const progress = ensureProgress(next, targetWord.word)
      updated = updater(progress)
      next.set(targetWord.word, updated)
      return next
    })
    if (updated) persistProgress(updated)
  }

  const goPrevCard = () => {
    setCardIndex((index) => Math.max(0, index - 1))
  }

  const goNextCard = () => {
    setCardIndex((index) => Math.min(words.length - 1, index + 1))
  }

  const handleTabChange = (nextTab: VocabTab) => {
    setCardIndex(0)
    setQuizSessionComplete(false)
    if (nextTab === 'quiz' || nextTab === 'cloze') {
      setQuizSessionStart(Date.now())
      setQuizSessionErrors(0)
      setQuizElapsedSec(0)
    }
    setTab(nextTab)
  }

  const handleQuizRetry = () => {
    setCardIndex(0)
    setQuizSessionComplete(false)
    setQuizSessionStart(Date.now())
    setQuizSessionErrors(0)
    setQuizElapsedSec(0)
  }

  const handleOpenNextGroup = () => {
    if (!nextGroup) {
      handleBackToGroups()
      return
    }
    void openGroup(nextGroup)
  }

  const currentWordId = currentWord?.id

  useEffect(() => {
    if (tab !== 'quiz' || !currentWordId) {
      setQuizLoading(false)
      return
    }

    const word = words.find((item) => item.id === currentWordId)
    if (!word || !quizTierId) {
      setQuizLoading(false)
      return
    }

    let cancelled = false
    setQuizLoading(true)
    setQuizOptions([])

    buildQuizOptions(word, quizTierId, quizGroupIndex)
      .then((options) => {
        if (!cancelled) {
          setQuizOptions(options)
          setQuizLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setQuizOptions([])
          setQuizLoading(false)
          setError(err.message)
        }
      })

    return () => {
      cancelled = true
    }
  }, [tab, currentWordId, words, quizTierId, quizGroupIndex])

  const handleQuizAnswer = (correct: boolean) => {
    if (!currentWord) return
    const isLastQuestion = cardIndex >= words.length - 1
    if (!correct) setQuizSessionErrors((count) => count + 1)
    updateProgress(currentWord, (progress) => applyQuizResult(progress, correct, seenCount))
    window.setTimeout(() => {
      setSeenCount((count) => count + 1)
      if (isLastQuestion) {
        setQuizSessionComplete(true)
      } else {
        setCardIndex((index) => index + 1)
      }
    }, 700)
  }

  const handleClozeComplete = (results: Array<{ wordKey: string; correct: boolean }>) => {
    const errorCount = results.filter((result) => !result.correct).length
    setQuizSessionErrors(errorCount)

    for (const result of results) {
      const targetWord = words.find((word) => word.word === result.wordKey)
      if (!targetWord) continue
      updateProgress(targetWord, (progress) => applyQuizResult(progress, result.correct, seenCount))
    }

    setSeenCount((count) => count + results.length)
    setQuizSessionComplete(true)
  }

  const handleClozeRefresh = () => {
    setClozeVariantIndex((index) => index + 1)
    setQuizSessionErrors(0)
    setQuizSessionComplete(false)
    setQuizSessionStart(Date.now())
    setQuizElapsedSec(0)
  }

  const handleBackToGroups = () => {
    setSelectedGroup(null)
    setCustomSessionTitle(null)
    setQuizTierId(null)
    setQuizGroupIndex(0)
    setWords([])
    setCardIndex(0)
    setTab('memory')
    setQuizSessionStart(null)
    setQuizSessionErrors(0)
    setQuizElapsedSec(0)
    setQuizSessionComplete(false)
    setClozeVariantIndex(0)
  }

  const handleBackFromInit = () => {
    setInitTier(null)
  }

  const handleOpenWordbook = () => {
    setShowWordbook(true)
  }

  const handleBackFromWordbook = () => {
    setShowWordbook(false)
    void fetchWordbookIds()
      .then(setWordbookIds)
      .catch((err: Error) => setError(err.message))
  }

  const handleToggleWordbook = async () => {
    if (!currentWord || wordbookLoading) return
    setWordbookLoading(true)
    try {
      if (wordbookIds.has(currentWord.id)) {
        await removeFromWordbook(currentWord.id)
        setWordbookIds((current) => {
          const next = new Set(current)
          next.delete(currentWord.id)
          return next
        })
      } else {
        await addToWordbook(currentWord.id)
        setWordbookIds((current) => new Set(current).add(currentWord.id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setWordbookLoading(false)
    }
  }

  if (showWordbook) {
    return <VocabWordbookPage onBack={handleBackFromWordbook} />
  }

  if (initTier) {
    return (
      <VocabTierInitPage
        tier={initTier}
        progressMap={progressMap}
        onBack={handleBackFromInit}
        onProgressChange={handleInitProgressChange}
        onStudyChunk={openCustomStudy}
        onFinishInit={handleFinishInit}
      />
    )
  }

  if (loading) {
    return (
      <div className="module module-vocab-training">
        <ModuleHeader title="单词记忆" description="加载词汇数据库..." onBack={onBack} />
        <main className="app-main">
          <p className="vocab-status">正在加载词汇库...</p>
        </main>
      </div>
    )
  }

  if (error && tiers.length === 0) {
    return (
      <div className="module module-vocab-training">
        <ModuleHeader title="单词记忆" description="词汇训练" onBack={onBack} />
        <main className="app-main">
          <p className="vocab-status vocab-status-error">{error}</p>
        </main>
      </div>
    )
  }

  if (!selectedGroup && !customSessionTitle) {
    return (
      <VocabGroupListPage
        tiers={tiers}
        selectedTierId={selectedTierId}
        onTierChange={setSelectedTierId}
        groups={groups}
        completedGroups={completedGroups}
        hasGameGroups={hasGameGroups}
        error={error}
        onBack={onBack}
        onOpenGroup={openGroup}
        onOpenInit={openInitTier}
        onOpenWordbook={handleOpenWordbook}
        wordbookCount={wordbookIds.size}
      />
    )
  }

  const currentProgress = currentWord ? ensureProgress(progressMap, currentWord.word) : null
  const sessionTierId = selectedGroup?.tierId ?? quizTierId ?? words[0]?.tierId ?? 'beginner'
  const sessionGroupIndex = selectedGroup?.groupIndex ?? quizGroupIndex

  const sessionTitle = selectedGroup?.title ?? customSessionTitle ?? ''
  const sessionDescription = selectedGroup
    ? `${tierLabel(selectedGroup.tierId)} · 完成度 ${summary.percent}%`
    : `待学分组 · 完成度 ${summary.percent}%`

  return (
    <div className="module module-vocab-training">
      <ModuleHeader
        title={sessionTitle}
        description={sessionDescription}
        onBack={handleBackToGroups}
      />

      <main className="app-main app-main-quiz">
        <div className="vocab-session-toolbar">
          <div className="mode-tabs" role="tablist" aria-label="学习模式">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'memory'}
              className={`mode-tab${tab === 'memory' ? ' is-active' : ''}`}
              onClick={() => handleTabChange('memory')}
            >
              记忆
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'flashcard'}
              className={`mode-tab${tab === 'flashcard' ? ' is-active' : ''}`}
              onClick={() => handleTabChange('flashcard')}
            >
              闪卡
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'quiz'}
              className={`mode-tab${tab === 'quiz' ? ' is-active' : ''}`}
              onClick={() => handleTabChange('quiz')}
            >
              测试
            </button>
            {clozeExercise && (
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'cloze'}
                className={`mode-tab${tab === 'cloze' ? ' is-active' : ''}`}
                onClick={() => handleTabChange('cloze')}
              >
                完形
              </button>
            )}
          </div>

          <div className="vocab-session-stats">
            <span>熟记 {summary.mastered}/{summary.total}</span>
            <span>目标：80% 达到熟悉度 ≥ 4</span>
            {groupCompleted && <span className="vocab-complete-tag">本组已通关</span>}
          </div>
        </div>

        {words.length === 0 && <p className="vocab-status">本组暂无单词。</p>}

        {words.length > 0 && tab === 'memory' && (
          <VocabMemoryCard
            words={words}
            tierId={sessionTierId}
            groupIndex={sessionGroupIndex}
            passageEn={selectedGroup?.passageEn}
            passageZh={selectedGroup?.passageZh}
          />
        )}

        {error && <p className="vocab-inline-error">{error}</p>}

        {currentWord && currentProgress && tab === 'flashcard' && (
          <VocabFlashCard
            word={currentWord}
            progress={currentProgress}
            index={cardIndex}
            total={words.length}
            inWordbook={wordbookIds.has(currentWord.id)}
            wordbookLoading={wordbookLoading}
            onToggleWordbook={() => void handleToggleWordbook()}
            onNext={goNextCard}
            onPrev={goPrevCard}
          />
        )}

        {tab === 'quiz' && words.length > 0 && !currentWord && (
          <p className="vocab-status">正在准备测验单词...</p>
        )}

        {tab === 'quiz' && currentWord && quizLoading && (
          <p className="vocab-status">正在加载题目...</p>
        )}

        {(tab === 'quiz' || tab === 'cloze') && quizSessionComplete && (
          <VocabQuizResult
            total={tab === 'cloze' ? (clozeExercise?.blanks.length ?? words.length) : words.length}
            sessionErrors={quizSessionErrors}
            sessionElapsedSec={quizElapsedSec}
            mastered={summary.mastered}
            groupCompleted={groupCompleted}
            nextGroupTitle={nextGroup?.title ?? null}
            onRetry={handleQuizRetry}
            onContinueFlashcard={() => handleTabChange('flashcard')}
            onOpenNextGroup={handleOpenNextGroup}
            onBackToGroups={handleBackToGroups}
          />
        )}

        {currentWord &&
          tab === 'quiz' &&
          !quizSessionComplete &&
          !quizLoading &&
          quizOptions.length >= 4 && (
            <VocabQuizCard
              key={currentWord.id}
              word={currentWord}
              options={quizOptions}
              index={cardIndex}
              total={words.length}
              onAnswer={handleQuizAnswer}
            />
          )}

        {tab === 'cloze' && !clozeExercise && (
          <p className="vocab-status">本组暂无可用短文，无法生成完形填空。</p>
        )}

        {tab === 'cloze' && clozeExercise && !quizSessionComplete && (
          <VocabClozeCard
            key={`${sessionTierId}-${sessionGroupIndex}-${clozeVariantIndex}`}
            exercise={clozeExercise}
            words={words}
            variantCount={clozeVariantCount}
            onRefresh={handleClozeRefresh}
            onComplete={handleClozeComplete}
          />
        )}
      </main>
    </div>
  )
}
