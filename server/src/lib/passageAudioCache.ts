import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { synthesizeEnglish } from './dashscopeTts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.resolve(__dirname, '../../data/tts-cache')

export function passageCachePath(tierId: string, groupIndex: number): string {
  return path.join(CACHE_DIR, `${tierId}-${groupIndex}.wav`)
}

/** 获取或生成小组短文音频，返回本地缓存路径 */
export async function getOrCreatePassageAudio(
  tierId: string,
  groupIndex: number,
  text: string,
): Promise<string> {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const cachePath = passageCachePath(tierId, groupIndex)

  if (fs.existsSync(cachePath)) {
    return cachePath
  }

  const audio = await synthesizeEnglish(text)
  fs.writeFileSync(cachePath, audio)
  return cachePath
}

/** 清除指定小组缓存（短文更新后调用） */
export function clearPassageAudioCache(tierId: string, groupIndex: number): void {
  const cachePath = passageCachePath(tierId, groupIndex)
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath)
  }
}
