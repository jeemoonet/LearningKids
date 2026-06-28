import type { BattleMapNode } from './kingdomBattleMapLayout'
import { formatLearningMethodsNote, getLevelLearningProfile } from './levelLearningMethods'
import type { PlanetLevel } from '../types'

const WAYPOINT_EVENTS_K1: Record<string, string> = {
  start: '南麓营地篝火正旺，远征军在此整装，准备沿山路北上。',
  'wp-cliff': '一座木质小桥横跨溪流，桥下水声潺潺，是进入林区的第一道关口。',
  'wp-outpost': '前哨石塔扼守要道，塔顶旗帜指向山顶方向。',
  'wp-add-2': '村庄路口人来马往，几条小径在此分开，主路继续向山顶延伸。',
  'wp-add-3': '山顶石门巍然耸立，穿过门洞即可望见王宫塔尖。',
  'wp-add-1': '王宫城堡盘踞山巅，迷雾石像的封印就在此间深处。',
}

const LEVEL_NODE_EVENTS_K1: Record<string, string> = {
  'recruit-1': '边境村庄炊烟袅袅，村民正在等候远征军的招募。',
  'recruit-2': '溪畔聚落水声清越，新的义勇正在此间聚集。',
  'review-1': '回声在山谷间回荡，走散的老兵或许就在附近徘徊。',
  'review-2': '森林废墟间迷雾未散，需及时叫出走散士兵的名字。',
}

const WAYPOINT_EVENTS_K3: Record<string, string> = {
  start: '猎手营地篝火在雾中明灭，远征军在此整理弓刃，准备深入西侧永雾林。',
  'wp-cliff': '苔石渡桥横跨暗溪，桥下流水几乎无声，林缘的雾从这里开始变浓。',
  'fork-1': '林缘雾口浓雾翻涌，向东或向西，两条小径在雾中若隐若现。',
  'wp-sun-1': '光斑从树冠缝隙洒落，落叶间隐约可见动词猎手的脚印。',
  'wp-sun-2': '巨树树屋悬在上方，哨兵正俯视着整条日光林径。',
  'wp-sun-3': '林冠边缘雾薄风清，前方即是汇合营地。',
  'wp-mist-1': '磷光在脚边明灭，仿佛副词的低语自沼泽深处传来。',
  'wp-mist-2': '根须隘口狭窄潮湿，再往前便回到主林径。',
  'wp-merge-1': '两条林径在此汇合，篝火重新燃起，远征军得以喘口气。',
  'wp-outpost': '瞭望树屋悬在枝杈间，哨兵说动词猎手的影子在更北的雾里出没。',
  'fork-2': '三岔雾口浓雾再起，树脊险道与根拱秘道各通向不同的林心。',
  'wp-ridge-1': '树脊栈道悬于半空，脚下是翻涌的雾海。',
  'wp-ridge-2': '悬根平台由巨树根须托举，再往前便是古树拱门。',
  'wp-root-1': '根拱狭道蜿蜒于地下，低语声从根须间传来。',
  'wp-root-2': '根须深廊曲折漫长，雾墙在两侧缓缓流动。',
  'wp-root-3': '雾根出口重新见到天光，古树拱门已在不远前。',
  'wp-add-3': '古树拱门由千年根须自然形成，穿过拱门便望见林心巨木的轮廓。',
  'wp-final': '王座前庭寂静庄严，空心巨木的入口就在眼前。',
  'wp-add-1': '林心王座在空心巨木深处，林影追猎者的动词封印正在此间脉动。',
}

const LEVEL_NODE_EVENTS_K3: Record<string, string> = {
  'recruit-1': '林间聚落藏在巨杉之间，村民以动作动词自报家门，等待你的招募。',
  'recruit-2': '追猎营地弓弦轻响，动词猎手只接纳能叫对动作名字的新兵。',
  'review-1': '迷途幽谷里回声重叠，走散的动词武士可能就在雾墙之后。',
  'review-2': '低语根林的根须沙沙作响，不及时叫出名字，士兵会被林声吞没。',
  'special-1': '磷光迷沼中动词猎手封锁了道路，只有副词之光能驱散迷雾。',
  'special-2': '猎手迷局里动词陷阱重重，须以副词逐一破解方能北上。',
}

const KINGDOM_WAYPOINT_EVENTS: Record<string, Record<string, string>> = {
  'kingdom-1': WAYPOINT_EVENTS_K1,
  'kingdom-3': WAYPOINT_EVENTS_K3,
}

const KINGDOM_LEVEL_NODE_EVENTS: Record<string, Record<string, string>> = {
  'kingdom-1': LEVEL_NODE_EVENTS_K1,
  'kingdom-3': LEVEL_NODE_EVENTS_K3,
}

const KINGDOM_REGION_LABEL: Record<string, string> = {
  'kingdom-1': '微光村国 · 远征途中',
  'kingdom-3': '迷雾森林国 · 远征途中',
}

export function getKingdomRegionLabel(kingdomId: string): string {
  return KINGDOM_REGION_LABEL[kingdomId] ?? '远征途中'
}

export function getWaypointEvent(node: BattleMapNode, kingdomId = 'kingdom-1'): string {
  const kingdomEvents = KINGDOM_WAYPOINT_EVENTS[kingdomId] ?? WAYPOINT_EVENTS_K1
  const levelEvents = KINGDOM_LEVEL_NODE_EVENTS[kingdomId] ?? LEVEL_NODE_EVENTS_K1
  return (
    levelEvents[node.id] ??
    kingdomEvents[node.id] ??
    WAYPOINT_EVENTS_K1[node.id] ??
    `你抵达了${node.label}，林径继续向前延伸。`
  )
}

export function getLevelEvent(level: PlanetLevel, done: boolean): string {
  if (done) {
    return `此处已被征服，${level.name}恢复了平静。你可以继续沿林径前进。`
  }
  const profile = getLevelLearningProfile(level.kind)
  return `${level.desc}——${profile.sceneHint}`
}

export function getLevelLearningNote(level: PlanetLevel, done: boolean): string | undefined {
  if (done) return undefined
  return formatLearningMethodsNote(level.kind)
}

export function getForkArrivalEvent(): string {
  return '岔路口横在面前，多条林径通往不同方向。请选择远征军要踏上的道路。'
}

export function getForkChoiceEvent(branchLabel: string, hint: string): string {
  return `远征军踏上「${branchLabel}」。${hint}。`
}
