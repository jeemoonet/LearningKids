import fs from 'node:fs'

const DEFAULT_SERVERS_MD = 'd:\\Dev\\server\\Servers.md'

/** 从环境变量或 Servers.md 读取阿里云百炼 API Key */
export function loadDashscopeApiKey(): string {
  const fromEnv = process.env.DASHSCOPE_API_KEY?.trim()
  if (fromEnv) return fromEnv

  const serversMd = process.env.SERVERS_MD ?? DEFAULT_SERVERS_MD
  if (!fs.existsSync(serversMd)) {
    throw new Error('未设置 DASHSCOPE_API_KEY，且找不到 Servers.md')
  }

  const text = fs.readFileSync(serversMd, 'utf8')
  const section = text.match(/## 阿里云百炼[\s\S]*?(?=##|$)/)?.[0] ?? text
  const match = section.match(/API_KEY\s*=\s*(\S+)/i)
  if (!match) {
    throw new Error('在 Servers.md 中未找到阿里云百炼 API_KEY')
  }
  return match[1].trim()
}

/** 可选：TTS 音色（默认 Cherry，适合英文短文） */
export function loadDashscopeVoice(): string {
  return process.env.DASHSCOPE_TTS_VOICE?.trim() || 'Cherry'
}
