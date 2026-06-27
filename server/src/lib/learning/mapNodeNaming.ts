import { callLlmJson } from '../llmJsonChat.js'

const TERRAIN_HINTS: Record<string, string> = {
  camp: '远征军扎营处',
  village: '可招募村民的聚落',
  forest: '密林或林缘小道',
  valley: '山谷、峡谷或回声之地',
  castle: 'Boss 决战用的王宫或要塞',
  fork: '道路分叉口',
  waypoint: '普通途经路点',
  tower: '哨塔、关隘或前哨',
}

export interface MapNodeNamingInput {
  id: string
  terrain: string
  x: number
  y: number
  currentLabel?: string
}

export interface MapNodeNamingResult {
  label: string
  terrain: string
}

export async function aiNameMapNodes(
  kingdomName: string,
  nodes: MapNodeNamingInput[],
): Promise<Record<string, MapNodeNamingResult>> {
  const nodeDesc = nodes
    .map((n) => {
      const hint = TERRAIN_HINTS[n.terrain] ?? '地图路点'
      return `- id: ${n.id}, 类型: ${n.terrain}（${hint}）, 坐标约 (${n.x}%, ${n.y}%)${n.currentLabel ? `, 现名: ${n.currentLabel}` : ''}`
    })
    .join('\n')

  const prompt = `你是奇幻 RPG 地图文案师。为「${kingdomName}」战斗地图上的路点起中文地名。

要求：
1. 每个地点 2~6 个汉字，有奇幻冒险感，适合儿童阅读
2. 名称需与 terrain 类型相符（camp=营地, village=村庄, forest=树林, valley=山谷, castle=城堡/王宫, fork=岔路, waypoint=路点/驿站, tower=哨塔/关隘）
3. 同一地图内名称不要重复
4. 可微调 terrain（若原类型明显不合适），但尽量保持原类型

路点列表：
${nodeDesc}

返回 JSON，格式：
{
  "nodes": {
    "<id>": { "label": "中文地名", "terrain": "camp|village|forest|valley|castle|fork|waypoint|tower" }
  }
}`

  const { content } = await callLlmJson(prompt)
  const parsed = JSON.parse(content) as {
    nodes?: Record<string, { label?: string; terrain?: string }>
  }

  const result: Record<string, MapNodeNamingResult> = {}
  for (const node of nodes) {
    const item = parsed.nodes?.[node.id]
    if (!item?.label) continue
    result[node.id] = {
      label: item.label.trim(),
      terrain: item.terrain?.trim() || node.terrain,
    }
  }
  return result
}

export async function aiNameSingleMapNode(
  kingdomName: string,
  node: MapNodeNamingInput,
): Promise<MapNodeNamingResult> {
  const batch = await aiNameMapNodes(kingdomName, [node])
  const named = batch[node.id]
  if (!named) throw new Error('AI 未返回有效地名')
  return named
}
