/** 每组词性目标：名词 40%、动词 30%、其他 30% */
export const GROUP_POS_RATIO = {
  noun: 0.4,
  verb: 0.3,
  other: 0.3,
} as const

export interface WordForGroup {
  id: number
  pos: string
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function posTargetsForGroupSize(groupSize: number): Record<'noun' | 'verb' | 'other', number> {
  const noun = Math.round(groupSize * GROUP_POS_RATIO.noun)
  const verb = Math.round(groupSize * GROUP_POS_RATIO.verb)
  return { noun, verb, other: groupSize - noun - verb }
}

export function buildRandomGroups(words: WordForGroup[], groupSize: number): number[][] {
  if (groupSize < 5 || groupSize > 10) {
    throw new Error('groupSize 必须在 5-10 之间')
  }

  const pools: Record<'noun' | 'verb' | 'other', WordForGroup[]> = {
    noun: shuffle(words.filter((word) => word.pos === 'noun')),
    verb: shuffle(words.filter((word) => word.pos === 'verb')),
    other: shuffle(words.filter((word) => word.pos !== 'noun' && word.pos !== 'verb')),
  }

  const groups: number[][] = []
  const posOrder: Array<'noun' | 'verb' | 'other'> = ['noun', 'verb', 'other']
  const hasRemaining = () => posOrder.some((pos) => pools[pos].length > 0)

  while (hasRemaining()) {
    const targets = posTargetsForGroupSize(groupSize)
    const chunk: WordForGroup[] = []
    let deficit = 0

    for (const pos of posOrder) {
      const takeCount = Math.min(targets[pos], pools[pos].length)
      chunk.push(...pools[pos].splice(0, takeCount))
      deficit += targets[pos] - takeCount
    }

    while (deficit > 0 && hasRemaining()) {
      for (const pos of posOrder) {
        if (deficit <= 0 || pools[pos].length === 0) continue
        chunk.push(pools[pos].shift()!)
        deficit -= 1
      }
    }

    if (chunk.length > 0) {
      groups.push(shuffle(chunk).map((word) => word.id))
    }
  }

  return groups
}
