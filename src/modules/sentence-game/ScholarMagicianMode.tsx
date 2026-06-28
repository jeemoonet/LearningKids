import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { SentenceLevel } from './types'
import { recordSentenceResult } from './progress'
import {
  buildScholarMagicianSession,
  patternLabel,
  type ScholarMagicianPair,
  type ScholarMagicianRole,
} from './data/scholarMagicianPairs'

type Phase = 'ready' | 'study' | 'quiz' | 'done'

type GuessMap = Record<string, ScholarMagicianRole | null>

interface ScholarMagicianModeProps {
  level: SentenceLevel
  ruleSummary: string
  autoStart?: boolean
  onBack: () => void
  onComplete: () => void
}

function roleBadgeClass(role: string): string {
  if (role === 'scholar') return 'sm-pair-badge sm-pair-badge--scholar'
  if (role === 'magician') return 'sm-pair-badge sm-pair-badge--magician'
  if (role === 'noun') return 'sm-pair-badge sm-pair-badge--noun'
  return 'sm-pair-badge sm-pair-badge--verb'
}

function targetWordIndex(pair: ScholarMagicianPair): 0 | 1 {
  return pair.pattern === 'adj-noun' ? 0 : 1
}

function initGuesses(pairs: ScholarMagicianPair[]): GuessMap {
  const map: GuessMap = {}
  for (const pair of pairs) {
    map[pair.id] = null
  }
  return map
}

