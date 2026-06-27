import { readServersMd } from './loadServersMd.js'

const DEFAULT_QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_QWEN_MODEL = 'qwen3.6-plus'

export interface QwenConfig {
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

function parseQwenSection(text: string): QwenConfig {
  const section = text.match(/##\s*Qwen[\s\S]*?(?=\n##\s|$)/i)?.[0]
  if (!section) {
    throw new Error('在 Servers.md 中未找到 Qwen 配置段')
  }

  // 支持 DashScope sk-{32hex} 与 MaaS 工作区 sk-ws-... 等格式
  const apiKey =
    section.match(/(?:API\s*KEY[：:\s]*|推荐模型[^\n]*\n)(sk-[^\s\n]+)/i)?.[1]?.trim() ??
    section.match(/^(sk-[^\s\n]+)/m)?.[1]?.trim() ??
    section.match(/(sk-[A-Za-z0-9._\-]+)/)?.[1]?.trim()

  if (!apiKey) {
    throw new Error('在 Servers.md 的 Qwen 段中未找到 API Key')
  }

  const modelMatch = section.match(/推荐模型[：:\s]*([^\n]+)/i)
  const model =
    process.env.QWEN_MODEL?.trim() || modelMatch?.[1]?.trim() || DEFAULT_QWEN_MODEL

  const baseMatch =
    section.match(/OpenAI\s*兼容地址[^\n]*\n\s*(https?:\/\/[^\s\n]+)/i) ??
    section.match(/baseUrl[：:\s]*([^\n]+)/i)
  const baseUrl = baseMatch
    ? extractUrl(baseMatch[1])
    : DEFAULT_QWEN_BASE_URL

  return { apiKey, baseUrl, model }
}

/** 从环境变量或 Servers.md（Qwen 段）读取 Qwen / DashScope 配置 */
export function loadQwenConfig(): QwenConfig {
  const fromEnv = process.env.QWEN_API_KEY?.trim() || process.env.DASHSCOPE_API_KEY?.trim()
  if (fromEnv) {
    return {
      apiKey: fromEnv,
      baseUrl: process.env.QWEN_BASE_URL?.trim() || DEFAULT_QWEN_BASE_URL,
      model: process.env.QWEN_MODEL?.trim() || DEFAULT_QWEN_MODEL,
    }
  }

  return parseQwenSection(readServersMd())
}

export function buildQwenChatUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '')
  return `${normalized}/chat/completions`
}
