/** 例句朗读语速（偏慢，便于听清） */
export const EXAMPLE_SPEECH_RATE = 0.7

/** 使用浏览器语音合成播放英文单词/句子 */
export function speakEnglish(text: string, rate = 0.88): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

/** 依次朗读多个单词，返回取消函数 */
export function speakEnglishSequence(texts: string[], gapMs = 600, rate = 0.88): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis || texts.length === 0) {
    return () => {}
  }

  let cancelled = false
  let index = 0
  let gapTimer: number | undefined

  const clearGapTimer = () => {
    if (gapTimer != null) {
      window.clearTimeout(gapTimer)
      gapTimer = undefined
    }
  }

  const speakNext = () => {
    if (cancelled || index >= texts.length) return
    const text = texts[index]
    index += 1
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.onend = () => {
      if (cancelled) return
      gapTimer = window.setTimeout(speakNext, gapMs)
    }
    utterance.onerror = () => {
      if (cancelled) return
      gapTimer = window.setTimeout(speakNext, gapMs)
    }
    window.speechSynthesis.speak(utterance)
  }

  window.speechSynthesis.cancel()
  speakNext()

  return () => {
    cancelled = true
    clearGapTimer()
    window.speechSynthesis.cancel()
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
