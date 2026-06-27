import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { MonsterSprite } from '../../conquer-planet/components/monsters/MonsterIllustrations'
import { POS_RACE } from '../../conquer-planet/types'
import { fetchBattlePassage } from '../api'
import { MonsterPosBadge } from '../components/battle/ElementBadge'
import { BattleSquadCloze } from '../components/preload/BattleSquadCloze'
import {
  buildBattlePassageExercise,
  buildExerciseFromAiPassage,
  type BattlePassageExercise,
} from '../domain/passage/battlePassage'
import { useSessionStore } from '../sessionStore'
import '../styles/word-hunter.css'

interface PreloadViewProps {
  onStart: () => void
  onRetreat?: () => void
  monsterId?: string
}

type PassageSource = 'idle' | 'loading' | 'ai' | 'fallback'

interface PassageHistoryItem {
  id: string
  round: number
  exercise: BattlePassageExercise
  source: 'ai' | 'fallback'
  providerLabel?: string
  error?: string
}

const PASSAGE_FETCH_MS = 20_000
const MAX_CLIENT_ATTEMPTS = 3

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('生成超时，请重试')), ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

export function PreloadView({ onStart, onRetreat, monsterId = 'mist-golem' }: PreloadViewProps) {
  const prepareBattle = useSessionStore((s) => s.prepareBattle)
  const prefill = useSessionStore((s) => s.prefill)
  const getWord = useSessionStore((s) => s.getWord)
  const wordBank = useSessionStore((s) => s.wordBank)
  const sectionId = useSessionStore((s) => s.sectionId)
  const level = useSessionStore((s) => s.getLevel())
  const [passageSource, setPassageSource] = useState<PassageSource>('idle')
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [history, setHistory] = useState<PassageHistoryItem[]>([])
  const [viewingId, setViewingId] = useState<string | null>(null)
  const fetchSeq = useRef(0)
  const roundCounter = useRef(0)
  const mountKey = useRef(String(Date.now()))

  const viewingItem = history.find((h) => h.id === viewingId) ?? history[history.length - 1] ?? null
  const exercise = viewingItem?.exercise ?? null

  useEffect(() => {
    prepareBattle()
  }, [prepareBattle])

  const squadWordKey = useMemo(() => {
    const recent = prefill?.recentIds?.join(',') ?? ''
    const recommended = prefill?.recommendedIds?.join(',') ?? ''
    return `${recent}|${recommended}`
  }, [prefill?.recentIds, prefill?.recommendedIds])

  const extraAllowedWords = useMemo(
    () => wordBank?.getAllEntries().map((w) => w.word.toLowerCase()) ?? [],
    [wordBank],
  )

  const loadPassage = useCallback(
    async (opts?: { keepHistory?: boolean }) => {
      if (!sectionId || squadWordKey === '|') return

      const recentWords = (prefill?.recentIds ?? [])
        .map((id) => getWord(id))
        .filter((w): w is NonNullable<typeof w> => Boolean(w))
      const recommendedWords = (prefill?.recommendedIds ?? [])
        .map((id) => getWord(id))
        .filter((w): w is NonNullable<typeof w> => Boolean(w))

      const seq = ++fetchSeq.current
      roundCounter.current += 1
      const round = roundCounter.current

      setPassageSource('loading')
      setCurrentAttempt(0)
      if (!opts?.keepHistory) {
        setHistory([])
        setViewingId(null)
      }

      const words = [
        ...recentWords.map((w) => ({
          word: w.word,
          meaning: w.meaning,
          pos: w.partOfSpeech,
          squad: 'recent' as const,
        })),
        ...recommendedWords.map((w) => ({
          word: w.word,
          meaning: w.meaning,
          pos: w.partOfSpeech,
          squad: 'recommended' as const,
        })),
      ]
      if (words.length === 0) {
        setPassageSource('idle')
        return
      }

      let retryHint: string | undefined
      let lastErr: Error | null = null

      for (let attempt = 1; attempt <= MAX_CLIENT_ATTEMPTS; attempt += 1) {
        if (seq !== fetchSeq.current) return
        setCurrentAttempt(attempt)

        try {
          const { passage, meta } = await withTimeout(
            fetchBattlePassage(sectionId, words, {
              extraAllowedWords,
              refreshKey: `${mountKey.current}-${round}-${attempt}-${Date.now()}`,
              singleAttempt: true,
              retryHint,
              attemptIndex: attempt,
            }),
            PASSAGE_FETCH_MS,
          )
          if (seq !== fetchSeq.current) return

          const built = buildExerciseFromAiPassage(
            passage.passageEn,
            passage.passageZh,
            passage.answers,
            recentWords,
            recommendedWords,
          )
          if (!built) throw new Error('AI 短文格式无法解析')

          const item: PassageHistoryItem = {
            id: `${round}-${attempt}-${Date.now()}`,
            round: 0,
            exercise: built,
            source: 'ai',
            providerLabel: meta?.providerLabel,
          }
          setHistory((prev) => {
            const nextItem = { ...item, round: prev.length + 1 }
            setViewingId(nextItem.id)
            return [...prev, nextItem]
          })
          setPassageSource('ai')
          setCurrentAttempt(0)
          return
        } catch (err) {
          lastErr = err instanceof Error ? err : new Error(String(err))
          retryHint = lastErr.message
        }
      }

      if (seq !== fetchSeq.current) return

      const fallback = buildBattlePassageExercise(recentWords, recommendedWords)
      if (fallback) {
        const item: PassageHistoryItem = {
          id: `${round}-fallback-${Date.now()}`,
          round: 0,
          exercise: fallback,
          source: 'fallback',
          error: lastErr?.message,
        }
        setHistory((prev) => {
          const nextItem = { ...item, round: prev.length + 1 }
          setViewingId(nextItem.id)
          return [...prev, nextItem]
        })
        setPassageSource('fallback')
      }
      setCurrentAttempt(0)
    },
    [sectionId, squadWordKey, prefill?.recentIds, prefill?.recommendedIds, getWord, extraAllowedWords],
  )

  useEffect(() => {
    void loadPassage()
  }, [loadPassage])

  if (!level || !prefill) {
    return <div className="wh-preload-stage wh-preload-stage--loading">加载战前数据…</div>
  }

  const monsterRace = POS_RACE[level.monsterPartOfSpeech]
  const isLoading = passageSource === 'loading' && currentAttempt > 0
  const isInitialLoading = passageSource === 'loading' && !exercise && currentAttempt > 0

  return (
    <div className="wh-preload-stage">
      {onRetreat && (
        <button type="button" className="wh-preload-retreat" onClick={onRetreat}>
          ← 撤退
        </button>
      )}

      <header
        className="wh-preload-monster"
        style={{ '--monster-color': monsterRace.color } as CSSProperties}
      >
        <div className="wh-preload-monster__aura" aria-hidden="true" />
        <div className="wh-preload-monster__sprite">
          <MonsterSprite id={monsterId} size={112} title={level.monsterName} />
        </div>
        <div className="wh-preload-monster__info">
          <p className="wh-preload-monster__level">{level.name}</p>
          <h1 className="wh-preload-monster__name">{level.monsterName}</h1>
          <MonsterPosBadge pos={level.monsterPartOfSpeech} />
          <p className="wh-preload-monster__hint">
            将下方战士填入短文列队，再发起进攻 · 无时间限制
          </p>
        </div>
      </header>

      <div className="wh-preload-main">
        {isInitialLoading ? (
          <div className="wh-preload-generating">
            <div className="wh-preload-generating__spinner" aria-hidden="true" />
            <p>AI 正在生成本节专属完形填空…</p>
            <p className="wh-preload-generating__hint">
              当前第 {currentAttempt} 遍（最多尝试 {MAX_CLIENT_ATTEMPTS} 遍）
            </p>
          </div>
        ) : exercise ? (
          <div className={`wh-preload-cloze-wrap${isLoading ? ' is-regenerating' : ''}`}>
            <BattleSquadCloze
              key={viewingId ?? 'cloze'}
              layout="battle-prep"
              exercise={exercise}
              onReadyChange={() => {}}
              onStart={onStart}
              startDisabled={isLoading}
            />
          </div>
        ) : (
          <p className="wh-error">暂无可用单词，无法生成战前短文。</p>
        )}
      </div>
    </div>
  )
}
