import { KINGDOM_MAP_VIEW } from '../data/mapViewBox'

interface ImageKingdomMapSceneProps {
  imageSrc: string
  pathD: string
  immersive?: boolean
  alternatePaths?: string[]
}

/** AI 生成底图 + SVG 路径叠加 */
export function ImageKingdomMapScene({
  imageSrc,
  pathD,
  immersive,
  alternatePaths,
}: ImageKingdomMapSceneProps) {
  const { w, h } = KINGDOM_MAP_VIEW
  return (
    <svg
      className={`cp-image-map-scene${immersive ? ' cp-image-map-scene--immersive' : ''}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <image href={imageSrc} x="0" y="0" width={w} height={h} preserveAspectRatio="none" />      {alternatePaths?.map((alt) => (
        <path key={alt.slice(0, 28)} className="cp-route-line cp-route-line--alt" d={alt} />
      ))}
      <path className="cp-route-line cp-route-line--base" d={pathD} />
      <path className="cp-route-line cp-route-line--dash" d={pathD} />
    </svg>
  )
}

export type KingdomMapVisualStyle = 'parchment' | 'fantasy-topdown' | 'image' | 'boardgame'

/** kingdom-1 默认地图风格：boardgame | image | fantasy-topdown */
const KINGDOM_1_VISUAL: KingdomMapVisualStyle = 'image'
const KINGDOM_MAP_IMAGES: Record<string, string> = {
  'kingdom-1': '/assets/conquer-planet/kingdom-1-map.png',
  'kingdom-2': '/assets/conquer-planet/kingdom-2-map.png',
}

export function getKingdomMapImage(kingdomId: string): string | null {
  return KINGDOM_MAP_IMAGES[kingdomId] ?? null
}

export function getKingdomMapVisualStyle(kingdomId: string): KingdomMapVisualStyle {
  if (kingdomId === 'kingdom-1') return KINGDOM_1_VISUAL
  if (KINGDOM_MAP_IMAGES[kingdomId]) return 'image'
  return 'parchment'
}
