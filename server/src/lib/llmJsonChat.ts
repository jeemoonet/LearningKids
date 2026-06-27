import { buildDeepSeekChatUrl, loadDeepSeekConfig } from './loadDeepSeekApiKey.js'
import { buildQwenChatUrl, loadQwenConfig } from './loadQwenApiKey.js'

type LlmProvider = 'qwen' | 'deepseek'

interface ProviderCall {
  name: LlmProvider
  label: string
  call: (prompt: string) => Promise<string>
}

/** 账户欠费、鉴权失败等：换下一个模型，不在同一模型上重试 */
export function isProviderUnavailableError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('access denied') ||
    lower.includes('arrearage') ||
    lower.includes('overdue-payment') ||
    lower.includes('overdue payment') ||
    lower.includes('authentication') ||
    lower.includes('invalid api key') ||
    lower.includes('invalid_request_error') ||
    lower.includes('insufficient') ||
    lower.includes('quota')
  )
}

/** 把常见英文 API 报错转为用户可读中文 */
export function toFriendlyLlmError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('arrearage') || lower.includes('overdue-payment')) {
    return '通义千问账户欠费或停用，已尝试切换 DeepSeek'
  }
  if (lower.includes('access denied')) {
    return '通义千问访问被拒绝（账户状态异常），已尝试切换 DeepSeek'
  }
  return message
}

async function callQwenRaw(prompt: string): Promise<string> {
  const qwen = loadQwenConfig()
  const response = await fetch(buildQwenChatUrl(qwen.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${qwen.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: qwen.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      response_format: { type: 'json_object' },
      enable_thinking: false,
    }),
  })

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Qwen API 请求失败 (${response.status})`)
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('Qwen API 未返回内容')
  return content
}

async function callDeepSeekRaw(prompt: string): Promise<string> {
  const deepseek = loadDeepSeekConfig()
  if (!deepseek) throw new Error('未配置 DeepSeek API Key')

  const response = await fetch(buildDeepSeekChatUrl(deepseek.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deepseek.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: deepseek.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  })

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `DeepSeek API 请求失败 (${response.status})`)
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek API 未返回内容')
  return content
}

function buildProviders(): ProviderCall[] {
  const list: ProviderCall[] = [
    { name: 'qwen', label: '通义千问', call: callQwenRaw },
  ]
  if (loadDeepSeekConfig()) {
    list.push({ name: 'deepseek', label: 'DeepSeek', call: callDeepSeekRaw })
  }
  return list
}

export function getLlmProviders(): Array<{
  name: LlmProvider
  label: string
  call: (prompt: string) => Promise<string>
}> {
  return buildProviders()
}

/**
 * 依次尝试 Qwen → DeepSeek 生成 JSON 文本（单次，无内容重试）。
 */
export async function callLlmJson(prompt: string): Promise<{ content: string; provider: LlmProvider }> {
  const providers = buildProviders()
  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      const content = await provider.call(prompt)
      return { content, provider: provider.name }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      lastError = err instanceof Error ? err : new Error(message)
      if (isProviderUnavailableError(message)) continue
      throw lastError
    }
  }

  throw lastError ?? new Error('所有 AI 提供商均不可用')
}
