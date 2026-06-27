import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useConquer } from '../../conquer-planet/ConquerContext'
import { SIX_RACES } from '../../conquer-planet/types'
import { learningApi, type LearningLibrary, type LearningProfile } from '../api'
import { WordBankFloatPanel } from './WordBankFloatPanel'

function ConquestTargetPicker({
  profile,
  onChange,
}: {
  profile: LearningProfile | null
  onChange: () => Promise<void>
}) {
  const [libraries, setLibraries] = useState<LearningLibrary[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    learningApi
      .listLibraries()
      .then(({ libraries: list }) => setLibraries(list))
      .catch((err) => setMessage(err instanceof Error ? err.message : '加载失败'))
  }, [])

  const choose = async (id: string) => {
    if (!id || id === profile?.currentLibraryId) return
    setBusy(true)
    setMessage('')
    try {
      await learningApi.setCurrentLibrary(id)
      await onChange()
      setMessage('已切换')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '切换失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lw-myworld-action-card lw-myworld-action-card--target">
      <span className="lw-myworld-action-card__label">征服目标</span>
      <select
        id="lw-conquest-target-select"
        className="lw-myworld-action-card__select"
        value={profile?.currentLibraryId ?? ''}
        disabled={busy || libraries.length === 0}
        onChange={(e) => void choose(e.target.value)}
        aria-label="征服目标"
      >
        <option value="" disabled>请选择</option>
        {libraries.map((lib) => (
          <option key={lib.id} value={lib.id}>
            {lib.name}（{lib.wordCount} 词）
          </option>
        ))}
      </select>
      {message && <span className="lw-myworld-action-card__hint">{message}</span>}
    </div>
  )
}

interface WorldMapTopActionsProps {
  profile: LearningProfile | null
  onRefresh: () => Promise<void>
}

export function WorldMapTopActions({ profile, onRefresh }: WorldMapTopActionsProps) {
  const { session } = useConquer()
  const [legionOpen, setLegionOpen] = useState(false)
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setSlot(document.getElementById('lw-top-actions-slot'))
  }, [])

  const legionCount = session?.armySize ?? profile?.knownCount ?? 0
  const raceCount = useMemo(() => {
    if (!session) return 0
    const present = new Set<string>()
    for (const soldier of session.soldiers) {
      if (SIX_RACES.includes(soldier.partOfSpeech as (typeof SIX_RACES)[number])) {
        present.add(soldier.partOfSpeech)
      }
    }
    return present.size
  }, [session])

  const actions = (
    <div className="lw-myworld-topbar__actions">
      <button
        type="button"
        className="lw-myworld-action-card lw-myworld-action-card--legion"
        onClick={() => setLegionOpen(true)}
      >
        <span className="lw-myworld-action-card__line">
          我的军团（{legionCount}）
        </span>
        <span className="lw-myworld-action-card__sub">{raceCount} 族</span>
      </button>
      <ConquestTargetPicker profile={profile} onChange={onRefresh} />
    </div>
  )

  return (
    <>
      {slot ? createPortal(actions, slot) : actions}
      {legionOpen && session && (
        <WordBankFloatPanel
          soldiers={session.soldiers}
          onClose={() => setLegionOpen(false)}
        />
      )}
    </>
  )
}
