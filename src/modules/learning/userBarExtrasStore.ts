import { create } from 'zustand'
import type { RaceBreakdownItem } from './components/AppUserBar'
import type { PlanetSession } from '../conquer-planet/types'
import { POS_RACE, SIX_RACES } from '../conquer-planet/types'
import type { PartOfSpeech } from '../word-hunter/domain/battle/battleTypes'

function posShortTag(pos: PartOfSpeech): string {
  const map: Record<PartOfSpeech, string> = {
    noun: 'NOUN',
    verb: 'VERB',
    adjective: 'ADJ',
    adverb: 'ADV',
    prep: 'PREP',
    pronoun: 'PRON',
    other: 'OTHER',
  }
  return map[pos] ?? pos.toUpperCase()
}

export function raceBreakdownFromSession(session: PlanetSession): RaceBreakdownItem[] {
  const counts: Record<string, number> = {}
  for (const soldier of session.soldiers) {
    counts[soldier.partOfSpeech] = (counts[soldier.partOfSpeech] ?? 0) + 1
  }
  return SIX_RACES.map((pos) => {
    const race = POS_RACE[pos]
    return {
      label: race.race,
      posTag: posShortTag(pos),
      color: race.color,
      count: counts[pos] ?? 0,
    }
  })
}

export function emptyRaceBreakdown(): RaceBreakdownItem[] {
  return SIX_RACES.map((pos) => {
    const race = POS_RACE[pos]
    return {
      label: race.race,
      posTag: posShortTag(pos),
      color: race.color,
      count: 0,
    }
  })
}

interface UserBarExtrasState {
  planetSession: PlanetSession | null
  raceBreakdown: RaceBreakdownItem[]
  setFromPlanetSession: (session: PlanetSession) => void
  clear: () => void
}

export const useUserBarExtrasStore = create<UserBarExtrasState>((set) => ({
  planetSession: null,
  raceBreakdown: [],
  setFromPlanetSession: (session) =>
    set({
      planetSession: session,
      raceBreakdown: raceBreakdownFromSession(session),
    }),
  clear: () => set({ planetSession: null, raceBreakdown: [] }),
}))
