import type { ComponentType } from 'react'
import type { PlanetWord } from '../types'

/**
 * 过关游戏插件系统 · 核心契约
 *
 * 设计原则：
 * - 插件只认 GameContext（词表 + 干扰项），产出 GameResult（通关结果）。
 * - 插件不感知军团 / 熟悉度 / 收编等学习闭环能力，奖励逻辑全部在关卡侧处理。
 * - 新增游戏 = 新建一个文件夹 + 在 games/index.ts 注册一行。
 */

/** 通用词条：与征服星球 PlanetWord 结构兼容，插件内部可直接复用 domain/quiz 等工具 */
export type GameWord = PlanetWord

/** 能力标签，便于按类型筛选 / 随机组合 */
export type GameTag =
  | 'recognition' // 认词
  | 'spelling' // 拼写
  | 'cloze' // 填空 / 完形
  | 'battle' // 对决
  | 'matching' // 连线 / 配对

/** 运行时输入：本关要练的目标词 + 可用干扰项池 */
export interface GameContext {
  /** 目标词（本关要过的词） */
  words: GameWord[]
  /** 干扰项池（构造选项 / 连线 / 完形用，可与 words 重叠） */
  distractors: GameWord[]
  /** 对决类游戏可选的怪兽信息 */
  monster?: { id: string; partOfSpeech: GameWord['partOfSpeech'] }
  /** 透传给游戏的额外上下文 */
  meta?: Record<string, unknown>
}

/** 统一通关结果：关卡据此结算（收编 / 加减熟悉度 / 奖励等） */
export interface GameResult {
  /** 是否通关（如全对、达到阈值等，由插件自行定义） */
  cleared: boolean
  /** 答对的词（→ 可收编 / +熟悉度） */
  correctWords: string[]
  /** 答错的词（→ 可叛逃 / -熟悉度） */
  wrongWords: string[]
  /** 0~1 归一化得分，可选 */
  score?: number
  /** 扩展统计：用时、连击等 */
  stats?: Record<string, number>
}

/** 游戏组件 props */
export interface GameProps<Config = unknown> {
  context: GameContext
  config?: Config
  /** 该游戏结束时回传结果（多步关卡由 GameRunner 串联） */
  onComplete: (result: GameResult) => void
  /** 玩家中途退出 */
  onExit: () => void
}

/** 游戏插件定义 */
export interface GamePlugin<Config = unknown> {
  /** 全局唯一 id，如 'flashcard-recognition' */
  id: string
  name: string
  icon: string
  description: string
  tags: GameTag[]
  /** 运行所需最少目标词数 */
  minWords: number
  /** 选项 / 连线类所需最少干扰项数 */
  minDistractors?: number
  /** 给定上下文能否运行；数据不足时由 Runner 自动跳过该游戏 */
  canPlay: (ctx: GameContext) => boolean
  Component: ComponentType<GameProps<Config>>
}

/** 类型擦除后的插件（注册表 / Runner 内部使用） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGamePlugin = GamePlugin<any>

/** 关卡中的单个游戏步骤 */
export interface GameStep {
  gameId: string
  /** 透传给插件的私有配置（类型由插件自行声明） */
  config?: unknown
  /** random 模式下的抽取权重，默认 1 */
  weight?: number
}

/** 关卡选游戏的声明：指定 / 序列 / 随机 */
export interface LevelGameSpec {
  /** fixed=单游戏；sequence=按顺序串多个；random=从 pool 随机抽取 */
  mode: 'fixed' | 'sequence' | 'random'
  /** fixed / sequence 使用 */
  steps?: GameStep[]
  /** random 使用的候选池 */
  pool?: GameStep[]
  /** random 抽取数量，默认 1 */
  randomCount?: number
  /** 多步通关判定：all=全部 cleared 才算过；any=任一即可。默认 all */
  passRule?: 'all' | 'any'
}
