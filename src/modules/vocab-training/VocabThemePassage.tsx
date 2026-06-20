import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VocabTierId } from './types'
import { speakEnglishSequence, stopSpeaking } from './speak'
import { VocabTranslateButton } from './VocabTranslateButton'
import {
  loadSpeechRatePreference,
  playPassageAudio,
  saveSpeechRatePreference,
  setPassagePlaybackRate,
  speechSynthesisRate,
  splitPassageByWords,
  stopPassageAudio,
  type PassageSpeechRate,
} from './passageAudio'

const SPEECH_RATE_OPTIONS: Array<{ id: PassageSpeechRate; label: string }> = [
  { id: 'slow', label: '慢' },
  { id: 'normal', label: '正常' },
  { id: 'fast', label: '快' },
]

interface VocabThemePassageProps {
  tierId: VocabTierId
  groupIndex: number
  passageEn?: string
  passageZh?: string
  highlightWords: string[]
  fallbackWords?: string[]
  autoPlay?: boolean
  compact?: boolean
}

function PassageText({
  text,
  words,
  hasZh,
  showZh,
  onToggleZh,
}: {
  text: string
  words: string[]
  hasZh: boolean
  showZh: boolean
  onToggleZh: () => void
}) {
  const segments = useMemo(() => splitPassageByWords(text, words), [text, words])
  return (
    <p className="vocab-passage-en">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark key={i} className="vocab-passage-highlight">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
      {hasZh && <VocabTranslateButton show={showZh} onToggle={onToggleZh} className="vocab-translate-button-inline" />}
    </p>
  )
}

export function VocabThemePassage({
  tierId,
  groupIndex,
  passageEn = '',
  passageZh = '',
  highlightWords,
  fallbackWords = [],
  autoPlay = true,
  compact = false,
}: VocabThemePassageProps) {
  const hasPassage = passageEn.trim().length > 0
  const [speechRate, setSpeechRate] = useState<PassageSpeechRate>(loadSpeechRatePreference)
  const speechRateRef = useRef(speechRate)
  speechRateRef.current = speechRate

  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [audioError, setAudioError] = useState('')
  const [showZh, setShowZh] = useState(false)
  const hasZh = passageZh.trim().length > 0

  useEffect(() => {
    setShowZh(false)
  }, [tierId, groupIndex, passageEn])

  const playWordsFallback = useCallback(() => {
    stopPassageAudio()
    stopSpeaking()
    if (fallbackWords.length === 0) return
    speakEnglishSequence(fallbackWords, 600, speechSynthesisRate(speechRateRef.current))
  }, [fallbackWords])

  const playPassage = useCallback(async () => {
    if (!hasPassage) {
      playWordsFallback()
      return
    }
    stopSpeaking()
    stopPassageAudio()
    setAudioState('loading')
    setAudioError('')
    try {
      await playPassageAudio(tierId, groupIndex, speechRateRef.current)
      setAudioState('idle')
    } catch (err) {
      setAudioState('error')
      setAudioError(err instanceof Error ? err.message : '语音播放失败')
    }
  }, [hasPassage, tierId, groupIndex, playWordsFallback])

  useEffect(() => {
    if (!autoPlay) return
    const timer = window.setTimeout(() => {
      void playPassage()
    }, 400)
    return () => {
      window.clearTimeout(timer)
      stopPassageAudio()
      stopSpeaking()
    }
  }, [autoPlay, playPassage, tierId, groupIndex])

  const handleRateChange = (rate: PassageSpeechRate) => {
    setSpeechRate(rate)
    saveSpeechRatePreference(rate)
    setPassagePlaybackRate(rate)
  }

  if (!hasPassage && fallbackWords.length === 0) return null

  const audioLabel =
    audioState === 'loading'
      ? '正在生成语音…'
      : audioState === 'error'
        ? '重新播放'
        : hasPassage
          ? '🔊 播放短文'
          : '🔊 播放发音'

  return (
    <div className={`vocab-theme-passage${compact ? ' vocab-theme-passage--compact' : ''}`}>
      <div className="vocab-theme-passage-head">
        <span className="vocab-theme-passage-title">主题短文</span>
        {!compact && (
          <div className="vocab-speech-rate" role="group" aria-label="语速">
            {SPEECH_RATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`vocab-speech-rate-chip${speechRate === option.id ? ' is-active' : ''}`}
                aria-pressed={speechRate === option.id}
                onClick={() => handleRateChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasPassage && (
        <div className="vocab-passage-block">
          <PassageText
            text={passageEn}
            words={highlightWords}
            hasZh={hasZh}
            showZh={showZh}
            onToggleZh={() => setShowZh((value) => !value)}
          />
          {showZh && hasZh && <p className="vocab-passage-zh">{passageZh}</p>}
        </div>
      )}

      <button
        type="button"
        className={`vocab-memory-audio-bar${audioState === 'loading' ? ' is-loading' : ''}`}
        onClick={() => void playPassage()}
        disabled={audioState === 'loading'}
        aria-label={hasPassage ? '播放主题短文' : '播放本组单词发音'}
      >
        {audioLabel}
      </button>

      {audioError && <p className="vocab-passage-audio-error">{audioError}</p>}
    </div>
  )
}
