/** 七王国在大陆全景图上的布局坐标（百分比） */
export const KINGDOM_MAP_POSITIONS: Record<string, { x: number; y: number; region: string }> = {
  'kingdom-1': { x: 20, y: 76, region: '西南边境' },
  'kingdom-2': { x: 42, y: 84, region: '南麓平原' },
  'kingdom-3': { x: 18, y: 50, region: '西侧林带' },
  'kingdom-4': { x: 50, y: 46, region: '中央沙海' },
  'kingdom-5': { x: 78, y: 52, region: '东岸商路' },
  'kingdom-6': { x: 28, y: 20, region: '北境回廊' },
  'kingdom-7': { x: 58, y: 10, region: '极北王座' },
}

/** 王国之间的商道连线路径（viewBox 1000×700 坐标） */
export const CONTINENT_ROUTE =
  'M 200 532 Q 280 560 420 588 Q 520 520 500 322 Q 480 180 580 70'
