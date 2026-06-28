import { useMemo, useSyncExternalStore } from 'react'
import type { PlanetLevel, PlanetLevelKind } from '../types'
import { getRoadbookEntries, type RoadbookEntry } from '../lib/roadbook'

interface RoadbookContentProps {
  kingdomId: string
  conqueredLevels: PlanetLevel[]
}

const KIND_LABEL: Record<PlanetLevelKind, string> = {
  recruit: '招募',
  review: '复习',
  boss: '决战',
}

function subscribeRoadbook(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener('storage', handler)
  window.addEventListener('conquer-roadbook-change', handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener('conquer-roadbook-change', handler)
  }
}

function getSnapshot() {
  return Date.now()
}

function useRoadbookEntries(kingdomId: string, conqueredLevels: PlanetLevel[]) {
  const version = useSyncExternalStore(subscribeRoadbook, getSnapshot, getSnapshot)
  return useMemo(() => {
    const stored = getRoadbookEntries(kingdomId)
    const byId = new Map(stored.map((e) => [e.levelId, e]))
    const merged: RoadbookEntry[] = conqueredLevels.map((level) => {
      const hit = byId.get(level.id)
      if (hit) return hit
      return {
        levelId: level.id,
        levelName: level.name,
        kind: level.kind,
        words: [],
        conqueredAt: 0,
      }
    })
    for (const entry of stored) {
      if (!merged.some((m) => m.levelId === entry.levelId)) {
        merged.push(entry)
      }
    }
    return merged
  }, [kingdomId, conqueredLevels, version])
}

function EntryBlock({ entry }: { entry: RoadbookEntry }) {
  return (
    <section className="cp-roadbook__entry">
      <header className="cp-roadbook__entry-head">
        <span className="cp-roadbook__entry-kind">{KIND_LABEL[entry.kind]}</span>
        <strong className="cp-roadbook__entry-name">{entry.levelName}</strong>
      </header>
      {entry.words.length > 0 ? (
        <p className="cp-roadbook__words">{entry.words.join(' · ')}</p>
      ) : (
        <p className="cp-roadbook__words cp-roadbook__words--empty">—</p>
      )}
    </section>
  )
}

function RoadbookContent({ kingdomId, conqueredLevels }: RoadbookContentProps) {
  const entries = useRoadbookEntries(kingdomId, conqueredLevels)

  if (entries.length === 0) {
    return <p className="cp-roadbook__empty">尚无记录，完成关卡后会写在这里。</p>
  }

  return entries.map((entry) => <EntryBlock key={entry.levelId} entry={entry} />)
}

interface RoadbookSheetProps extends RoadbookContentProps {
  open: boolean
  onClose: () => void
}

export function RoadbookSheet({ open, onClose, kingdomId, conqueredLevels }: RoadbookSheetProps) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="cp-roadbook-sheet__backdrop"
        aria-label="关闭路书"
        onClick={onClose}
      />
      <div className="cp-roadbook-sheet" role="dialog" aria-label="路书" aria-modal="true">
        <div className="cp-roadbook-sheet__handle" aria-hidden="true" />
        <header className="cp-roadbook-sheet__head">
          <div>
            <h2 className="cp-roadbook-sheet__title">路书</h2>
            <p className="cp-roadbook-sheet__subtitle">已征服关卡与单词</p>
          </div>
          <button type="button" className="cp-roadbook-sheet__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>
        <div className="cp-roadbook-sheet__body">
          <RoadbookContent kingdomId={kingdomId} conqueredLevels={conqueredLevels} />
        </div>
      </div>
    </>
  )
}