export function ScholarMagicianMode({
  level,
  ruleSummary,
  autoStart = false,
  onBack,
  onComplete,
}: ScholarMagicianModeProps) {
  void ruleSummary
  const [phase, setPhase] = useState<Phase>('ready')
  const [pairs, setPairs] = useState<ScholarMagicianPair[]>([])
  const [guesses, setGuesses] = useState<GuessMap>({})
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const roundCount = pairs.length

  const scoreTargets = useMemo(() => {
    return pairs.map((pair) => {
      const idx = targetWordIndex(pair)
      const word = pair.words[idx]
      return {
        pairId: pair.id,
        wordIndex: idx,
        answer: word.role as ScholarMagicianRole,
      }
    })
  }, [pairs])

  const startSession = useCallback((excludeIds: string[] = []) => {
    const next = buildScholarMagicianSession(level.id, level.questionCount, excludeIds)
    setPairs(next)
    setGuesses(initGuesses(next))
    setChecked(false)
    setCorrectCount(0)
    setPhase('study')
  }, [level.id, level.questionCount])

  const autoStartedRef = useRef(false)
  useLayoutEffect(() => {
    if (!autoStart || autoStartedRef.current) return
    autoStartedRef.current = true
    startSession()
  }, [autoStart, startSession])

  const handleStartQuiz = () => {
    setGuesses(initGuesses(pairs))
    setChecked(false)
    setCorrectCount(0)
    setPhase('quiz')
  }

  const handlePick = (pairId: string, role: ScholarMagicianRole) => {
    if (checked || phase !== 'quiz') return
    setGuesses((prev) => ({ ...prev, [pairId]: role }))
  }

  const handleCheck = () => {
    if (checked) return
    const allFilled = scoreTargets.every((item) => guesses[item.pairId] != null)
    if (!allFilled) return

    let correct = 0
    for (const item of scoreTargets) {
      if (guesses[item.pairId] === item.answer) correct += 1
    }
    setCorrectCount(correct)
    setChecked(true)

    if (correct >= roundCount) {
      recordSentenceResult(level.id, correct, roundCount)
    }
  }

  const handleRetryRound = () => {
    const excludeIds = pairs.map((item) => item.id)
    startSession(excludeIds)
  }

  const passed = checked && correctCount >= roundCount

  return (
    <section className="sentence-challenge sentence-challenge-pc sm-pair-mode">
      <div className="sentence-challenge-playhead">
        <button type="button" className="prep-spirit-detail-back-link" onClick={onBack}>
          {autoStart ? '← 返回介绍' : '← 返回关卡'}
        </button>
      </div>

      {!autoStart && phase === 'ready' && (
        <div className="sentence-challenge-intro">
          <h2>{level.title}</h2>
          <p>每页 {level.questionCount} 组词对：学者+名词、动词+魔法师。先看标注，再辨认关键词。</p>
          <ul className="sentence-challenge-rules">
            <li>学者（形容词）修饰名词：beautiful day</li>
            <li>魔法师（副词）修饰动词：run quickly</li>
            <li>先看学习卡上的标注，再进行辨认练习</li>
          </ul>
          <div className="sentence-challenge-intro-actions">
            <button type="button" className="sentence-challenge-start-button" onClick={() => startSession()}>
              开始学习
            </button>
          </div>
        </div>
      )}

      {(phase === 'study' || phase === 'quiz') && pairs.length > 0 && (
        <div className="sentence-challenge-board sm-pair-board">
          {phase === 'quiz' && checked && (
            <div className="sentence-challenge-hud">
              <div className="sentence-challenge-stat">
                <span className="sentence-challenge-stat-label">正确</span>
                <span className="sentence-challenge-stat-value">{correctCount}/{roundCount}</span>
              </div>
            </div>
          )}

          <p className="sm-pair-hint">
            {phase === 'study'
              ? '阅读每组词对，记住哪个词是学者、哪个词是魔法师。'
              : checked
                ? passed
                  ? '全部辨认正确！学者修饰名词，魔法师修饰动词。'
                  : '再看看标注，学者对应形容词，魔法师对应副词。'
                : '点击选择每组中「学者 / 魔法师」词的正确身份。'}
          </p>

          <div className="sm-pair-grid">
            {pairs.map((pair) => {
              const targetIdx = targetWordIndex(pair)
              const target = pair.words[targetIdx]
              const guess = guesses[pair.id]
              const isCorrect = checked && guess === target.role
              const isWrong = checked && guess != null && guess !== target.role

              return (
                <article
                  key={pair.id}
                  className={`sm-pair-card${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
                >
                  <span className="sm-pair-card-type">{patternLabel(pair.pattern)}</span>
                  <div className="sm-pair-card-words">
                    {pair.words.map((word, index) => {
                      const isTarget = index === targetIdx
                      const showFullLabel = phase === 'study' || checked
                      const showPartnerLabel =
                        phase === 'quiz' && !isTarget && !checked && (word.role === 'noun' || word.role === 'verb')

                      if (phase === 'quiz' && isTarget && !checked) {
                        return (
                          <div key={`${pair.id}-${word.text}`} className="sm-pair-word sm-pair-word--target">
                            <span className="sm-pair-word-text">{word.text}</span>
                            <div className="sm-pair-guess-row">
                              <button
                                type="button"
                                className={`sm-pair-guess-btn${guess === 'scholar' ? ' is-selected' : ''}`}
                                onClick={() => handlePick(pair.id, 'scholar')}
                              >
                                学者
                              </button>
                              <button
                                type="button"
                                className={`sm-pair-guess-btn sm-pair-guess-btn--magician${guess === 'magician' ? ' is-selected' : ''}`}
                                onClick={() => handlePick(pair.id, 'magician')}
                              >
                                魔法师
                              </button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={`${pair.id}-${word.text}`}
                          className={`sm-pair-word${isTarget ? ' sm-pair-word--target' : ''}`}
                        >
                          <span className="sm-pair-word-text">{word.text}</span>
                          {(showFullLabel || showPartnerLabel) && (
                            <span className={roleBadgeClass(word.role)}>{word.roleLabel}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="sm-pair-card-zh">{pair.phraseZh}</p>
                </article>
              )
            })}
          </div>

          <div className="sm-pair-actions">
            {phase === 'study' && (
              <button type="button" className="sentence-challenge-start-button" onClick={handleStartQuiz}>
                开始辨认
              </button>
            )}
            {phase === 'quiz' && !checked && (
              <button
                type="button"
                className="sentence-challenge-start-button"
                onClick={handleCheck}
                disabled={scoreTargets.some((item) => guesses[item.pairId] == null)}
              >
                核对答案
              </button>
            )}
            {phase === 'quiz' && checked && (
              <>
                <button type="button" className="sentence-challenge-start-button" onClick={handleRetryRound}>
                  {passed ? '再练一轮' : '换一批词组'}
                </button>
                {passed && (
                  <button type="button" className="sentence-challenge-secondary-button" onClick={onComplete}>
                    返回关卡列表
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="sentence-challenge-result">
          <p className="sentence-challenge-result-label">恭喜通关！</p>
          <div className="sentence-challenge-result-actions">
            <button type="button" className="sentence-challenge-start-button" onClick={handleRetryRound}>
              再练一轮
            </button>
            <button type="button" className="sentence-challenge-secondary-button" onClick={onComplete}>
              返回关卡列表
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
