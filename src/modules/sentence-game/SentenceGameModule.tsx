import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSentenceLevels, fetchSentenceQuestions, fetchStructurePuzzles } from './api'
import { SentenceChallengeMode } from './SentenceChallengeMode'
import { ScholarMagicianMode } from './ScholarMagicianMode'
import { SentenceLevelSelect } from './SentenceLevelSelect'
import { SentenceStructureMode } from './SentenceStructureMode'
import { WarriorMagicianMatchMode } from './WarriorMagicianMatchMode'
import { FormationLevelDetailPage } from './FormationLevelDetailPage'
import { MagicLevelDetailPage } from './MagicLevelDetailPage'
import { MatchLevelDetailPage } from './MatchLevelDetailPage'
import { WarriorLevelDetailPage } from './WarriorLevelDetailPage'
import { FormationLevelSelect } from './FormationLevelSelect'
import { MagicLevelSelect } from './MagicLevelSelect'
import { WarriorLevelSelect } from './WarriorLevelSelect'
import type { SentenceLevel, SentenceQuestion, SentenceTrack, StructurePuzzle } from './types'

interface SentenceGameModuleProps {
  onBack?: () => void
  embedded?: boolean
  sectionKey?: 'warrior' | 'magic' | 'formation'
  title?: string
  description?: string
  tracks?: SentenceTrack[]
  showBoss?: boolean
  onViewChange?: (view: SentenceView) => void
}

type SentenceView = 'levels' | 'detail' | 'match-detail' | 'challenge' | 'warrior-match'

const WARRIOR_TRACKS: SentenceTrack[] = ['tense']
const MAGIC_TRACKS: SentenceTrack[] = ['adj-adv']
const FORMATION_TRACKS: SentenceTrack[] = ['structure']

