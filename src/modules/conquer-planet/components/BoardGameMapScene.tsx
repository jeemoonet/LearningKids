import type { ReactNode } from 'react'
import type { BattleMapNode, KingdomBattleMapLayout } from '../data/kingdomBattleMapLayout'
import { KINGDOM_MAP_VIEW } from '../data/mapViewBox'

interface BoardGameMapSceneProps {
  pathD: string
  kingdomName: string
  immersive?: boolean
  alternatePaths?: string[]
  layout: KingdomBattleMapLayout
  /** 可选底图（如 kingdom-1-map.png），有底图时隐藏重复的 SVG 地形/地标 */
  backgroundSrc?: string
}

const INK = '#2a2038'
const SW = 1.5

function pct(x: number, y: number) {
  return { x: (x / 100) * 1000, y: (y / 100) * 700 }
}

function G({
  children,
  x,
  y,
  s = 1,
  sw = SW,
}: {
  children: ReactNode
  x: number
  y: number
  s?: number
  sw?: number
}) {
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${s})`}
      stroke={INK}
      strokeWidth={sw}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {children}
    </g>
  )
}

/* ─── 共享 defs ─── */
function MapDefs() {
  return (
    <defs>
      <linearGradient id="cp-bg-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8ed868" />
        <stop offset="55%" stopColor="#72c050" />
        <stop offset="100%" stopColor="#5aa838" />
      </linearGradient>
      <linearGradient id="cp-water-deep" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3a88b0" />
        <stop offset="100%" stopColor="#2a6888" />
      </linearGradient>
      <linearGradient id="cp-water-shallow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7ec8e8" />
        <stop offset="100%" stopColor="#5aadcc" />
      </linearGradient>
      <linearGradient id="cp-snow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d8e8f4" />
      </linearGradient>
      <linearGradient id="cp-roof-red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e87858" />
        <stop offset="100%" stopColor="#b84838" />
      </linearGradient>
      <linearGradient id="cp-roof-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#68a8e8" />
        <stop offset="100%" stopColor="#3878b8" />
      </linearGradient>
      <linearGradient id="cp-stone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e8e0d0" />
        <stop offset="100%" stopColor="#c8b898" />
      </linearGradient>
      <linearGradient id="cp-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d4a878" />
        <stop offset="100%" stopColor="#a87848" />
      </linearGradient>
      <linearGradient id="cp-tile-base" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe8a8" />
        <stop offset="100%" stopColor="#e8c878" />
      </linearGradient>
      <filter id="cp-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#1a1810" floodOpacity="0.28" />
      </filter>
      <filter id="cp-glow-mist" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern id="cp-grass-dot" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="6" r="1" fill="#4a9838" opacity="0.35" />
        <circle cx="11" cy="3" r="0.8" fill="#5aa848" opacity="0.25" />
      </pattern>
      <pattern id="cp-farm-row" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke="#5a9838" strokeWidth="0.8" opacity="0.4" />
      </pattern>
      <clipPath id="cp-board-clip">
        <rect x="22" y="22" width="956" height="656" rx="14" />
      </clipPath>
      <linearGradient id="cp-board-bg-vignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a2818" stopOpacity="0.12" />
        <stop offset="18%" stopColor="#000000" stopOpacity="0" />
        <stop offset="82%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#1a1810" stopOpacity="0.18" />
      </linearGradient>
    </defs>
  )
}

function TileBase({ w = 52, h = 14, color = 'url(#cp-tile-base)' }: { w?: number; h?: number; color?: string }) {
  return (
    <g filter="url(#cp-soft-shadow)">
      <ellipse cx="0" cy={h * 0.5} rx={w * 0.52} ry={h * 0.5} fill={color} stroke={INK} strokeWidth={1.2} />
      <ellipse cx="0" cy={h * 0.35} rx={w * 0.42} ry={h * 0.28} fill="#fff8d8" opacity={0.35} />
    </g>
  )
}

function Win({ x, y, w = 3, h = 3 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#dff4ff" stroke={INK} strokeWidth={0.8} rx={0.4} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={INK} strokeWidth={0.5} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={INK} strokeWidth={0.5} />
    </g>
  )
}

function Door({ x, y, w = 5, h = 8 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <rect x={x} y={y} width={w} height={h} fill="#6a5040" stroke={INK} strokeWidth={0.9} rx={1} />
  )
}

function Chimney({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="4" height="7" fill="#988878" stroke={INK} strokeWidth={0.8} />
      <ellipse cx={x + 2} cy={y - 2} rx="3" ry="2" fill="#d8d8d8" opacity={0.55} />
    </g>
  )
}

function Cottage({
  x,
  y,
  w = 18,
  h = 12,
  wall = '#f0d8a8',
  roof = 'url(#cp-roof-red)',
}: {
  x: number
  y: number
  w?: number
  h?: number
  wall?: string
  roof?: string
}) {
  const hw = w / 2
  return (
    <g transform={`translate(${x}, ${y})`} filter="url(#cp-soft-shadow)">
      <rect x={-hw} y={0} width={w} height={h} fill={wall} stroke={INK} strokeWidth={1.2} rx={1} />
      <polygon points={`0,${-h * 0.55} ${-hw - 2},0 ${hw + 2},0`} fill={roof} stroke={INK} strokeWidth={1.2} />
      <Win x={-hw + 3} y={3} />
      <Win x={hw - 6} y={3} />
      <Door x={-2.5} y={h - 8} />
    </g>
  )
}

function DetailedPine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} stroke={INK} strokeWidth={1.1} strokeLinejoin="round">
      <ellipse cx="0" cy="6" rx="7" ry="2.8" fill="#1a3820" opacity="0.22" />
      <rect x="-1.8" y="0" width="3.6" height="9" fill="#6a4830" rx="0.8" />
      <line x1="-0.8" y1="2" x2="-0.8" y2="8" stroke="#8a6848" strokeWidth="0.5" opacity={0.6} />
      {(
        [
          [-7, 2, 7, 2, 0, -11],
          [-5.5, 5, 5.5, 5, 0, -5],
          [-4, 8, 4, 8, 0, 0],
        ] as const
      ).map((pts, i) => (
        <polygon
          key={i}
          points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
          fill={['#2a6030', '#357a3a', '#459848'][i]}
        />
      ))}
      <path d="M -2 -6 L 0 -8 L 1 -5" fill="#6aaa58" stroke="none" opacity={0.45} />
    </g>
  )
}

function DetailedOak({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} stroke={INK} strokeWidth={1.1}>
      <ellipse cx="0" cy="8" rx="9" ry="3" fill="#1a3018" opacity={0.18} />
      <path d="M -2 8 Q -3 2 -2 -4 Q 0 -6 2 -4 Q 3 2 2 8" fill="#7a5038" />
      <circle cx="0" cy="-11" r="11" fill="#5a9838" />
      <circle cx="-7" cy="-9" r="8" fill="#6aaa48" />
      <circle cx="7" cy="-9" r="8" fill="#4a8830" />
      <circle cx="-3" cy="-14" r="6" fill="#7ec850" opacity={0.7} />
      <path d="M -4 -12 Q 0 -16 4 -12" fill="none" stroke="#8ed868" strokeWidth="1" opacity={0.5} />
    </g>
  )
}

function ForestCluster({
  cx,
  cy,
  count = 10,
  spread = 30,
  variant = 'pine',
}: {
  cx: number
  cy: number
  count?: number
  spread?: number
  variant?: 'pine' | 'dark'
}) {
  const base = variant === 'dark' ? '#243028' : '#2a5830'
  const Tree = variant === 'dark' ? DarkTwistedTree : DetailedPine
  return (
    <g>
      <ellipse cx={cx} cy={cy + 8} rx={spread * 1.15} ry={spread * 0.58} fill={base} opacity={0.42} stroke={INK} strokeWidth={1.2} />
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.2
        const r = spread * (0.38 + (i % 4) * 0.16)
        return (
          <Tree
            key={i}
            x={cx + Math.cos(a) * r}
            y={cy + Math.sin(a) * r * 0.62}
            s={0.75 + (i % 5) * 0.12}
          />
        )
      })}
      {/* 林下灌木 */}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={cx - spread * 0.4 + i * spread * 0.4}
          cy={cy + spread * 0.35}
          rx="7"
          ry="4"
          fill={variant === 'dark' ? '#3a3848' : '#4a8840'}
          stroke={INK}
          strokeWidth={0.8}
          opacity={0.75}
        />
      ))}
    </g>
  )
}

function DarkTwistedTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} stroke={INK} strokeWidth={1}>
      <path d="M 0 10 Q -2 4 -4 -2 Q -2 -8 2 -10 Q 5 -6 3 0 Q 1 6 0 10" fill="#3a2850" />
      <circle cx="-4" cy="-8" r="6" fill="#4a3860" />
      <circle cx="3" cy="-10" r="5" fill="#3a2850" />
      <circle cx="0" cy="-4" r="3.5" fill="#6858a0" opacity={0.35} />
    </g>
  )
}

function GrassDecor() {
  const dots = [
    [120, 620], [280, 640], [450, 660], [680, 630], [850, 650],
    [160, 380], [880, 380], [340, 260], [700, 280], [520, 480],
  ]
  const flowers: [number, number, string][] = [
    [200, 600, '#ff8888'], [420, 640, '#ffcc44'], [760, 610, '#ff99cc'],
    [310, 420, '#ffffff'], [640, 350, '#ffaa66'],
  ]
  return (
    <g opacity={0.85}>
      {dots.map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <path d="M 0 0 Q -2 -5 0 -8 Q 2 -5 0 0" fill="#5a9848" stroke={INK} strokeWidth={0.6} />
        </g>
      ))}
      {flowers.map(([x, y, c], i) => (
        <g key={`f${i}`} transform={`translate(${x}, ${y})`}>
          <circle r="2.5" fill={c} stroke={INK} strokeWidth={0.6} />
          <circle r="1" cy="-3" fill="#5a9848" />
        </g>
      ))}
    </g>
  )
}

function Clouds() {
  const clouds = [
    [180, 90, 0.9], [420, 70, 1.1], [680, 85, 0.85], [860, 100, 0.75],
  ]
  return (
    <g opacity={0.55}>
      {clouds.map(([cx, cy, s], i) => (
        <g key={i} transform={`translate(${cx}, ${cy}) scale(${s})`}>
          <ellipse cx="0" cy="0" rx="28" ry="12" fill="#fff" stroke={INK} strokeWidth={1} />
          <ellipse cx="-18" cy="4" rx="16" ry="10" fill="#fff" stroke={INK} strokeWidth={0.9} />
          <ellipse cx="18" cy="3" rx="18" ry="11" fill="#fff" stroke={INK} strokeWidth={0.9} />
        </g>
      ))}
    </g>
  )
}

function SnowMountains() {
  const peaks: [number, number, number][] = [
    [60, 58, 100], [190, 48, 120], [350, 42, 140], [520, 46, 115], [700, 50, 105], [860, 55, 90],
  ]
  return (
    <g>
      {peaks.map(([cx, cy, w], i) => (
        <g key={i}>
          <polygon
            points={`${cx - w * 0.55},${cy + 34} ${cx - w * 0.08},${cy + 8} ${cx},${cy - 38} ${cx + w * 0.12},${cy + 6} ${cx + w * 0.55},${cy + 34}`}
            fill="#b8c8d8"
            stroke={INK}
            strokeWidth={1.4}
            opacity={0.55}
          />
          <polygon
            points={`${cx - w * 0.28},${cy + 34} ${cx},${cy - 38} ${cx + w * 0.28},${cy + 34}`}
            fill="url(#cp-snow)"
            stroke={INK}
            strokeWidth={1.5}
          />
          <polygon points={`${cx - 6},${cy - 20} ${cx},${cy - 38} ${cx + 5},${cy - 18}`} fill="#fff" opacity={0.85} stroke="none" />
        </g>
      ))}
    </g>
  )
}

function RiverSystem() {
  const main = 'M 100 72 C 180 130 260 210 340 285 C 420 360 470 430 500 490 C 530 550 520 610 480 660'
  return (
    <g>
      {/* 河岸 */}
      <path d={main} fill="none" stroke="#4a7848" strokeWidth={30} strokeLinecap="round" opacity={0.35} />
      <path d={main} fill="none" stroke="url(#cp-water-deep)" strokeWidth={24} strokeLinecap="round" />
      <path d={main} fill="none" stroke="url(#cp-water-shallow)" strokeWidth={16} strokeLinecap="round" opacity={0.85} />
      <path d={main} fill="none" stroke="#b8ecff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      {/* 波纹 */}
      {[180, 260, 340, 420, 500].map((_, i) => (
        <path
          key={i}
          d={`M ${300 + i * 18} ${200 + i * 55} q 10 4 20 0 q 10 -4 20 0`}
          fill="none"
          stroke="#e8f8ff"
          strokeWidth={1.2}
          opacity={0.65}
        />
      ))}
      {/* 南岸海域 */}
      <path d="M 22 620 Q 200 640 480 660 Q 760 670 978 640 L 978 678 L 22 678 Z" fill="url(#cp-water-shallow)" opacity={0.55} stroke={INK} strokeWidth={1.2} />
      {[280, 420, 580, 740].map((x, i) => (
        <path key={i} d={`M ${x} 648 q 12 3 24 0`} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.45} />
      ))}
    </g>
  )
}

function BoardFrame({ overlay = false }: { overlay?: boolean }) {
  const corners: [number, number][] = [
    [36, 36], [964, 36], [36, 664], [964, 664],
  ]
  if (overlay) {
    return (
      <g pointerEvents="none" opacity={0.85}>
        <rect x="10" y="10" width="980" height="680" rx="18" fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
        {corners.map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx}, ${cy})`}>
            <circle r="12" fill="url(#cp-tile-base)" stroke={INK} strokeWidth={1.8} opacity={0.9} />
            <circle r="7" fill="#ffd966" stroke={INK} strokeWidth={1} />
          </g>
        ))}
      </g>
    )
  }
  return (
    <g>
      <rect x="8" y="8" width="984" height="684" rx="22" fill="#fff4dc" stroke={INK} strokeWidth={3.5} />
      <rect x="18" y="18" width="964" height="664" rx="16" fill="none" stroke="#e8c878" strokeWidth={2} />
      {corners.map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx}, ${cy})`}>
          <circle r="14" fill="url(#cp-tile-base)" stroke={INK} strokeWidth={2.2} />
          <circle r="9" fill="#ffd966" stroke={INK} strokeWidth={1.2} />
          <path d="M 0 -5 L 1.5 1 L -1.5 1 Z" fill={INK} stroke="none" transform="scale(1.4)" />
          <path
            d="M -18 0 Q 0 -18 18 0 Q 0 18 -18 0"
            fill="none"
            stroke="#e8c878"
            strokeWidth={1.5}
            opacity={0.6}
            transform={`rotate(${i * 90})`}
          />
        </g>
      ))}
    </g>
  )
}

/* ─── 地标 ─── */

function PortHarbor({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y} sw={1.2}>
      <TileBase w={72} />
      <g transform="translate(0, -4)" filter="url(#cp-soft-shadow)">
        {/* 码头 */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={-48 + i * 10} y={6} width="9" height="3" fill="url(#cp-wood)" stroke={INK} strokeWidth={0.7} />
        ))}
        <rect x="-50" y={9} width="58" height="5" fill="#a87848" stroke={INK} strokeWidth={1.2} rx={1} />
        <line x1="-50" y1="14" x2="-50" y2="22" stroke={INK} strokeWidth={1.8} />
        <line x1="8" y1="14" x2="8" y2="22" stroke={INK} strokeWidth={1.8} />
        {/* 灯塔 */}
        <g transform="translate(38, -8)">
          <rect x="-5" y="0" width="10" height="22" fill="#f0ece4" stroke={INK} strokeWidth={1.2} />
          <rect x="-6" y="-6" width="12" height="8" fill="#ffcc44" stroke={INK} strokeWidth={1} />
          <circle cx="0" cy="-2" r="3" fill="#fff8cc" opacity={0.8} stroke="none" />
          <polygon points="0,-14 7,-6 -7,-6" fill="#e85a5a" stroke={INK} strokeWidth={1} />
        </g>
        {/* 帐篷 */}
        {(
          [
            [-22, '#e85a5a', -1],
            [0, '#4a90d9', 0],
            [20, '#ffd966', 1],
          ] as const
        ).map(([tx, col, flip]) => (
          <g key={tx} transform={`translate(${tx}, -2) scale(${flip || 1}, 1)`}>
            <polygon points="-10,8 -18,-8 2,-8" fill={col} stroke={INK} strokeWidth={1.1} />
            <line x1="-8" y1="-8" x2="-8" y2="8" stroke={INK} strokeWidth={0.8} opacity={0.4} />
            <rect x="-12" y="8" width="16" height="2" fill="#8a6848" stroke={INK} strokeWidth={0.6} />
          </g>
        ))}
        {/* 营火 */}
        <circle cx="0" cy="6" r="7" fill="#3a2818" opacity={0.3} stroke="none" />
        <circle cx="0" cy="5" r="5" fill="#ff6622" stroke={INK} strokeWidth={0.8} />
        <path d="M -4 2 Q 0 -8 4 2 Q 0 0 -4 2" fill="#ffcc44" stroke="none" />
        <path d="M -2 3 Q 0 -4 2 3" fill="#ffe888" stroke="none" opacity={0.8} />
        {/* 木桶 */}
        <ellipse cx="-32" cy="10" rx="5" ry="4" fill="#a87848" stroke={INK} strokeWidth={0.9} />
        <line x1="-37" y1="10" x2="-27" y2="10" stroke={INK} strokeWidth={0.7} />
        {/* 帆船 */}
        <SailBoat x={52} y={0} scale={1} />
        <SailBoat x={-58} y={6} scale={0.75} sail="#ffe8cc" />
      </g>
    </G>
  )
}

function SailBoat({ x, y, scale = 1, sail = '#f8f8f8' }: { x: number; y: number; scale?: number; sail?: string }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} stroke={INK} strokeWidth={1.1}>
      <path d="M -10 12 Q 0 16 10 12 L 8 12 L 0 4 L -8 12 Z" fill="url(#cp-wood)" />
      <line x1="0" y1="4" x2="0" y2="-14" stroke={INK} strokeWidth={1.5} />
      <polygon points="0,-14 16,-4 0,2" fill={sail} />
      <line x1="0" y1="-14" x2="16" y2="-4" stroke={INK} strokeWidth={0.7} />
      <path d="M -12 12 Q 0 15 12 12" fill="none" stroke="#4a90c8" strokeWidth={1.5} opacity={0.5} />
    </g>
  )
}

function OakGrove({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={58} color="#c8e898" />
      <g transform="translate(0, -6)">
        <DetailedOak x={-20} y={0} s={1.05} />
        <DetailedOak x={0} y={-4} s={1.25} />
        <DetailedOak x={20} y={0} s={1} />
        <rect x="-28" y="10" width="56" height="3" fill="#8a6848" stroke={INK} strokeWidth={0.8} rx={1} opacity={0.6} />
      </g>
    </G>
  )
}

function BorderVillage({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={68} />
      <g transform="translate(0, -2)" filter="url(#cp-soft-shadow)">
        {/* 农田 */}
        {([0, 1, 2] as const).map((i) => (
          <rect
            key={i}
            x={-52 + i * 24}
            y={14}
            width="20"
            height="16"
            fill={['#a8d858', '#98c848', '#b8e868'][i]}
            stroke={INK}
            strokeWidth={1}
            rx={2}
          />
        ))}
        <rect x={-52} y={14} width="68" height="16" fill="url(#cp-farm-row)" opacity={0.5} />
        {/* 栅栏 */}
        <line x1="-48" y1="12" x2="20" y2="12" stroke="#c4a878" strokeWidth={2} />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={-46 + i * 8} y1="8" x2={-46 + i * 8} y2="16" stroke={INK} strokeWidth={1} />
        ))}
        {/* 风车 */}
        <g transform="translate(42, 8)">
          <rect x="-3" y="0" width="6" height="20" fill="#d4b888" stroke={INK} strokeWidth={1.1} />
          <circle cx="0" cy="0" r="3" fill="#988868" stroke={INK} strokeWidth={0.8} />
          {[0, 72, 144, 216, 288].map((deg) => (
            <line key={deg} x1="0" y1="0" x2="0" y2="-16" stroke={INK} strokeWidth={1.3} transform={`rotate(${deg})`} />
          ))}
          <ellipse cx="0" cy="-16" rx="2" ry="4" fill="#f0ece0" stroke={INK} strokeWidth={0.6} transform="rotate(0)" />
        </g>
        {/* 水井 */}
        <g transform="translate(-38, 6)">
          <ellipse cx="0" cy="6" rx="7" ry="3" fill="#888" stroke={INK} strokeWidth={0.9} />
          <rect x="-5" y="-2" width="10" height="8" fill="#b8b8b8" stroke={INK} strokeWidth={0.9} rx={1} />
          <path d="M -6 -2 Q 0 -8 6 -2" fill="none" stroke="#a87848" strokeWidth={1.5} />
        </g>
        <Cottage x={-18} y={-2} w={16} h={11} wall="#f0d8a8" />
        <Cottage x={2} y={-4} w={18} h={12} wall="#e8c898" roof="url(#cp-roof-blue)" />
        <Cottage x={22} y={-1} w={15} h={10} wall="#dcc898" />
        <Chimney x={-12} y={-8} />
        <Chimney x={8} y={-10} />
      </g>
    </G>
  )
}

function CreekBridge({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={56} color="#b8dce8" />
      <ellipse cx="0" cy="12" rx="46" ry="14" fill="url(#cp-water-shallow)" opacity={0.65} stroke={INK} strokeWidth={1} />
      <g filter="url(#cp-soft-shadow)">
        <rect x="-26" y="-2" width="52" height="7" fill="url(#cp-wood)" stroke={INK} strokeWidth={1.2} rx={2} />
        {([-20, -8, 4, 16] as const).map((px) => (
          <g key={px}>
            <line x1={px} y1="5" x2={px} y2="14" stroke={INK} strokeWidth={1.5} />
            <rect x={px - 1.5} y="4" width="3" height="2" fill="#988868" stroke="none" />
          </g>
        ))}
        <path d="M -26 -2 Q 0 -8 26 -2" fill="none" stroke="#c49a6c" strokeWidth={1.5} />
        {/* 芦苇 */}
        {([-18, -6, 10, 22] as const).map((rx) => (
          <g key={rx} transform={`translate(${rx}, 16)`}>
            <line x1="0" y1="0" x2="-1" y2="-12" stroke="#6a9858" strokeWidth={1.2} />
            <ellipse cx="-1" cy="-12" rx="2" ry="4" fill="#8ab868" stroke={INK} strokeWidth={0.5} />
          </g>
        ))}
      </g>
    </G>
  )
}

function StoneSteps({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={48} color="#d8c898" />
      <ellipse cx="0" cy="18" rx="34" ry="14" fill="#8a9868" opacity={0.35} stroke={INK} strokeWidth={1} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x={-22 + i * 2.5}
            y={-10 + i * 6}
            width={44 - i * 5}
            height="5.5"
            fill="url(#cp-stone)"
            stroke={INK}
            strokeWidth={1}
            rx={1}
          />
          <line x1={-18 + i * 2.5} y1={-10 + i * 6 + 2.5} x2={18 - i * 2.5} y2={-10 + i * 6 + 2.5} stroke="#fff" strokeWidth={0.5} opacity={0.35} />
        </g>
      ))}
      <line x1="-28" y1="-6" x2="-28" y2="14" stroke="#988878" strokeWidth={2} />
      <circle cx="-28" cy="-8" r="2" fill="#888" stroke={INK} strokeWidth={0.6} />
    </G>
  )
}

function ForkCamp({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={64} />
      <g filter="url(#cp-soft-shadow)">
        {(
          [
            [-24, '#e85a5a'],
            [0, '#4a90d9'],
            [24, '#ffd966'],
          ] as const
        ).map(([tx, col]) => (
          <g key={tx} transform={`translate(${tx}, -4)`}>
            <polygon points="-11,10 -20,-8 2,-8" fill={col} stroke={INK} strokeWidth={1.2} />
            <rect x="-14" y="10" width="18" height="2.5" fill="#8a6848" stroke={INK} strokeWidth={0.7} />
          </g>
        ))}
        <circle cx="0" cy="8" r="8" fill="#3a2818" opacity={0.25} stroke="none" />
        <circle cx="0" cy="7" r="6" fill="#ff6622" stroke={INK} strokeWidth={1} />
        <path d="M -5 3 Q 0 -9 5 3 Q 0 -1 -5 3" fill="#ffcc44" stroke="none" />
        {/* 路标 */}
        <g transform="translate(36, -6)">
          <rect x="-3" y="0" width="6" height="22" fill="url(#cp-wood)" stroke={INK} strokeWidth={1.1} />
          <polygon points="0,-8 -10,0 10,0" fill="#ffd966" stroke={INK} strokeWidth={1.2} />
          <line x1="-6" y1="-2" x2="6" y2="-2" stroke={INK} strokeWidth={0.8} />
          <line x1="-4" y1="2" x2="4" y2="2" stroke={INK} strokeWidth={0.8} />
        </g>
        {/* 补给箱 */}
        <rect x="-38" y="4" width="12" height="8" fill="#a87848" stroke={INK} strokeWidth={1} rx={1} />
        <line x1="-38" y1="8" x2="-26" y2="8" stroke={INK} strokeWidth={0.8} />
      </g>
    </G>
  )
}

function WindPlateau({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={54} color="#f0c8a8" />
      <ellipse cx="0" cy="12" rx="40" ry="16" fill="#e8956a" opacity={0.5} stroke={INK} strokeWidth={1.2} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-32 + i * 3} y={-6 - i * 5} width={64 - i * 7} height="4.5" fill={['#d87858', '#c86848', '#b85838', '#a84828'][i]} stroke={INK} strokeWidth={0.8} rx={1} />
      ))}
      <g transform="translate(10, -22)">
        <line x1="0" y1="10" x2="0" y2="-4" stroke="#7a5038" strokeWidth={2.5} />
        <circle cx="0" cy="-8" r="9" fill="#5a8840" stroke={INK} strokeWidth={1.1} />
        <circle cx="-5" cy="-6" r="5" fill="#6a9850" opacity={0.7} stroke="none" />
        <path d="M -14 4 Q -8 -4 0 0" fill="none" stroke="#988878" strokeWidth={1} opacity={0.5} />
      </g>
    </G>
  )
}

function EchoValley({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={70} color="#c8c0d8" />
      <ellipse cx="0" cy="10" rx="54" ry="30" fill="#7a7888" opacity={0.35} stroke={INK} strokeWidth={1.2} />
      <path d="M -44 14 Q -12 -22 0 -16 Q 12 -22 44 14" fill="#9a98a8" stroke={INK} strokeWidth={1.3} opacity={0.65} />
      <ellipse cx="0" cy="16" rx="26" ry="11" fill="url(#cp-water-shallow)" opacity={0.55} stroke={INK} strokeWidth={1} />
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx={-22 + i * 15}
          cy={-8 + (i % 2) * 3}
          rx="20"
          ry="9"
          fill="#d8c8f0"
          opacity={0.45}
          filter="url(#cp-glow-mist)"
        />
      ))}
      {/* 影堡 */}
      <g transform="translate(32, -22) scale(1.05)" filter="url(#cp-soft-shadow)">
        <rect x="-14" y="0" width="28" height="22" fill="#4a3868" stroke={INK} strokeWidth={1.3} rx={2} />
        <rect x="-10" y="-12" width="20" height="14" fill="#5a4878" stroke={INK} strokeWidth={1.1} />
        <polygon points="0,-22 11,-12 -11,-12" fill="#3a2858" stroke={INK} strokeWidth={1.2} />
        <Door x={-3} y={10} w={6} h={10} />
        <Win x={-8} y={-6} w={4} h={4} />
        <Win x={4} y={-6} w={4} h={4} />
        <circle cx="0" cy="-2" r="5" fill="#a878d8" opacity={0.65} stroke={INK} strokeWidth={0.8} filter="url(#cp-glow-mist)" />
      </g>
    </G>
  )
}

function EchoCliff({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={58} color="#d8c8b8" />
      <polygon points="-34,22 -34,-22 22,-12 22,22" fill="#b8a898" stroke={INK} strokeWidth={1.4} />
      <polygon points="22,22 22,-12 46,-6 46,22" fill="#a89888" stroke={INK} strokeWidth={1.3} />
      <line x1="-20" y1="-10" x2="-18" y2="18" stroke="#988878" strokeWidth={0.8} opacity={0.5} />
      <line x1="8" y1="-8" x2="10" y2="18" stroke="#887868" strokeWidth={0.8} opacity={0.5} />
      <ellipse cx="6" cy="-2" rx="12" ry="16" fill="#6a6878" opacity={0.45} stroke={INK} strokeWidth={1.2} />
      <ellipse cx="6" cy="-2" rx="7" ry="11" fill="#3a3848" opacity={0.35} stroke="none" />
      <path d="M 0 -8 Q 6 -14 12 -6" fill="none" stroke="#d8d0c8" strokeWidth={1} opacity={0.6} />
    </G>
  )
}

function WhisperForestEdge({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={60} color="#98c888" />
      <path d="M -44 18 Q -22 -10 0 6 Q 22 -14 44 10" fill="none" stroke="#2d5a30" strokeWidth={10} strokeLinecap="round" opacity={0.35} />
      {([-28, -12, 4, 20, 36] as const).map((tx, i) => (
        <DetailedPine key={tx} x={tx} y={i % 2 === 0 ? 2 : -2} s={0.95 + (i % 3) * 0.1} />
      ))}
    </G>
  )
}

function RiversideHamlet({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={62} color="#b8d8e8" />
      <ellipse cx="0" cy="16" rx="44" ry="12" fill="url(#cp-water-shallow)" opacity={0.6} stroke={INK} strokeWidth={1} />
      <g filter="url(#cp-soft-shadow)">
        <Cottage x={-22} y={-2} w={16} h={11} wall="#d8e8f0" roof="url(#cp-roof-blue)" />
        <Cottage x={0} y={-6} w={18} h={13} wall="#e8e8f0" roof="url(#cp-roof-blue)" />
        <Cottage x={22} y={0} w={15} h={10} wall="#c8d8e8" roof="url(#cp-roof-blue)" />
        <rect x="-42" y="8" width="24" height="5" fill="url(#cp-wood)" stroke={INK} strokeWidth={1.1} />
        <line x1="-42" y1="13" x2="-42" y2="18" stroke={INK} strokeWidth={1.5} />
        <ellipse cx="-48" cy="14" rx="12" ry="5" fill="#a87858" stroke={INK} strokeWidth={1} />
        <line x1="-48" y1="10" x2="-48" y2="6" stroke={INK} strokeWidth={1} />
      </g>
    </G>
  )
}

function MistTrail({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={54} color="#b8b0c8" />
      <ForestCluster cx={0} cy={6} count={7} spread={24} />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={-16 + i * 11} cy={-10} rx="16" ry="7" fill="#d0c0e8" opacity={0.5} filter="url(#cp-glow-mist)" />
      ))}
    </G>
  )
}

function RidgeMerge({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={50} />
      <g filter="url(#cp-soft-shadow)">
        <rect x="-10" y="0" width="20" height="12" fill="url(#cp-wood)" stroke={INK} strokeWidth={1.2} rx={2} />
        <line x1="-10" y1="5" x2="-10" y2="12" stroke={INK} strokeWidth={1.3} />
        <line x1="10" y1="5" x2="10" y2="12" stroke={INK} strokeWidth={1.3} />
        <rect x="-14" y="-6" width="8" height="6" fill="#a87848" stroke={INK} strokeWidth={0.9} rx={1} />
        <rect x="6" y="-4" width="8" height="6" fill="#a87848" stroke={INK} strokeWidth={0.9} rx={1} />
        <line x1="-10" y1="-6" x2="-10" y2="0" stroke={INK} strokeWidth={0.8} />
      </g>
    </G>
  )
}

function CliffWalkway({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={56} color="#a8b8c8" />
      <polygon points="-34,22 -34,-12 34,-6 34,22" fill="#788898" opacity={0.4} stroke={INK} strokeWidth={1.2} />
      <path d="M -22 10 L -10 -2 L 0 4 L 12 -6 L 24 0" fill="none" stroke="url(#cp-wood)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      {([-22, -10, 0, 12, 24] as const).map((px, i) => {
        const ys = [10, -2, 4, -6, 0]
        return <line key={px} x1={px} y1={ys[i]} x2={px} y2="18" stroke={INK} strokeWidth={1.3} />
      })}
      <line x1="-30" y1="0" x2="-30" y2="20" stroke="#687888" strokeWidth={2} />
      <line x1="30" y1="-4" x2="30" y2="20" stroke="#687888" strokeWidth={2} />
    </G>
  )
}

function MistPass({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={58} color="#b8c0b8" />
      <polygon points="-20,26 -32,-22 0,-32 32,-22 20,26" fill="#9aa898" stroke={INK} strokeWidth={1.4} opacity={0.65} />
      <polygon points="-10,26 -18,-10 0,-18 18,-10 10,26" fill="#7a8878" opacity={0.4} stroke={INK} strokeWidth={1.1} />
      <ellipse cx="0" cy="4" rx="14" ry="22" fill="#c8b8e0" opacity={0.4} filter="url(#cp-glow-mist)" />
      <g transform="translate(0, -20)" filter="url(#cp-soft-shadow)">
        <rect x="-14" y="0" width="28" height="18" fill="#b8a898" stroke={INK} strokeWidth={1.2} rx={1} />
        <rect x="-10" y="-10" width="20" height="12" fill="#988878" stroke={INK} strokeWidth={1.1} />
        <rect x="-4" y="-14" width="8" height="6" fill="#887868" stroke={INK} strokeWidth={0.9} />
        <Door x={-3} y={6} />
        <Win x={-8} y={-4} w={4} h={4} />
        <Win x={4} y={-4} w={4} h={4} />
      </g>
    </G>
  )
}

function OutpostTower({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <TileBase w={44} color="#e8b898" />
      <g filter="url(#cp-soft-shadow)">
        <ellipse cx="0" cy="20" rx="18" ry="6" fill="#1a1810" opacity={0.12} stroke="none" />
        <rect x="-12" y="-6" width="24" height="28" fill="#c87858" stroke={INK} strokeWidth={1.4} rx={2} />
        <rect x="-14" y="-14" width="28" height="10" fill="#a85838" stroke={INK} strokeWidth={1.3} rx={2} />
        <line x1="-8" y1="-14" x2="-8" y2="22" stroke="#985838" strokeWidth={0.6} opacity={0.4} />
        <line x1="8" y1="-14" x2="8" y2="22" stroke="#985838" strokeWidth={0.6} opacity={0.4} />
        {[0, 8, 16].map((dy) => (
          <Win key={dy} x={-4} y={dy - 2} w={4} h={4} />
        ))}
        <line x1="0" y1="-14" x2="0" y2="-32" stroke={INK} strokeWidth={1.8} />
        <polygon points="0,-32 12,-20 -12,-20" fill="#e85a5a" stroke={INK} strokeWidth={1.3} />
        <line x1="-12" y1="-20" x2="12" y2="-20" stroke="#fff" strokeWidth={0.8} opacity={0.4} />
        {/* 拒马 */}
        <line x1="-20" y1="14" x2="-14" y2="8" stroke="#8a6848" strokeWidth={2} />
        <line x1="-17" y1="14" x2="-11" y2="8" stroke="#8a6848" strokeWidth={2} />
      </g>
    </G>
  )
}

function MistPalace({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y} s={1.35}>
      <TileBase w={80} color="#d8e8f8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx={-36 + i * 18}
          cy={22}
          rx="24"
          ry="11"
          fill="#e0f0ff"
          opacity={0.55}
          filter="url(#cp-glow-mist)"
        />
      ))}
      <g filter="url(#cp-soft-shadow)">
        <ellipse cx="0" cy="40" rx="54" ry="10" fill="none" stroke="url(#cp-water-shallow)" strokeWidth={5} opacity={0.7} />
        <rect x="-8" y="28" width="16" height="10" fill="#6a6058" stroke={INK} strokeWidth={1.2} rx={1} />
        <rect x="-36" y="10" width="72" height="30" fill="#f0f0f0" stroke={INK} strokeWidth={1.5} rx={3} />
        <rect x="-20" y="-4" width="40" height="18" fill="#e8e8e8" stroke={INK} strokeWidth={1.3} rx={2} />
        {([-44, 44] as const).map((tx) => (
          <g key={tx} transform={`translate(${tx}, 6)`}>
            <rect x="-10" y="-8" width="20" height="32" fill="#ececec" stroke={INK} strokeWidth={1.3} rx={1} />
            <polygon points="0,-20 11,-8 -11,-8" fill="url(#cp-roof-blue)" stroke={INK} strokeWidth={1.2} />
            {[0, 10, 20].map((dy) => (
              <Win key={dy} x={-3} y={dy - 4} w={3.5} h={3.5} />
            ))}
          </g>
        ))}
        <polygon points="0,-26 13,-10 -13,-10" fill="url(#cp-roof-blue)" stroke={INK} strokeWidth={1.4} />
        <rect x="-5" y="-10" width="10" height="8" fill="#5898d8" stroke={INK} strokeWidth={0.9} />
        {/* 城垛 */}
        {([-30, -20, -10, 0, 10, 20, 30] as const).map((bx) => (
          <rect key={bx} x={bx - 3} y="6" width="6" height="5" fill="#e0e0e0" stroke={INK} strokeWidth={0.8} />
        ))}
        {/* 吊桥 */}
        <rect x="-14" y="28" width="28" height="4" fill="url(#cp-wood)" stroke={INK} strokeWidth={1} />
        {([-10, -4, 2, 8] as const).map((bx) => (
          <line key={bx} x1={bx} y1="28" x2={bx} y2="32" stroke={INK} strokeWidth={0.8} />
        ))}
      </g>
    </G>
  )
}

function LakeFortress() {
  return (
    <G x={730} y={340}>
      <ellipse cx="0" cy="22" rx="56" ry="18" fill="url(#cp-water-shallow)" opacity={0.55} stroke={INK} strokeWidth={1.2} />
      <g filter="url(#cp-soft-shadow)">
        <rect x="-26" y="-2" width="52" height="26" fill="#b8b8c8" stroke={INK} strokeWidth={1.4} rx={2} />
        <rect x="-14" y="-18" width="28" height="18" fill="#a8a8b8" stroke={INK} strokeWidth={1.3} />
        <polygon points="0,-32 10,-18 -10,-18" fill="#787888" stroke={INK} strokeWidth={1.2} />
        <rect x="-32" y="6" width="14" height="16" fill="#9898a8" stroke={INK} strokeWidth={1.1} />
        <rect x="18" y="6" width="14" height="16" fill="#9898a8" stroke={INK} strokeWidth={1.1} />
        <Win x={-8} y={-10} w={4} h={5} />
        <Win x={4} y={-10} w={4} h={5} />
        <Door x={-3} y={8} />
      </g>
    </G>
  )
}

function WaterfallPond() {
  return (
    <G x={140} y={160}>
      <polygon points="-24,34 -24,-24 24,-14 24,34" fill="#9aa898" stroke={INK} strokeWidth={1.3} opacity={0.55} />
      <rect x="-5" y="-24" width="10" height="36" fill="#dff4ff" opacity={0.75} stroke={INK} strokeWidth={0.8} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={-3 + i * 1.5} y1="-20" x2={-3 + i * 1.5} y2="10" stroke="#b8ecff" strokeWidth={0.6} opacity={0.6} />
      ))}
      <ellipse cx="0" cy="36" rx="32" ry="14" fill="url(#cp-water-shallow)" opacity={0.6} stroke={INK} strokeWidth={1.2} />
      <path d="M -20 36 q 10 4 20 0 q 10 -4 20 0" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.45} />
    </G>
  )
}

function DarkForestZone() {
  return (
    <g>
      <ellipse cx={820} cy={520} rx={130} ry={88} fill="#1a1828" opacity={0.28} />
      <ForestCluster cx={820} cy={510} count={8} spread={38} variant="dark" />
      <g transform="translate(860, 480)" filter="url(#cp-soft-shadow)">
        <rect x="-10" y="0" width="20" height="24" fill="#3a2850" stroke={INK} strokeWidth={1.3} />
        <polygon points="0,-16 10,0 -10,0" fill="#4a3868" stroke={INK} strokeWidth={1.2} />
        <circle cx="0" cy="4" r="4" fill="#8868b8" opacity={0.6} filter="url(#cp-glow-mist)" />
      </g>
    </g>
  )
}

function LandmarkForNode(node: BattleMapNode) {
  const { x, y } = pct(node.x, node.y)
  switch (node.id) {
    case 'start':
      return <PortHarbor x={x} y={y} />
    case 'wp-oak':
      return <OakGrove x={x} y={y} />
    case 'recruit-1':
      return <BorderVillage x={x} y={y} />
    case 'wp-creek':
      return <CreekBridge x={x} y={y} />
    case 'wp-hill':
      return <StoneSteps x={x} y={y} />
    case 'fork-1':
      return <ForkCamp x={x} y={y} />
    case 'wp-wind':
      return <WindPlateau x={x} y={y} />
    case 'review-1':
      return <EchoValley x={x} y={y} />
    case 'wp-echo':
      return <EchoCliff x={x} y={y} />
    case 'wp-whisper':
      return <WhisperForestEdge x={x} y={y} />
    case 'recruit-2':
      return <RiversideHamlet x={x} y={y} />
    case 'wp-mist-trail':
      return <MistTrail x={x} y={y} />
    case 'merge':
      return <RidgeMerge x={x} y={y} />
    case 'wp-cliff':
      return <CliffWalkway x={x} y={y} />
    case 'review-2':
      return <MistPass x={x} y={y} />
    case 'wp-outpost':
      return <OutpostTower x={x} y={y} />
    case 'boss-1':
      return <MistPalace x={x} y={y} />
    default:
      return null
  }
}

function MapPaths({
  pathD,
  alternatePaths,
}: {
  pathD: string
  alternatePaths?: string[]
}) {
  return (
    <>
      {alternatePaths?.map((alt) => (
        <path key={alt.slice(0, 28)} className="cp-board-path cp-board-path--alt" d={alt} />
      ))}
      <path className="cp-board-path-shadow" d={pathD} />
      <path className="cp-board-path" d={pathD} />
      <path className="cp-board-path-edge" d={pathD} />
      <path className="cp-board-path-dash" d={pathD} />
    </>
  )
}

function CartoonEnvironment({ layout }: { layout: KingdomBattleMapLayout }) {
  return (
    <>
      <rect x="22" y="22" width="956" height="656" fill="url(#cp-bg-grass)" />
      <rect x="22" y="22" width="956" height="656" fill="url(#cp-grass-dot)" opacity={0.55} />

      <ellipse cx="300" cy="580" rx="190" ry="85" fill="#8ed868" opacity={0.28} />
      <ellipse cx="720" cy="420" rx="170" ry="105" fill="#68b040" opacity={0.22} />
      <ellipse cx="200" cy="300" rx="130" ry="75" fill="#88c050" opacity={0.18} />

      <Clouds />
      <SnowMountains />
      <RiverSystem />
      <WaterfallPond />
      <LakeFortress />
      <DarkForestZone />
      <GrassDecor />

      <ForestCluster cx={90} cy={560} count={11} spread={34} />
      <ForestCluster cx={180} cy={440} count={9} spread={28} />
      <ForestCluster cx={620} cy={620} count={8} spread={26} />
      <ForestCluster cx={880} cy={200} count={7} spread={24} />
      <ForestCluster cx={400} cy={200} count={8} spread={26} />

      {Object.values(layout.nodes).map((node) => (
        <g key={`landmark-${node.id}`}>{LandmarkForNode(node)}</g>
      ))}
    </>
  )
}

/** 大富翁 / Richman 风格二维卡通 SVG 地图（精细版） */
export function BoardGameMapScene({
  pathD,
  kingdomName,
  immersive,
  alternatePaths,
  layout,
  backgroundSrc,
}: BoardGameMapSceneProps) {
  const hasBg = Boolean(backgroundSrc)
  const viewW = hasBg ? KINGDOM_MAP_VIEW.w : 1000
  const viewH = hasBg ? KINGDOM_MAP_VIEW.h : 700

  return (
    <svg
      className={[
        'cp-board-map-scene',
        immersive ? 'cp-board-map-scene--immersive' : '',
        hasBg ? 'cp-board-map-scene--with-bg' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio={hasBg && immersive ? 'none' : immersive ? 'xMidYMid slice' : 'xMidYMid meet'}
      aria-hidden="true"
    >
      <MapDefs />

      {hasBg ? (
        <>
          <image
            className="cp-board-map-bg"
            href={backgroundSrc}
            x="0"
            y="0"
            width={viewW}
            height={viewH}
            preserveAspectRatio="none"
          />
          <rect width={viewW} height={viewH} fill="url(#cp-board-bg-vignette)" pointerEvents="none" />
          <BoardFrame overlay />
          <MapPaths pathD={pathD} alternatePaths={alternatePaths} />
        </>
      ) : (
        <>
          <BoardFrame />
          <g clipPath="url(#cp-board-clip)">
            <CartoonEnvironment layout={layout} />
            <MapPaths pathD={pathD} alternatePaths={alternatePaths} />
          </g>
        </>
      )}

      <g transform="translate(500, 54)">
        <rect x="-108" y="-16" width="216" height="32" rx="10" fill="url(#cp-tile-base)" stroke={INK} strokeWidth={2.5} filter="url(#cp-soft-shadow)" />
        <rect x="-100" y="-12" width="200" height="24" rx="7" fill="#ffd966" opacity={0.35} stroke="none" />
        <text y="5" textAnchor="middle" className="cp-board-map-title" fontSize="15">
          {kingdomName}
        </text>
      </g>
    </svg>
  )
}
