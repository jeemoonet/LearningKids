export const PLAYER_STATS_DIRTY = 'lk-player-stats-dirty'

export function emitPlayerStatsDirty(): void {
  window.dispatchEvent(new CustomEvent(PLAYER_STATS_DIRTY))
}
