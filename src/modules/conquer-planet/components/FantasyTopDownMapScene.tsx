import type { BattleMapNode, KingdomBattleMapLayout } from '../data/kingdomBattleMapLayout'

interface FantasyTopDownMapSceneProps {
  pathD: string
  kingdomName: string
  monsterName?: string
  immersive?: boolean
  alternatePaths?: string[]
  layout: KingdomBattleMapLayout
}

function pct(x: number, y: number) {
  return { x: (x / 100) * 1000, y: (y / 100) * 700 }
}

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx="5" ry="2.5" fill="#2a4020" opacity="0.35" />
      <polygon points="0,-10 7,4 -7,4" fill="#2d5a28" stroke="#1a3818" strokeWidth="0.5" />
      <polygon points="0,-4 5,4 -5,4" fill="#3d7a35" stroke="#1a3818" strokeWidth="0.4" />
    </g>
  )
}

function ForestBlob({ cx, cy, rx, ry, trees }: { cx: number; cy: number; rx: number; ry: number; trees: number }) {
  const pts = Array.from({ length: trees }, (_, i) => {
    const a = (i / trees) * Math.PI * 2
    const r = 0.55 + (i % 3) * 0.15
    return { x: cx + Math.cos(a) * rx * r * 0.85, y: cy + Math.sin(a) * ry * r * 0.7, s: 0.85 + (i % 4) * 0.12 }
  })
  return (
    <g>
      <ellipse cx={cx} cy={cy + 8} rx={rx} ry={ry} fill="#2a5028" opacity="0.55" />
      <ellipse cx={cx} cy={cy + 4} rx={rx * 0.92} ry={ry * 0.88} fill="#3a6832" opacity="0.75" />
      {pts.map((p, i) => (
        <Pine key={i} x={p.x} y={p.y} s={p.s} />
      ))}
    </g>
  )
}

function CastleWhite({ x, y, scale = 1, label }: { x: number; y: number; scale?: number; label?: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="34" rx="52" ry="14" fill="#1a2818" opacity="0.22" />
      <rect x="-28" y="4" width="56" height="28" fill="#e8e4dc" stroke="#8a8078" strokeWidth="1.2" rx="2" />
      <rect x="-18" y="-16" width="36" height="22" fill="#ddd8d0" stroke="#8a8078" strokeWidth="1" rx="1" />
      {([-32, 32] as const).map((tx) => (
        <g key={tx} transform={`translate(${tx}, 0)`}>
          <rect x="-7" y="-8" width="14" height="26" fill="#ece8e0" stroke="#8a8078" strokeWidth="0.9" />
          <polygon points="0,-22 9,-8 -9,-8" fill="#3a6a8a" stroke="#2a5068" strokeWidth="0.7" />
        </g>
      ))}
      <polygon points="0,-28 10,-12 -10,-12" fill="#4a88aa" stroke="#2a5068" strokeWidth="0.8" />
      <rect x="-6" y="12" width="12" height="14" fill="#4a4038" stroke="#2a2018" strokeWidth="0.6" />
      {label && (
        <text y="52" textAnchor="middle" className="cp-fantasy-map-label" fontSize="11">
          {label}
        </text>
      )}
    </g>
  )
}

function CastleRed({ x, y, scale = 1, label }: { x: number; y: number; scale?: number; label?: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="28" rx="38" ry="10" fill="#1a1810" opacity="0.2" />
      <rect x="-22" y="2" width="44" height="22" fill="#9a5848" stroke="#5a3028" strokeWidth="1" rx="1" />
      <rect x="-14" y="-12" width="28" height="16" fill="#8a4838" stroke="#5a3028" strokeWidth="0.8" />
      {([-20, 20] as const).map((tx) => (
        <g key={tx} transform={`translate(${tx}, 4)`}>
          <rect x="-5" y="-10" width="10" height="18" fill="#8a5040" stroke="#5a3028" strokeWidth="0.7" />
          <polygon points="0,-18 6,-8 -6,-8" fill="#5a3830" stroke="#3a2018" strokeWidth="0.5" />
        </g>
      ))}
      {label && (
        <text y="44" textAnchor="middle" className="cp-fantasy-map-label" fontSize="10">
          {label}
        </text>
      )}
    </g>
  )
}

