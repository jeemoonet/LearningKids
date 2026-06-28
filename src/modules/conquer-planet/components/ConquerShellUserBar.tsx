import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LearningProfile } from '../../learning/api'
import { AppUserBar, type RaceBreakdownItem } from '../../learning/components/AppUserBar'
import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { POS_RACE, SIX_RACES } from '../types'
import { useConquer } from '../ConquerContext'
import { ArmyInspectModal } from './ArmyInspectModal'

interface ConquerShellUserBarProps {
  profile: LearningProfile | null
  userDisplayName?: string
  onLogout: () => void
}

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

export function ConquerShellUserBar({
  profile,
  userDisplayName,
  onLogout,
}: ConquerShellUserBarProps) {
  const { session } = useConquer()
  const [inspectOpen, setInspectOpen] = useState(false)
  const [mount, setMount] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMount(document.getElementById('lk-user-bar-mount'))
  }, [])

  const raceBreakdown = useMemo((): RaceBreakdownItem[] => {
    if (!session) return []
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
  }, [session])

  if (!mount) return null

  return createPortal(
    <>
      <AppUserBar
        profile={profile}
        userDisplayName={userDisplayName}
        onLogout={onLogout}
        playerMetrics={
          session
            ? {
                armySize: session.armySize,
                combatPower: session.combatPower ?? session.armyExp,
                magicPower: 0,
                totalPower: session.totalPower,
                level: 1,
              }
            : null
        }
        raceBreakdown={raceBreakdown}
        onInspectArmy={() => setInspectOpen(true)}
      />
      {inspectOpen && session && (
        <ArmyInspectModal open session={session} onClose={() => setInspectOpen(false)} />
      )}
    </>,
    mount,
  )
}