export function SentenceGameModule({
  onBack,
  embedded = false,
  sectionKey,
  title = '句型侦探',
  description = '按主谓宾定状补学句子结构，掌握动词时态、状语与形副用法',
  tracks,
  showBoss = true,
  onViewChange,
}: SentenceGameModuleProps) {
  const [levels, setLevels] = useState<SentenceLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<SentenceView>('levels')
  const [activeLevel, setActiveLevel] = useState<SentenceLevel | null>(null)
  const [questions, setQuestions] = useState<SentenceQuestion[]>([])
  const [structurePuzzles, setStructurePuzzles] = useState<StructurePuzzle[]>([])
  const [ruleSummary, setRuleSummary] = useState('')
  const [isBoss, setIsBoss] = useState(false)
  const [isStructure, setIsStructure] = useState(false)
  const [isScholarMagician, setIsScholarMagician] = useState(false)
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [startingTest, setStartingTest] = useState(false)

  const trackFilter = useMemo(() => {
    if (tracks?.length) return tracks
    if (sectionKey === 'warrior') return WARRIOR_TRACKS
    if (sectionKey === 'magic') return MAGIC_TRACKS
    if (sectionKey === 'formation') return FORMATION_TRACKS
    return undefined
  }, [tracks, sectionKey])

  const filteredLevels = useMemo(() => {
    if (!trackFilter) return levels
    return levels.filter(
      (level) => level.track === 'boss' || trackFilter.includes(level.track),
    )
  }, [levels, trackFilter])

  const loadLevels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSentenceLevels()
      setLevels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载关卡失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(async (level: SentenceLevel, excludeKeys?: string[]) => {
    const data = await fetchSentenceQuestions(level.id, level.questionCount, excludeKeys)
    setQuestions(data.questions)
    setRuleSummary(data.ruleSummary)
    return data.questions
  }, [])

  const loadStructurePuzzles = useCallback(async (level: SentenceLevel) => {
    const data = await fetchStructurePuzzles(level.id, level.questionCount)
    setStructurePuzzles(data.puzzles)
    setRuleSummary(data.ruleSummary)
    return data.puzzles
  }, [])

  useEffect(() => {
    void loadLevels()
  }, [loadLevels])

  useEffect(() => {
    setView('levels')
    setActiveLevel(null)
    setQuestions([])
    setStructurePuzzles([])
    setRuleSummary('')
    setIsBoss(false)
    setIsStructure(false)
    setIsScholarMagician(false)
    setChallengeLoading(false)
    setStartingTest(false)
    setError('')
  }, [sectionKey])

  useEffect(() => {
    onViewChange?.(view)
  }, [view, onViewChange])

  const openDetail = (level: SentenceLevel) => {
    setActiveLevel(level)
    setQuestions([])
    setStructurePuzzles([])
    setIsBoss(level.track === 'boss')
    setIsStructure(false)
    setIsScholarMagician(false)
    setView('detail')
  }

  const openLevel = async (level: SentenceLevel) => {
    setChallengeLoading(true)
    setError('')
    try {
      const structureMode = level.track === 'structure' && level.id.startsWith('struct-')
      const scholarMagicianMode = level.track === 'adj-adv'
      if (structureMode) {
        await loadStructurePuzzles(level)
        setQuestions([])
      } else if (scholarMagicianMode) {
        setQuestions([])
        setStructurePuzzles([])
        setRuleSummary(level.ruleSummary)
      } else {
        await loadQuestions(level)
        setStructurePuzzles([])
      }
      setActiveLevel(level)
      setIsBoss(level.track === 'boss')
      setIsStructure(structureMode)
      setIsScholarMagician(scholarMagicianMode)
      setView('challenge')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成题目失败')
    } finally {
      setChallengeLoading(false)
    }
  }

  const startSectionTest = async () => {
    if (!activeLevel) return
    setStartingTest(true)
    setError('')
    try {
      const structureMode =
        activeLevel.track === 'structure' && activeLevel.id.startsWith('struct-')
      const scholarMagicianMode = activeLevel.track === 'adj-adv'
      const bossMode = activeLevel.track === 'boss'

      if (structureMode) {
        await loadStructurePuzzles(activeLevel)
        setQuestions([])
        setIsStructure(true)
        setIsScholarMagician(false)
        setIsBoss(false)
      } else if (scholarMagicianMode) {
        setQuestions([])
        setStructurePuzzles([])
        setRuleSummary(activeLevel.ruleSummary)
        setIsStructure(false)
        setIsScholarMagician(true)
        setIsBoss(false)
      } else if (bossMode) {
        await loadQuestions(activeLevel)
        setStructurePuzzles([])
        setIsStructure(false)
        setIsScholarMagician(false)
        setIsBoss(true)
      } else {
        await loadQuestions(activeLevel)
        setStructurePuzzles([])
        setIsStructure(false)
        setIsScholarMagician(false)
        setIsBoss(activeLevel.track === 'boss')
      }
      setView('challenge')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成题目失败')
    } finally {
      setStartingTest(false)
    }
  }

  const startWarriorTest = async () => {
    if (!activeLevel) return
    setStartingTest(true)
    setError('')
    try {
      const next = await loadQuestions(activeLevel)
      if (next.length === 0) {
        setError('暂无题目，请稍后再试')
        return
      }
      setStructurePuzzles([])
      setIsBoss(false)
      setIsStructure(false)
      setIsScholarMagician(false)
      setView('challenge')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成题目失败')
    } finally {
      setStartingTest(false)
    }
  }

  const handleStartBoss = () => {
    const boss = filteredLevels.find((level) => level.track === 'boss')
    if (boss) openDetail(boss)
  }

  const handleStartWarriorMatch = () => {
    setView('match-detail')
  }

  const handleStartMatchPlay = () => {
    setView('warrior-match')
  }

  const handleBackToLevels = () => {
    setView('levels')
    setActiveLevel(null)
    setQuestions([])
    setStructurePuzzles([])
    setIsStructure(false)
    setIsScholarMagician(false)
    void loadLevels()
  }

  const handleBackToDetail = () => {
    setView('detail')
    setQuestions([])
    setStructurePuzzles([])
    void loadLevels()
  }

  const handleBackToMatchDetail = () => {
    setView('match-detail')
  }

  const useDetailFlow = embedded && (sectionKey === 'warrior' || sectionKey === 'magic' || sectionKey === 'formation')
  const openLevelFromList = useDetailFlow ? openDetail : (level: SentenceLevel) => void openLevel(level)

  const handleRegenerateQuestions = useCallback(async (excludeKeys?: string[]) => {
    if (!activeLevel) return []
    const next = await loadQuestions(activeLevel, excludeKeys)
    return next
  }, [activeLevel, loadQuestions])

  const handleRegeneratePuzzles = useCallback(async () => {
    if (!activeLevel) return []
    const next = await loadStructurePuzzles(activeLevel)
    return next
  }, [activeLevel, loadStructurePuzzles])

  return (
    <div
      className={`module module-sentence-game is-sentence-pc${
        view === 'challenge' && isStructure ? ' is-structure-pc' : ''
      }${embedded ? ' is-sentence-embedded' : ''}`}
    >
      {view === 'levels' && (
        <>
          {!embedded && onBack && (
            <header className="sentence-pc-header">
              <button type="button" className="module-back-button" onClick={onBack}>
                ← 返回训练营
              </button>
              <div className="sentence-pc-header-text">
                <h1>{title}</h1>
                <p>{description}</p>
              </div>
            </header>
          )}

          <main className={`app-main app-main-sentence-pc${embedded ? ' app-main-sentence-embedded' : ''}`}>
            {loading && <p className="sentence-status">正在加载关卡…</p>}
            {error && <p className="sentence-status sentence-status-error">{error}</p>}
            {!loading && !error && sectionKey === 'warrior' && embedded ? (
              <WarriorLevelSelect
                levels={filteredLevels}
                onSelectLevel={openDetail}
                onStartWarriorMatch={handleStartWarriorMatch}
              />
            ) : !loading && !error && sectionKey === 'magic' && embedded ? (
              <MagicLevelSelect levels={filteredLevels} onSelectLevel={openDetail} />
            ) : !loading && !error && sectionKey === 'formation' && embedded ? (
              <FormationLevelSelect
                levels={filteredLevels}
                onSelectLevel={openDetail}
                showBoss={showBoss}
              />
            ) : !loading && !error ? (
              <SentenceLevelSelect
                levels={filteredLevels}
                onSelectLevel={openLevelFromList}
                onStartBoss={handleStartBoss}
                onStartWarriorMatch={sectionKey === 'warrior' ? handleStartWarriorMatch : undefined}
                showWarriorMatch={sectionKey === 'warrior'}
                showBoss={showBoss}
                layout={embedded ? 'topnav' : 'sidebar'}
              />
            ) : null}
            {challengeLoading && <p className="sentence-status">正在生成题目…</p>}
          </main>
        </>
      )}

      {view === 'detail' && activeLevel && sectionKey === 'warrior' && (
        <main className={`app-main app-main-sentence-pc${embedded ? ' app-main-sentence-embedded' : ''}`}>
          {error && <p className="sentence-status sentence-status-error">{error}</p>}
          <WarriorLevelDetailPage
            level={activeLevel}
            starting={startingTest}
            onBack={handleBackToLevels}
            onStartTest={() => void startWarriorTest()}
          />
        </main>
      )}

      {view === 'detail' && activeLevel && sectionKey === 'magic' && (
        <main className={`app-main app-main-sentence-pc${embedded ? ' app-main-sentence-embedded' : ''}`}>
          {error && <p className="sentence-status sentence-status-error">{error}</p>}
          <MagicLevelDetailPage
            level={activeLevel}
            starting={startingTest}
            onBack={handleBackToLevels}
            onStartTest={() => void startSectionTest()}
          />
        </main>
      )}

      {view === 'detail' && activeLevel && sectionKey === 'formation' && (
        <main className={`app-main app-main-sentence-pc${embedded ? ' app-main-sentence-embedded' : ''}`}>
          {error && <p className="sentence-status sentence-status-error">{error}</p>}
          <FormationLevelDetailPage
            level={activeLevel}
            starting={startingTest}
            onBack={handleBackToLevels}
            onStartTest={() => void startSectionTest()}
          />
        </main>
      )}

      {view === 'match-detail' && sectionKey === 'warrior' && (
        <main className={`app-main app-main-sentence-pc${embedded ? ' app-main-sentence-embedded' : ''}`}>
          <MatchLevelDetailPage
            onBack={handleBackToLevels}
            onStart={handleStartMatchPlay}
          />
        </main>
      )}

      {view === 'warrior-match' && (
        <main className="app-main app-main-sentence-challenge-pc">
          <WarriorMagicianMatchMode
            autoStart
            onBack={handleBackToMatchDetail}
            onComplete={handleBackToLevels}
          />
        </main>
      )}

      {view === 'challenge' && activeLevel && isStructure && structurePuzzles.length > 0 && (
        <main className="app-main app-main-structure-pc">
          <SentenceStructureMode
            level={activeLevel}
            puzzles={structurePuzzles}
            ruleSummary={ruleSummary}
            autoStart={useDetailFlow}
            onBack={useDetailFlow ? handleBackToDetail : handleBackToLevels}
            onComplete={useDetailFlow ? handleBackToDetail : handleBackToLevels}
            onRegeneratePuzzles={handleRegeneratePuzzles}
          />
        </main>
      )}

      {view === 'challenge' && activeLevel && isScholarMagician && (
        <main className="app-main app-main-sentence-challenge-pc">
          <ScholarMagicianMode
            level={activeLevel}
            ruleSummary={ruleSummary}
            autoStart={useDetailFlow}
            onBack={useDetailFlow ? handleBackToDetail : handleBackToLevels}
            onComplete={useDetailFlow ? handleBackToDetail : handleBackToLevels}
          />
        </main>
      )}

      {view === 'challenge' && activeLevel && !isStructure && !isScholarMagician && questions.length > 0 && (
        <main className="app-main app-main-sentence-challenge-pc">
          <SentenceChallengeMode
            level={activeLevel}
            questions={questions}
            ruleSummary={ruleSummary}
            isBoss={isBoss}
            autoStart={sectionKey === 'warrior' || (useDetailFlow && sectionKey === 'formation' && isBoss)}
            onBack={
              sectionKey === 'warrior' || (useDetailFlow && sectionKey === 'formation')
                ? handleBackToDetail
                : handleBackToLevels
            }
            onComplete={
              sectionKey === 'warrior' || (useDetailFlow && sectionKey === 'formation')
                ? handleBackToDetail
                : handleBackToLevels
            }
            onRegenerateQuestions={handleRegenerateQuestions}
          />
        </main>
      )}
    </div>
  )
}
