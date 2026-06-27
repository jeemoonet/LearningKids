/** 词性星球大陆 · 七王国全景奇幻地图（RPG 风格背景） */
export function ContinentalMapScene() {
  return (
    <svg
      className="cp-fantasy-scene cp-fantasy-scene--continent"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cp-fantasy-grass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6fa848" />
          <stop offset="45%" stopColor="#5a9238" />
          <stop offset="100%" stopColor="#4a7a2e" />
        </linearGradient>
        <linearGradient id="cp-fantasy-clay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d47848" />
          <stop offset="100%" stopColor="#a85530" />
        </linearGradient>
        <linearGradient id="cp-fantasy-river" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a9ec8" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#4a8fc4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#3d7ab0" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="cp-fantasy-hill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7aaa52" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4a6a32" stopOpacity="0" />
        </radialGradient>
        <filter id="cp-fantasy-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* 基底草地 */}
      <rect width="1000" height="700" fill="url(#cp-fantasy-grass)" />

      {/* 红土 / 荒漠区域 */}
      <ellipse cx="500" cy="310" rx="210" ry="120" fill="url(#cp-fantasy-clay)" opacity="0.55" />
      <ellipse cx="820" cy="420" rx="140" ry="90" fill="#c86a3a" opacity="0.35" />
      <ellipse cx="160" cy="520" rx="120" ry="80" fill="#b85a38" opacity="0.3" />

      {/* 丘陵阴影 */}
      <ellipse cx="280" cy="180" rx="160" ry="70" fill="url(#cp-fantasy-hill)" />
      <ellipse cx="720" cy="140" rx="130" ry="60" fill="url(#cp-fantasy-hill)" />

      {/* 主河流 */}
      <path
        d="M 80 620 C 160 580 220 520 280 480 S 380 380 420 340 S 520 260 560 220 S 680 140 720 100 S 820 60 900 80"
        fill="none"
        stroke="url(#cp-fantasy-river)"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M 80 620 C 160 580 220 520 280 480 S 380 380 420 340 S 520 260 560 220 S 680 140 720 100 S 820 60 900 80"
        fill="none"
        stroke="#2a6088"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* 支流 */}
      <path
        d="M 420 340 Q 480 380 520 420 Q 560 460 600 500"
        fill="none"
        stroke="url(#cp-fantasy-river)"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* 森林带 */}
      <PineForest x={40} y={240} cols={5} rows={3} scale={0.9} />
      <PineForest x={720} y={480} cols={4} rows={2} scale={0.85} />
      <PineForest x={120} y={80} cols={3} rows={2} scale={0.7} opacity={0.85} />
      <PineForest x={860} y={180} cols={3} rows={2} scale={0.65} opacity={0.8} />

      {/* 远征路线 */}
      <path
        className="cp-continent-route-shadow"
        d="M 200 532 Q 280 560 420 588 Q 520 520 500 322 Q 480 180 280 140 Q 350 80 580 70"
      />
      <path
        className="cp-continent-route"
        d="M 200 532 Q 280 560 420 588 Q 520 520 500 322 Q 480 180 280 140 Q 350 80 580 70"
      />

      {/* 七国城堡标记（背景装饰） */}
      <FantasyCastle x={200} y={532} variant="white" label="I" />
      <FantasyCastle x={420} y={588} variant="red" label="II" />
      <FantasyCastle x={180} y={350} variant="white" label="III" scale={0.85} />
      <FantasyCastle x={500} y={322} variant="red" label="IV" scale={0.9} />
      <FantasyCastle x={780} y={364} variant="white" label="V" scale={0.88} />
      <FantasyCastle x={280} y={140} variant="red" label="VI" scale={0.82} />
      <FantasyCastle x={580} y={70} variant="white" label="VII" scale={1.05} crown />

      {/* 北境山脉 */}
      <g opacity="0.4" fill="none" stroke="#3a5030" strokeWidth="2">
        <path d="M 60 100 Q 180 40 300 80 Q 420 30 540 70 Q 660 35 780 65 Q 880 40 960 75" />
        <path d="M 100 125 Q 220 75 340 105 Q 460 65 580 100 Q 700 70 820 95" strokeWidth="1.2" />
      </g>

      {/* 遗忘之海 */}
      <path d="M 0 620 Q 200 590 400 610 Q 600 640 800 615 Q 950 595 1000 625 L 1000 700 L 0 700 Z" fill="#4a8fc4" opacity="0.35" />
      <text x="820" y="668" className="cp-fantasy-label" fontSize="11" opacity="0.7">遗忘之海</text>
    </svg>
  )
}

function PineForest({
  x,
  y,
  cols,
  rows,
  scale = 1,
  opacity = 1,
}: {
  x: number
  y: number
  cols: number
  rows: number
  scale?: number
  opacity?: number
}) {
  const trees: Array<{ tx: number; ty: number; h: number }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      trees.push({
        tx: c * 22 + (r % 2) * 11,
        ty: r * 18,
        h: 22 + ((c + r) % 3) * 6,
      })
    }
  }
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      {trees.map((t, i) => (
        <PineTree key={i} x={t.tx} y={t.ty} h={t.h} />
      ))}
    </g>
  )
}

function PineTree({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-1.5" y={h - 4} width="3" height="5" fill="#5c4033" />
      <polygon points={`0,0 ${7},${h * 0.55} ${-7},${h * 0.55}`} fill="#3d6a32" stroke="#2a4828" strokeWidth="0.4" />
      <polygon points={`0,${h * 0.3} ${6},${h * 0.75} ${-6},${h * 0.75}`} fill="#4a7a38" stroke="#2a4828" strokeWidth="0.3" />
    </g>
  )
}

function FantasyCastle({
  x,
  y,
  variant,
  label,
  scale = 1,
  crown = false,
}: {
  x: number
  y: number
  variant: 'white' | 'red'
  label: string
  scale?: number
  crown?: boolean
}) {
  const wall = variant === 'white' ? '#e8e4dc' : '#c87058'
  const roof = '#4a7ab8'
  const trim = variant === 'white' ? '#8a8078' : '#8a4038'
  return (
    <g transform={`translate(${x - 30 * scale}, ${y - 40 * scale}) scale(${scale})`} opacity="0.88">
      <rect x="18" y="28" width="44" height="28" fill={wall} stroke={trim} strokeWidth="1" />
      <rect x="8" y="18" width="16" height="38" fill={wall} stroke={trim} strokeWidth="0.8" />
      <rect x="56" y="18" width="16" height="38" fill={wall} stroke={trim} strokeWidth="0.8" />
      <polygon points="16,18 16,8 24,18" fill={roof} stroke={trim} strokeWidth="0.6" />
      <polygon points="64,18 64,8 72,18" fill={roof} stroke={trim} strokeWidth="0.6" />
      {crown && (
        <polygon points="40,10 46,0 52,10" fill="#f0c040" stroke={trim} strokeWidth="0.5" />
      )}
      <rect x="34" y="38" width="12" height="18" fill="#2a2018" stroke={trim} strokeWidth="0.6" />
      <text x="40" y="68" textAnchor="middle" className="cp-fantasy-label" fontSize="9" opacity="0.65">
        {label}
      </text>
    </g>
  )
}
