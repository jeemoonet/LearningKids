import {
  completeBossLevel,
  completeRecruitLevel,
  completeReviewLevel,
  submitPlanetReview,
} from '../api'
import { collectCorrectWords, collectWrongWords } from './selectGames'
import type { PlanetLevelKind, PlanetSession } from '../types'
import type { GameResult } from './types'

/**
 * 结算类型：与关卡 kind 同构（招募 / 复习 / BOSS）。
 * 与「游戏环节（玩法）」正交——任意游戏都可挂在任意结算类型下。
 */
export type SettlementKind = PlanetLevelKind

export interface SettlementOutcome {
  kind: SettlementKind
  /** 结算后的最新军团 session */
  session: PlanetSession
  /** 给玩家看的一句话总结 */
  summary: string
  /** 招募：本次入团的词 */
  recruited?: string[]
  /** 复习：留下 / 叛逃 */
  reviewed?: { kept: string[]; deserted: string[] }
}

/**
 * 关卡结算：游戏环节与结算解耦的落点。
 *
 * 游戏只产出 GameResult[]，本函数按结算类型决定如何处理：
 * - recruit：答对的词加入「我的军团」
 * - review：逐词调整熟悉度（答对 +、答错 -，归零则叛逃）
 * - boss：标记关卡通关
 */
export async function settleLevel(
  kind: SettlementKind,
  levelId: string,
  results: GameResult[],
): Promise<SettlementOutcome> {
  const correctWords = collectCorrectWords(results)
  const wrongWords = collectWrongWords(results)

  switch (kind) {
    case 'recruit': {
      const { session } = await completeRecruitLevel(levelId, correctWords)
      return {
        kind,
        session,
        recruited: correctWords,
        summary: `招募成功，收编 ${correctWords.length} 名新兵`,
      }
    }
    case 'review': {
      const deserted: string[] = []
      for (const word of correctWords) {
        await submitPlanetReview(word, true)
      }
      for (const word of wrongWords) {
        const res = await submitPlanetReview(word, false)
        if (res.deserted) deserted.push(word)
      }
      const { session } = await completeReviewLevel(levelId)
      return {
        kind,
        session,
        reviewed: { kept: correctWords, deserted },
        summary:
          deserted.length > 0
            ? `留住 ${correctWords.length} 名老兵，有 ${deserted.length} 名叛逃`
            : `留住 ${correctWords.length} 名老兵，无人叛逃`,
      }
    }
    case 'boss': {
      const { session } = await completeBossLevel(levelId)
      return { kind, session, summary: '城堡攻陷，关卡通关！' }
    }
    default: {
      // 穷尽性保护
      throw new Error(`未知结算类型: ${kind as string}`)
    }
  }
}
