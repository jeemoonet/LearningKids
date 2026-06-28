import { loadPrepProgress } from '../prep-game/progress'
import { loadSentenceProgress } from '../sentence-game/progress'
import { learningApi } from './api'

const MIGRATE_FLAG = 'learningkids:grammar-progress-migrated-v1'

/** 将 localStorage 中的训练营进度一次性迁入服务端 */
export async function migrateGrammarProgressOnce(): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATE_FLAG)) return

    const prepMap = loadPrepProgress()
    const sentenceMap = loadSentenceProgress()
    const entries: Array<{
      module: 'prep' | 'sentence'
      skillId: string
      bestScore: number
      totalQuestions: number
      passed: boolean
      lastPlayedAt?: number
    }> = []

    for (const [skillId, progress] of Object.entries(prepMap)) {
      if (!progress) continue
      entries.push({
        module: 'prep',
        skillId,
        bestScore: progress.bestScore,
        totalQuestions: progress.totalQuestions,
        passed: progress.passed,
        lastPlayedAt: progress.lastPlayedAt,
      })
    }

    for (const [skillId, progress] of Object.entries(sentenceMap)) {
      if (!progress) continue
      entries.push({
        module: 'sentence',
        skillId,
        bestScore: progress.bestScore,
        totalQuestions: progress.totalQuestions,
        passed: progress.passed,
        lastPlayedAt: progress.lastPlayedAt,
      })
    }

    if (entries.length === 0) {
      localStorage.setItem(MIGRATE_FLAG, String(Date.now()))
      return
    }

    await learningApi.migrateGrammarProgress({ entries })
    localStorage.setItem(MIGRATE_FLAG, String(Date.now()))
  } catch {
    // 下次登录重试
  }
}
