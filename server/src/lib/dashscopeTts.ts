import { loadDashscopeApiKey, loadDashscopeVoice } from './loadDashscopeApiKey.js'

const TTS_ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

interface DashscopeTtsResponse {
  status_code?: number
  code?: string
  message?: string
  output?: {
    audio?: {
      url?: string
      data?: string
    }
  }
}

/** 调用百炼 Qwen-TTS，返回 WAV 音频二进制 */
export async function synthesizeEnglish(text: string): Promise<Buffer> {
  const apiKey = loadDashscopeApiKey()
  const voice = loadDashscopeVoice()

  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen3-tts-flash',
      input: {
        text,
        voice,
        language_type: 'English',
      },
    }),
  })

  const payload = (await response.json()) as DashscopeTtsResponse
  if (!response.ok) {
    const detail = payload.message || payload.code || response.statusText
    throw new Error(`百炼 TTS 失败：${detail}`)
  }

  const audioUrl = payload.output?.audio?.url
  const audioData = payload.output?.audio?.data

  if (audioData) {
    return Buffer.from(audioData, 'base64')
  }

  if (!audioUrl) {
    throw new Error('百炼 TTS 未返回音频')
  }

  const audioResponse = await fetch(audioUrl)
  if (!audioResponse.ok) {
    throw new Error(`下载 TTS 音频失败：${audioResponse.statusText}`)
  }
  return Buffer.from(await audioResponse.arrayBuffer())
}
