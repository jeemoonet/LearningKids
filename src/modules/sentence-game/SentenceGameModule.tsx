import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSentenceLevels, fetchSentenceQuestions, fetchStructurePuzzles } from './api'
import { SentenceChallengeMode } from './SentenceChallengeMode'
import { ScholarMagicianMode } from './ScholarMagicianMode'
import { SentenceLevelSelect } from './SentenceLevelSelect'
import { SentenceStructureMode } from './SentenceStructureMode'
import type { SentenceLevel, SentenceQuestion, SentenceTrack, StructurePuzzle } from './types'

interface SentenceGameModuleProps {
  onBack?: () => void
  embedded?: boolean
  sectionKey?: 'warrior' | 'magic' | 'formation'
  title?: string
  description?: string
  tracks?: SentenceTrack[]
  showBoss?: boolean
}

type SentenceView = 'levels' | 'challenge'

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

  const handleStartBoss = () => {
    const boss = filteredLevels.find((level) => level.track === 'boss')
    if (boss) void openLevel(boss)
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
            {!loading && !error && (
              <SentenceLevelSelect
                levels={filteredLevels}
                onSelectLevel={(level) => void openLevel(level)}
                onStartBoss={handleStartBoss}
                showBoss={showBoss}
                layout={embedded ? 'topnav' : 'sidebar'}
              />
            )}
            {challengeLoading && <p className="sentence-status">正在生成题目…</p>}
          </main>
        </>
      )}

      {view === 'challenge' && activeLevel && isStructure && structurePuzzles.length > 0 && (
        <main className="app-main app-main-structure-pc">
          <SentenceStructureMode
            level={activeLevel}
            puzzles={structurePuzzles}
            ruleSummary={ruleSummary}
            onBack={handleBackToLevels}
            onComplete={handleBackToLevels}
            onRegeneratePuzzles={handleRegeneratePuzzles}
          />
        </main>
      )}

      {view === 'challenge' && activeLevel && isScholarMagician && (
        <main className="app-main app-main-sentence-challenge-pc">
          <ScholarMagicianMode
            level={activeLevel}
            ruleSummary={ruleSummary}
            onBack={handleBackToLevels}
            onComplete={handleBackToLevels}
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
            onBack={handleBackToLevels}
            onComplete={handleBackToLevels}
            onRegenerateQuestions={handleRegenerateQuestions}
          />
        </main>
      )}
    </div>
  )
}
