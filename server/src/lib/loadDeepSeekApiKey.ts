import { readServersMd } from './loadServersMd.js'

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash'

export interface DeepSeekConfig {
  apiKey: string
  baseUrl: string
  model: string
}

function extractUrl(raw: string): string {
  const markdownLink = raw.match(/\[(https?:\/\/[^\]]+)\]/)
  if (markdownLink) return markdownLink[1].trim()
  const plain = raw.match(/https?:\/\/\S+/)
  if (plain) return plain[0].replace(/[)\],.;]+$/, '')
  return raw.trim()
}

function parseDeepSeekSection(text: string): DeepSeekConfig {
  const section = text.match(/##\s*DeepSeek[\s\S]*?(?=\n##\s|$)/i)?.[0]
  if (!section) {
    throw new Error('在 Servers.md 中未找到 DeepSeek 配置段')
  }

  const apiKey = section.match(/sk-[0-9a-f]{32}/i)?.[0]?.trim()
  if (!apiKey) {
    throw new Error('在 Servers.md 的 DeepSeek 段中未找到 API Key')
  }

  const baseMatch = section.match(/baseUrl[：:\s]*([^\n]+)/i)
  const baseUrl = baseMatch ? extractUrl(baseMatch[1]) : DEFAULT_DEEPSEEK_BASE_URL

  const modelMatch = section.match(/推荐模型[：:\s]*([^\n]+)/i)
  const modelRaw = modelMatch?.[1]?.trim() ?? DEFAULT_DEEPSEEK_MODEL
  // Servers.md 里可能是 "deepseek-v4-flash/deepseek-v4-pro"，取 flash 作为默认
  const model =
    process.env.DEEPSEEK_MODEL?.trim() ||
    modelRaw.split('/')[0]?.replace(/\*\*/g, '').trim() ||
    DEFAULT_DEEPSEEK_MODEL

  return { apiKey, baseUrl, model }
}

/** 从环境变量或 Servers.md（DeepSeek 段）读取 DeepSeek 配置；未配置时返回 null */
export function loadDeepSeekConfig(): DeepSeekConfig | null {
  const fromEnv = process.env.DEEPSEEK_API_KEY?.trim()
  if (fromEnv) {
    return {
      apiKey: fromEnv,
      baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL,
    }
  }

  try {
    return parseDeepSeekSection(readServersMd())
  } catch {
    return null
  }
}

export function buildDeepSeekChatUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '')
  return `${normalized}/chat/completions`
}
