import type { BattleMapNode } from './kingdomBattleMapLayout'
import { formatLearningMethodsNote, getLevelLearningProfile } from './levelLearningMethods'
import type { PlanetLevel } from '../types'

const WAYPOINT_EVENTS: Record<string, string> = {
  start: '南麓营地篝火正旺，远征军在此整装，准备沿山路北上。',
  'wp-cliff': '一座木质小桥横跨溪流，桥下水声潺潺，是进入林区的第一道关口。',
  'wp-outpost': '前哨石塔扼守要道，塔顶旗帜指向山顶方向。',
  'wp-add-2': '村庄路口人来马往，几条小径在此分开，主路继续向山顶延伸。',
  'wp-add-3': '山顶石门巍然耸立，穿过门洞即可望见王宫塔尖。',
  'wp-add-1': '王宫城堡盘踞山巅，迷雾石像的封印就在此间深处。',
}

const LEVEL_NODE_EVENTS: Record<string, string> = {
  'recruit-1': '边境村庄炊烟袅袅，村民正在等候远征军的招募。',
  'recruit-2': '溪畔聚落水声清越，新的义勇正在此间聚集。',
  'review-1': '回声在山谷间回荡，走散的老兵或许就在附近徘徊。',
  'review-2': '森林废墟间迷雾未散，需及时叫出走散士兵的名字。',
}

export function getWaypointEvent(node: BattleMapNode): string {
  return (
    LEVEL_NODE_EVENTS[node.id] ??
    WAYPOINT_EVENTS[node.id] ??
    `你抵达了${node.label}，山路继续向前延伸。`
  )
}

export function getLevelEvent(level: PlanetLevel, done: boolean): string {
  if (done) {
    return `此处已被征服，${level.name}恢复了平静。你可以继续沿山路前进。`
  }
  const profile = getLevelLearningProfile(level.kind)
  return `${level.desc}——${profile.sceneHint}`
}

export function getLevelLearningNote(level: PlanetLevel, done: boolean): string | undefined {
  if (done) return undefined
  return formatLearningMethodsNote(level.kind)
}

export function getForkArrivalEvent(): string {
  return '三岔路口横在面前，两条山路分别通往不同的方向。请选择远征军要踏上的道路。'
}

export function getForkChoiceEvent(branchLabel: string, hint: string): string {
  return `远征军踏上「${branchLabel}」。${hint}。`
}
