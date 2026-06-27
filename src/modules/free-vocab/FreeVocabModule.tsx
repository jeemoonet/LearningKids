import { useCallback, useEffect, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { AiWordPicker } from './AiWordPicker'
import { fetchFreeVocabProgress, fetchInitStatus, fetchPatterns } from './api'
import { InitCalibration } from './InitCalibration'
import { PatternSelect } from './PatternSelect'
import { ProgressPanel } from './ProgressPanel'
import type {
  FreeVocabInitStatus,
  FreeVocabProgress,
  FreeVocabView,
  PatternInfo,
  SentencePattern,
} from './types'
import { PATTERN_LABEL } from './types'

interface FreeVocabModuleProps {
  onBack: () => void
}

export function FreeVocabModule({ onBack }: FreeVocabModuleProps) {
  const [initStatus, setInitStatus] = useState<FreeVocabInitStatus | null>(null)
  const [progress, setProgress] = useState<FreeVocabProgress | null>(null)
  const [patterns, setPatterns] = useState<PatternInfo[]>([])
  const [view, setView] = useState<FreeVocabView>('home')
  const [selectedPattern, setSelectedPattern] = useState<SentencePattern | null>(null)
  const [loading, setLoading] = useState(true)
  const [patternsLoading, setPatternsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [init, prog] = await Promise.all([fetchInitStatus(), fetchFreeVocabProgress()])
      setInitStatus(init)
      setProgress(prog)
      if (!init.initialized) {
        setView('home')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const loadPatterns = useCallback(async () => {
    setPatternsLoading(true)
    try {
      const list = await fetchPatterns()
      setPatterns(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载句型失败')
    } finally {
      setPatternsLoading(false)
    }
  }, [])

  const handleInitComplete = useCallback(async (next: FreeVocabInitStatus) => {
    setInitStatus(next)
    try {
      const prog = await fetchFreeVocabProgress()
      setProgress(prog)
      setView('home')
    } catch {
      setView('home')
    }
  }, [])

  const openPatternSelect = async () => {
    setView('pattern')
    if (patterns.length === 0) {
      await loadPatterns()
    }
  }

  const handlePatternSelect = (pattern: SentencePattern) => {
    setSelectedPattern(pattern)
    setView('picker')
  }

  const handleBatchConfirmed = async () => {
    setSelectedPattern(null)
    setView('home')
    await loadAll()
  }

  return (
    <div className="module module-free-vocab">
      <ModuleHeader
        title="自由背单词"
        description="先建立 100 个基础词库，再按句型与 AI 自由选词学习"
        onBack={onBack}
      />

      <main className="app-main app-main-vocab-init">
        {loading && <p className="fv-status">加载中…</p>}
        {!loading && error && view === 'home' && (
          <p className="fv-status fv-status-error">{error}</p>
        )}

        {!loading && initStatus && !initStatus.initialized && (
          <InitCalibration onComplete={(next) => void handleInitComplete(next)} />
        )}

        {!loading && initStatus?.initialized && progress && view === 'home' && (
          <>
            <ProgressPanel progress={progress} />

            {progress.activeBatch ? (
              <section className="fv-init-complete">
                <h2>当前批次进行中</h2>
                <p>
                  句型：{PATTERN_LABEL[progress.activeBatch.pattern] ?? progress.activeBatch.pattern}
                </p>
                <p>
                  单词：{progress.activeBatch.words.map((item) => item.word).join('、')}
                </p>
                <p className="fv-init-complete-hint">
                  闪卡、造句与完形练习将在 M4 接入；你也可以重新选一批单词。
                </p>
                <div className="vocab-init-footer">
                  <button
                    type="button"
                    className="vocab-init-primary-button"
                    onClick={() => void openPatternSelect()}
                  >
                    重新选词
                  </button>
                </div>
              </section>
            ) : (
              <section className="fv-init-complete">
                <h2>开始新一批学习</h2>
                <p>选择句型后，AI 会从学习词库中挑选 5-10 个生词。</p>
                <div className="vocab-init-footer">
                  <button
                    type="button"
                    className="vocab-init-primary-button"
                    onClick={() => void openPatternSelect()}
                  >
                    选择句型
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {!loading && initStatus?.initialized && view === 'pattern' && (
          <PatternSelect
            patterns={patterns}
            loading={patternsLoading}
            onSelect={handlePatternSelect}
          />
        )}

        {!loading && initStatus?.initialized && view === 'picker' && selectedPattern && (
          <AiWordPicker
            pattern={selectedPattern}
            onBack={() => setView('pattern')}
            onConfirmed={() => void handleBatchConfirmed()}
          />
        )}
      </main>
    </div>
  )
}
