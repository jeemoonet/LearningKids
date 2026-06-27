const BASE = '/assets/word-hunter'

export function battleBackgroundUrl(name: string): string {
  return `${BASE}/backgrounds/${name}.png`
}

export function monsterPortraitUrl(name: string): string {
  return `${BASE}/monsters/${name}.png`
}

export function playerHeroUrl(): string {
  return `${BASE}/ui/player-hero.svg`
}