function VillageHuts({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="18" rx="36" ry="10" fill="#1a2818" opacity="0.18" />
      <rect x="-22" y="2" width="16" height="12" fill="#c4a878" stroke="#6a5038" strokeWidth="0.7" />
      <polygon points="-14,2 -22,2 -14,-8" fill="#8a4838" stroke="#6a5038" strokeWidth="0.5" />
      <rect x="4" y="4" width="18" height="11" fill="#d4b888" stroke="#6a5038" strokeWidth="0.7" />
      <polygon points="13,4 4,4 13,-6" fill="#7a4030" stroke="#6a5038" strokeWidth="0.5" />
      <rect x="-6" y="8" width="10" height="8" fill="#b89868" stroke="#6a5038" strokeWidth="0.5" />
      {label && (
        <text y="34" textAnchor="middle" className="cp-fantasy-map-label" fontSize="10">
          {label}
        </text>
      )}
    </g>
  )
}

function CampTents({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="14" rx="28" ry="8" fill="#1a2818" opacity="0.15" />
      <polygon points="-12,12 -12,-2 0,12" fill="#c4a050" stroke="#6a5028" strokeWidth="0.6" />
      <polygon points="12,12 12,-4 0,12" fill="#d4b060" stroke="#6a5028" strokeWidth="0.6" />
      <line x1="0" y1="-4" x2="0" y2="-10" stroke="#5a4020" strokeWidth="0.8" />
      {label && (
        <text y="28" textAnchor="middle" className="cp-fantasy-map-label" fontSize="10">
          {label}
        </text>
      )}
    </g>
  )
}

function ValleyBasin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="0" rx="55" ry="32" fill="#6a7a58" opacity="0.35" />
      <ellipse cx="0" cy="4" rx="40" ry="22" fill="#5a6a48" opacity="0.25" />
      <path
        d="M -35 8 Q -10 -12 0 -8 Q 10 -12 35 8"
        fill="none"
        stroke="#4a5a3a"
        strokeWidth="1.2"
        opacity="0.5"
      />
    </g>
  )
}

function LandmarkForNode(node: BattleMapNode) {
  const { x, y } = pct(node.x, node.y)
  switch (node.terrain) {
    case 'camp':
      return <CampTents x={x} y={y} label={node.label} />
    case 'village':
      return <VillageHuts x={x} y={y - 8} label={node.label} />
    case 'castle':
      return <CastleWhite x={x} y={y + 12} scale={1.15} label={node.label} />
    case 'tower':
      return <CastleRed x={x} y={y + 6} scale={0.85} label={node.label} />
    case 'valley':
      return (
        <g>
          <ValleyBasin x={x} y={y} />
          {node.levelId && (
            <text x={x} y={y + 28} textAnchor="middle" className="cp-fantasy-map-label" fontSize="10">
              {node.label}
            </text>
          )}
        </g>
      )
    default:
      return null
  }
}

