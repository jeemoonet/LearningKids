import { useEffect, useState } from 'react'
import type { VocabProgress, VocabWord } from './types'
import { EXAMPLE_SPEECH_RATE, speakEnglish, stopSpeaking } from './speak'
import { VocabTranslateButton } from './VocabTranslateButton'
import { getSpeakableWord, VocabWordHeadline } from './VocabWordHeadline'
import {
  getNounPlural,
  getRelatedRootWords,
  getThreeExamples,
} from './wordForms'

interface VocabFlashCardProps {
  word: VocabWord
  progress: VocabProgress
  index: number
  total: number
  inWordbook: boolean
  wordbookLoading: boolean
  onToggleWordbook: () => void
  onNext: () => void
  onPrev: () => void
}

function FlashcardExampleItem({
  example,
  index,
  onSpeak,
}: {
  example: { en: string; zh?: string }
  index: number
  onSpeak: (text: string) => void
}) {
  const [showZh, setShowZh] = useState(false)
  const en = example.en?.trim() ?? ''
  const zh = example.zh?.trim() ?? ''

  useEffect(() => {
    setShowZh(false)
  }, [en])

  return (
    <li>
      <div className="vocab-flashcard-example-row">
        <p className="vocab-flashcard-example-en">
          {example.en}
          {zh && (
            <VocabTranslateButton
              show={showZh}
              onToggle={() => setShowZh((value) => !value)}
              className="vocab-translate-button-inline"
            />
          )}
        </p>
        {en && (
          <button
            type="button"
            className="vocab-audio-button vocab-audio-button-inline vocab-audio-button-example"
            onClick={() => onSpeak(en)}
            aria-label={`播放例句 ${index + 1}`}
          >
            🔊
          </button>
        )}
      </div>
      {showZh && zh && <p className="vocab-card-example-zh">{example.zh}</p>}
    </li>
  )
}

export function VocabFlashCard({
  word,
  progress,
  index,
  total,
  inWordbook,
  wordbookLoading,
  onToggleWordbook,
  onNext,
  onPrev,
}: VocabFlashCardProps) {
  const speakWord = getSpeakableWord(word.word, word)
  const plural = word.pos === 'noun' ? getNounPlural(speakWord) : null
  const relatedWords = getRelatedRootWords(word)
  const examples = getThreeExamples(word)

  const firstExampleEn = examples[0]?.en?.trim() ?? ''

  useEffect(() => {
    const textToSpeak = firstExampleEn || speakWord
    const rate = firstExampleEn ? EXAMPLE_SPEECH_RATE : undefined
    const timer = window.setTimeout(() => speakEnglish(textToSpeak, rate), 300)
    return () => {
      window.clearTimeout(timer)
      stopSpeaking()
    }
  }, [word.id, firstExampleEn, speakWord])

  const handleReplay = () => speakEnglish(speakWord)
  const handleSpeakExample = (text: string) => speakEnglish(text, EXAMPLE_SPEECH_RATE)

  return (
    <div className="vocab-flashcard-detail">
      <div className="vocab-card-meta">
        <span className="vocab-card-badge">
          闪卡 {index + 1} / {total}
        </span>
        <div className="vocab-card-meta-actions">
          <button
            type="button"
            className={`vocab-wordbook-add${inWordbook ? ' is-added' : ''}`}
            onClick={onToggleWordbook}
            disabled={wordbookLoading}
            aria-pressed={inWordbook}
          >
            {inWordbook ? '已在单词本' : '加入单词本'}
          </button>
          <span className="vocab-card-pos">{word.posLabel}</span>
        </div>
      </div>

      <div className="vocab-flashcard-headline">
        <VocabWordHeadline rawWord={word.word} frequencySource={word} className="vocab-card-word" />
        <button type="button" className="vocab-audio-button vocab-audio-button-inline" onClick={handleReplay}>
          🔊
        </button>
      </div>

      <div className="vocab-flashcard-phonetic-row">
        <span className="vocab-card-phonetic">{word.phonetic || '暂无音标'}</span>
        <span className="vocab-flashcard-familiarity">熟悉度 {progress.familiarity}</span>
      </div>

      <p className="vocab-card-meaning">{word.meaningZh}</p>

      {plural && (
        <div className="vocab-flashcard-section">
          <span className="vocab-flashcard-section-title">名词复数</span>
          <p className="vocab-flashcard-plural">{plural}</p>
        </div>
      )}

      {relatedWords.length > 0 && (
        <div className="vocab-flashcard-section">
          <span className="vocab-flashcard-section-title">关联单词（同词根）</span>
          <p className="vocab-flashcard-related">{relatedWords.join(' · ')}</p>
        </div>
      )}

      <div className="vocab-flashcard-section">
        <span className="vocab-flashcard-section-title">例句</span>
        <ol className="vocab-flashcard-examples">
          {examples.map((example, i) => (
            <FlashcardExampleItem
              key={`${word.id}-${i}`}
              example={example}
              index={i}
              onSpeak={handleSpeakExample}
            />
          ))}
        </ol>
      </div>

      <div className="vocab-card-actions">
        <button type="button" className="vocab-flip-button" onClick={onPrev} disabled={index === 0}>
          上一张
        </button>
        <button type="button" className="vocab-next-button" onClick={onNext}>
          {index < total - 1 ? '下一张' : '完成'}
        </button>
      </div>
    </div>
  )
}
