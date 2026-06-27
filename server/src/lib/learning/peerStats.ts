import type { DatabaseSync } from 'node:sqlite'
import { getPlanetProgressSummary } from './conquerPlanet.js'
import { getKnownCount } from './knownWords.js'

const PEER_AVATARS = ['🐯', '🦉', '🐻', '🐰', '🦊', '🐼', '🦁', '🐸', '🐶', '🐱', '🐨', '🐷']

export interface PeerLearner {
  userId: string
  displayName: string
  avatar: string
  level: number
  knownCount: number
  conqueredKingdoms: number
  kingdomTotal: number
  currentKingdomId: string
  currentKingdomName: string
  online: boolean
}

export interface PeerBoard {
  self: PeerLearner
  selfRank: number
  peers: PeerLearner[]
}

function avatarForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return PEER_AVATARS[hash % PEER_AVATARS.length]
}

function levelFromKnownCount(count: number): number {
  return Math.max(1, Math.min(99, Math.floor(count / 12) + 1))
}

function comparePeers(a: PeerLearner, b: PeerLearner): number {
  if (b.conqueredKingdoms !== a.conqueredKingdoms) return b.conqueredKingdoms - a.conqueredKingdoms
  return b.knownCount - a.knownCount
}

function buildPeerLearner(
  db: DatabaseSync,
  userId: string,
  displayName: string,
  online: boolean,
): PeerLearner {
  const knownCount = getKnownCount(db, userId)
  const progress = getPlanetProgressSummary(db, userId)
  return {
    userId,
    displayName,
    avatar: avatarForUser(userId),
    level: levelFromKnownCount(knownCount),
    knownCount,
    conqueredKingdoms: progress.conqueredKingdoms,
    kingdomTotal: progress.kingdomTotal,
    currentKingdomId: progress.activeKingdomId,
    currentKingdomName: progress.activeKingdomName,
    online,
  }
}

export function getPeerBoard(
  db: DatabaseSync,
  currentUserId: string,
  displayName: string,
): PeerBoard {
  const now = Date.now()
  const onlineRows = db
    .prepare('SELECT DISTINCT user_id FROM sessions WHERE expires_at > ?')
    .all(now) as Array<{ user_id: string }>
  const onlineSet = new Set(onlineRows.map((r) => r.user_id))

  const self = buildPeerLearner(db, currentUserId, displayName, true)

  const users = db
    .prepare('SELECT id, display_name FROM users WHERE id != ? ORDER BY display_name')
    .all(currentUserId) as Array<{ id: string; display_name: string }>

  const peers = users
    .map((u) => buildPeerLearner(db, u.id, u.display_name, onlineSet.has(u.id)))
    .sort(comparePeers)

  const selfRank = [self, ...peers].sort(comparePeers).findIndex((u) => u.userId === currentUserId) + 1

  return { self, selfRank, peers }
}

/** @deprecated 使用 getPeerBoard */
export function listPeerLearners(db: DatabaseSync, currentUserId: string): PeerLearner[] {
  return getPeerBoard(db, currentUserId, '').peers
}
