/** 播放小组场景短文音频（百炼 TTS，经服务端缓存） */

export type PassageSpeechRate = 'slow' | 'normal' | 'fast'

export const SPEECH_RATE_VALUES: Record<PassageSpeechRate, number> = {
  slow: 0.75,
  normal: 1,
  fast: 1.25,
}

const STORAGE_KEY = 'vocab-passage-speech-rate'

export function loadSpeechRatePreference(): PassageSpeechRate {
  if (typeof window === 'undefined') return 'normal'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'slow' || saved === 'normal' || saved === 'fast') return saved
  return 'normal'
}

export function saveSpeechRatePreference(rate: PassageSpeechRate): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, rate)
}

/** 浏览器 TTS 语速（与 playbackRate 档位对应） */
export function speechSynthesisRate(rate: PassageSpeechRate): number {
  if (rate === 'slow') return 0.7
  if (rate === 'fast') return 1.05
  return 0.88
}

let currentAudio: HTMLAudioElement | null = null
let currentObjectUrl: string | null = null

export function stopPassageAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
}

export function setPassagePlaybackRate(rate: PassageSpeechRate): void {
  if (currentAudio) {
    currentAudio.playbackRate = SPEECH_RATE_VALUES[rate]
  }
}

export function passageAudioUrl(tierId: string, groupIndex: number): string {
  return `/api/vocab/passage-audio?tierId=${encodeURIComponent(tierId)}&groupIndex=${groupIndex}`
}

/** 播放短文音频；失败时抛出 Error（含服务端错误信息） */
export async function playPassageAudio(
  tierId: string,
  groupIndex: number,
  rate: PassageSpeechRate = 'normal',
): Promise<void> {
  stopPassageAudio()

  const response = await fetch(passageAudioUrl(tierId, groupIndex), { credentials: 'include' })
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error ?? '短文语音生成失败')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  currentObjectUrl = objectUrl

  return new Promise((resolve, reject) => {
    const audio = new Audio(objectUrl)
    audio.playbackRate = SPEECH_RATE_VALUES[rate]
    currentAudio = audio

    audio.onended = () => {
      stopPassageAudio()
      resolve()
    }
    audio.onerror = () => {
      stopPassageAudio()
      reject(new Error('短文语音播放失败'))
    }

    void audio.play().catch((err: Error) => {
      stopPassageAudio()
      reject(err)
    })
  })
}

/** 拆分短文文本，标记组内单词所在区间（用于高亮） */
export function splitPassageByWords(
  text: string,
  words: string[],
): Array<{ text: string; highlight: boolean }> {
  if (!text || words.length === 0) return [{ text, highlight: false }]

  const pattern = new RegExp(
    `\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi',
  )

  const segments: Array<{ text: string; highlight: boolean }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), highlight: false })
    }
    segments.push({ text: match[0], highlight: true })
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false })
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }]
}
