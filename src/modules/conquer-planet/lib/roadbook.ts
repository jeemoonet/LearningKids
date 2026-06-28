import type { PlanetLevelKind, PlanetSession } from '../types'

const STORAGE_KEY = 'conquer-roadbook-v1'

export interface RoadbookEntry {
  levelId: string
  levelName: string
  kind: PlanetLevelKind
  words: string[]
  conqueredAt: number
}

type RoadbookStore = Record<string, RoadbookEntry[]>

function readAll(): RoadbookStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as RoadbookStore
  } catch {
    return {}
  }
}

function writeAll(data: RoadbookStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  emitRoadbookChange()
}

export function emitRoadbookChange() {
  window.dispatchEvent(new CustomEvent('conquer-roadbook-change'))
}

export function getRoadbookEntries(kingdomId: string): RoadbookEntry[] {
  return readAll()[kingdomId] ?? []
}

export function upsertRoadbookEntry(kingdomId: string, entry: Omit<RoadbookEntry, 'conqueredAt'>) {
  const all = readAll()
  const list = all[kingdomId] ?? []
  const idx = list.findIndex((e) => e.levelId === entry.levelId)
  const next: RoadbookEntry = { ...entry, conqueredAt: Date.now() }
  if (idx >= 0) {
    list[idx] = next
  } else {
    list.push(next)
  }
  all[kingdomId] = list
  writeAll(all)
}

export function clearKingdomRoadbook(kingdomId: string) {
  const all = readAll()
  delete all[kingdomId]
  writeAll(all)
}

export function findLevelInSession(
  session: PlanetSession,
  levelId: string,
): { kingdomId: string; levelName: string; kind: PlanetLevelKind } | null {
  for (const kingdom of session.kingdoms) {
    const level = kingdom.levels.find((l) => l.id === levelId)
    if (level) {
      return { kingdomId: kingdom.id, levelName: level.name, kind: level.kind }
    }
  }
  const fallback = session.levels.find((l) => l.id === levelId)
  if (fallback) {
    return {
      kingdomId: session.activeKingdomId,
      levelName: fallback.name,
      kind: fallback.kind,
    }
  }
  return null
}

export function soldierWordsAdded(
  before: PlanetSession | null | undefined,
  after: PlanetSession,
): string[] {
  if (!before) return []
  const known = new Set(before.soldiers.map((s) => s.word.toLowerCase()))
  return after.soldiers
    .filter((s) => !known.has(s.word.toLowerCase()))
    .map((s) => s.word)
}