/** 俯视手绘 RPG 风格地图（参考经典回合制世界地图） */
export function FantasyTopDownMapScene({
  pathD,
  kingdomName,
  monsterName,
  immersive,
  alternatePaths,
  layout,
}: FantasyTopDownMapSceneProps) {
  const bossNode = layout.nodes['boss-1']
  const bossPos = bossNode ? pct(bossNode.x, bossNode.y) : pct(48, 5)

  return (
    <svg
      className={`cp-fantasy-map-scene${immersive ? ' cp-fantasy-map-scene--immersive' : ''}`}
      viewBox="0 0 1000 700"
      preserveAspectRatio={immersive ? 'xMidYMid slice' : 'xMidYMid meet'}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="cp-fantasy-grass" cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#6ea858" />
          <stop offset="45%" stopColor="#5a9448" />
          <stop offset="100%" stopColor="#3d6838" />
        </radialGradient>
        <linearGradient id="cp-fantasy-river" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7aa8b8" />
          <stop offset="100%" stopColor="#4a7888" />
        </linearGradient>
        <radialGradient id="cp-fantasy-vignette" cx="50%" cy="45%" r="68%">
          <stop offset="55%" stopColor="transparent" />
          <stop offset="100%" stopColor="#1a2818" />
        </radialGradient>
        <filter id="cp-fantasy-soft" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width="1000" height="700" fill="url(#cp-fantasy-grass)" />

      <ellipse cx="720" cy="520" rx="200" ry="140" fill="#8a6848" opacity="0.42" />
      <ellipse cx="180" cy="200" rx="160" ry="110" fill="#7a8858" opacity="0.35" />
      <ellipse cx="820" cy="120" rx="130" ry="90" fill="#6a7850" opacity="0.38" />
      <ellipse cx="480" cy="120" rx="120" ry="70" fill="#5a6848" opacity="0.3" />

      <path
        d="M 80 120 C 160 180 220 240 280 300 S 380 420 460 480 S 580 580 680 620 S 820 660 920 640"
        fill="none"
        stroke="url(#cp-fantasy-river)"
        strokeWidth="20"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M 80 120 C 160 180 220 240 280 300 S 380 420 460 480 S 580 580 680 620 S 820 660 920 640"
        fill="none"
        stroke="#2a5060"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />

      <ForestBlob cx={120} cy={560} rx={90} ry={55} trees={14} />
      <ForestBlob cx={80} cy={420} rx={70} ry={45} trees={11} />
      <ForestBlob cx={200} cy={480} rx={55} ry={38} trees={9} />
      <ForestBlob cx={860} cy={480} rx={75} ry={48} trees={12} />
      <ForestBlob cx={780} cy={560} rx={65} ry={42} trees={10} />
      <ForestBlob cx={900} cy={180} rx={60} ry={40} trees={9} />
      <ForestBlob cx={140} cy={140} rx={50} ry={35} trees={8} />
      <ForestBlob cx={620} cy={600} rx={48} ry={32} trees={8} />
      <ForestBlob cx={240} cy={320} rx={42} ry={30} trees={7} />
      <ForestBlob cx={700} cy={280} rx={50} ry={34} trees={8} />

      {Object.values(layout.nodes)
        .filter((n) => n.terrain === 'valley' && !n.levelId)
        .map((n) => {
          const p = pct(n.x, n.y)
          return <ValleyBasin key={`valley-${n.id}`} x={p.x} y={p.y} />
        })}

      {alternatePaths?.map((alt) => (
        <path key={alt.slice(0, 28)} className="cp-fantasy-path cp-fantasy-path--alt" d={alt} />
      ))}

      <path className="cp-fantasy-path-shadow" d={pathD} />
      <path className="cp-fantasy-path" d={pathD} />

      {Object.values(layout.nodes).map((node) => (
        <g key={`landmark-${node.id}`}>{LandmarkForNode(node)}</g>
      ))}

      {monsterName && (
        <g transform={`translate(${bossPos.x}, ${bossPos.y - 20})`}>
          <ellipse cx="0" cy="0" rx="70" ry="22" fill="#b8c8d8" opacity="0.28" filter="url(#cp-fantasy-soft)" />
        </g>
      )}

      <g transform="translate(500, 668)">
        <rect x="-120" y="-16" width="240" height="32" rx="6" fill="rgba(40, 32, 20, 0.55)" stroke="#8a7858" strokeWidth="1" />
        <text y="-1" textAnchor="middle" className="cp-fantasy-map-title" fontSize="13">
          {kingdomName}
        </text>
        <text y="12" textAnchor="middle" className="cp-fantasy-map-subtitle" fontSize="8">
          {monsterName ? `${monsterName} 盘踞北方` : '词性军团远征'}
        </text>
      </g>

      <rect width="1000" height="700" fill="url(#cp-fantasy-vignette)" opacity="0.28" pointerEvents="none" />
    </svg>
  )
}
