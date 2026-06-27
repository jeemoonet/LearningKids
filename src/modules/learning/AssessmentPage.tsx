import { useEffect, useMemo, useState } from 'react'
import type { LearningNav } from './LearningModule'
import { learningApi, type ClozePayload, type SubmitResult } from './api'
import { buildClozeVariant, getClozeVariantCount } from '../vocab-training/clozeGenerator'

interface AssessmentPageProps {
  sectionId: string
  nav: LearningNav
  onPassed: () => Promise<void>
}

function importCloze() {
  return import('../vocab-training/VocabClozeCard')
}

export function AssessmentPage({ sectionId, nav, onPassed }: AssessmentPageProps) {
  const [payload, setPayload] = useState<ClozePayload | null>(null)
  const [variant, setVariant] = useState(0)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState('')
  const [ClozeCard, setClozeCard] =
    useState<null | typeof import('../vocab-training/VocabClozeCard').VocabClozeCard>(null)

  useEffect(() => {
    importCloze().then((m) => setClozeCard(() => m.VocabClozeCard))
  }, [])

  useEffect(() => {
    learningApi
      .sectionCloze(sectionId)
      .then(setPayload)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
  }, [sectionId])

  const variantCount = useMemo(() => {
    if (!payload) return 0
    return getClozeVariantCount(payload.words, {
      themePassageEn: payload.passageEn,
      themePassageZh: payload.passageZh,
    })
  }, [payload])

  const exercise = useMemo(() => {
    if (!payload) return null
    return buildClozeVariant(payload.words, {
      themePassageEn: payload.passageEn,
      themePassageZh: payload.passageZh,
      variantIndex: variant,
    })
  }, [payload, variant])

  const handleComplete = async (results: Array<{ wordKey: string; correct: boolean }>) => {
    const total = results.length
    const correct = results.filter((r) => r.correct).length
    try {
      const res = await learningApi.submitAssessment(sectionId, correct, total)
      setResult(res)
      if (res.passed) await onPassed()
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    }
  }

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <div className="learning-page-head-row">
          <button type="button" className="learning-back" onClick={() => nav.go('section', sectionId)}>
            ← 返回学习
          </button>
          <h1>小节测评 · 完形填空</h1>
        </div>
        <p>把单词拖入短文空白处，全部正确即可通过，本节单词将纳入我的单词库</p>
      </header>

      {error && <p className="learning-hint">{error}</p>}

      {result ? (
        <section className="learning-card learning-assess-result">
          {result.passed ? (
            <>
              <h2 className="learning-pass">🎉 测评通过！</h2>
              <p>本节 {result.addedToKnown} 个单词已纳入我的单词库。</p>
              {result.setCompleted ? (
                <p>恭喜！整个学习集已全部完成，可创建新的学习集。</p>
              ) : result.unlockedSectionId ? (
                <button
                  type="button"
                  className="learning-primary"
                  onClick={() => nav.go('section', result.unlockedSectionId!)}
                >
                  进入下一节
                </button>
              ) : null}
              <button type="button" className="learning-secondary" onClick={() => nav.go('plan')}>
                返回小节列表
              </button>
            </>
          ) : (
            <>
              <h2 className="learning-fail">还差一点</h2>
              <p>
                答对 {result.correct} / {result.total}，需要全部正确才能通过。
              </p>
              <button
                type="button"
                className="learning-primary"
                onClick={() => {
                  setResult(null)
                  setVariant((v) => v + 1)
                }}
              >
                再试一次
              </button>
              <button type="button" className="learning-secondary" onClick={() => nav.go('section', sectionId)}>
                回去继续练习
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="learning-card">
          {!payload || !ClozeCard ? (
            <p className="learning-status">生成测评中…</p>
          ) : exercise ? (
            <ClozeCard
              exercise={exercise}
              words={payload.words}
              variantCount={variantCount}
              onRefresh={() => setVariant((v) => v + 1)}
              onComplete={handleComplete}
            />
          ) : (
            <p className="learning-empty">
              本节暂时无法生成符合「白名单」约束的完形短文，请先在闪卡课件中多熟悉单词，或补充我的单词库。
            </p>
          )}
        </section>
      )}
    </div>
  )
}
