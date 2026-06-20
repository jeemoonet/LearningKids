import type { VocabTierId } from './types'
import { getWordDisplay } from './wordFrequency'
import coversManifest from '../../data/vocabGroupCovers.json'

/** 已启用配图的大组 */
export const GROUP_COVER_TIERS: VocabTierId[] = ['beginner']

export const GROUP_COVER_BASE = '/images/vocab-groups'

/** 管理后台卡片配图高度（px），见 App.css `.admin-group-cover` */
export const GROUP_COVER_ADMIN_HEIGHT = 64

/** 用户端小组卡片配图尺寸（宽×高 px），见 App.css `.vocab-group-card-media` */
export const GROUP_COVER_VOCAB_WIDTH = 250
export const GROUP_COVER_VOCAB_HEIGHT = 160

type CoverManifest = Partial<Record<VocabTierId, number[]>>

const manifest = coversManifest as CoverManifest

export function getGroupCoverIndices(tierId: VocabTierId): number[] {
  return manifest[tierId] ?? []
}

/** 初级组场景主题顺序（与场景分组一致） */
export const BEGINNER_SCENE_ORDER = [
  '学习',
  '家庭',
  '个人',
  '食物',
  '天气',
  '运动',
  '旅行',
  '节日',
  '介词',
  '时间',
  '其他',
] as const

export type BeginnerSceneTheme = (typeof BEGINNER_SCENE_ORDER)[number]

/**
 * 免顺序场景：该场景下各主题互不锁定，可直接学习（如介词辨析）。
 * 其余场景仍须按全局 groupIndex 顺序通关解锁。
 */
export const FREE_ACCESS_SCENE_THEMES: readonly string[] = ['介词', '时间']

export function isFreeAccessScene(theme: string): boolean {
  return FREE_ACCESS_SCENE_THEMES.includes(theme)
}

/** 从小组标题解析场景主题，如「学习1-教室」→「学习」 */
export function parseGroupTheme(title: string): string {
  const dash = title.indexOf('-')
  if (dash === -1) return title
  return title.slice(0, dash).replace(/\d+$/, '')
}

/** 从小组标题解析子场景，如「学习1-教室」→「教室」 */
export function parseGroupScene(title: string): string {
  const dash = title.indexOf('-')
  if (dash === -1) return title
  return title.slice(dash + 1)
}

/** 从小组列表提取场景主题（去重并按预设顺序排列） */
export function collectSceneThemes(groups: Array<{ title: string }>): string[] {
  const themes = new Set<string>()
  for (const group of groups) {
    themes.add(parseGroupTheme(group.title))
  }
  const ordered = BEGINNER_SCENE_ORDER.filter((theme) => themes.has(theme))
  const rest = [...themes]
    .filter((theme) => !BEGINNER_SCENE_ORDER.includes(theme as BeginnerSceneTheme))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return [...ordered, ...rest]
}

export function groupCoverAssetPath(tierId: VocabTierId, groupIndex: number): string {
  return `${GROUP_COVER_BASE}/${tierId}/${groupIndex}.png`
}

/** 该小组是否已有配图文件（见 src/data/vocabGroupCovers.json） */
export function hasGroupCover(tierId: VocabTierId | null, groupIndex: number): boolean {
  if (!tierId || !GROUP_COVER_TIERS.includes(tierId)) return false
  if (groupIndex < 1) return false
  return getGroupCoverIndices(tierId).includes(groupIndex)
}

export function groupCoverUrl(tierId: VocabTierId | null, groupIndex: number): string | null {
  if (!hasGroupCover(tierId, groupIndex)) return null
  return groupCoverAssetPath(tierId!, groupIndex)
}

/** 从小组数据提取用于配图的英文单词原形列表 */
export function groupCoverWords(rawWords: Array<{ word: string }>): string[] {
  return rawWords.map((item) => getWordDisplay(item.word).baseWord)
}
