import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const LEGACY_SERVERS_MD = 'd:\\Dev\\server\\Servers.md'

export function resolveServersMd(): string {
  const fromEnv = process.env.SERVERS_MD?.trim()
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv

  const fromHome = path.join(os.homedir(), 'DEV/server/Servers.md')
  if (fs.existsSync(fromHome)) return fromHome

  if (fs.existsSync(LEGACY_SERVERS_MD)) return LEGACY_SERVERS_MD

  throw new Error('找不到 Servers.md（可设置 SERVERS_MD 指向该文件）')
}

export function readServersMd(): string {
  return fs.readFileSync(resolveServersMd(), 'utf8')
}
