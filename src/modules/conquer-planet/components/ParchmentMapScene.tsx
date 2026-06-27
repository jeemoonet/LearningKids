interface ParchmentMapSceneProps {
  pathD: string
  kingdomName: string
  monsterId?: string
  monsterName?: string
  immersive?: boolean
  /** 未选分叉时的备选岔路（虚线） */
  alternatePaths?: string[]
}

/** 古代羊皮纸风格地图插画（纯 SVG，不含交互节点） */
export function ParchmentMapScene({ pathD, kingdomName, monsterName, immersive, alternatePaths }: ParchmentMapSceneProps) {
  return (
    <svg
      className={`cp-parchment-scene${immersive ? ' cp-parchment-scene--immersive' : ''}`}
      viewBox="0 0 1000 700"
      preserveAspectRatio={immersive ? 'xMidYMid slice' : 'xMidYMid meet'}
      aria-hidden="true"
    >
      <defs>
        <filter id="cp-paper-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="8" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="multiply" />
        </filter>

        <radialGradient id="cp-parchment-base" cx="50%" cy="45%" r="68%">
          <stop offset="0%" stopColor="#f0e2c4" />
          <stop offset="55%" stopColor="#dcc9a3" />
          <stop offset="100%" stopColor="#b8956a" />
        </radialGradient>

        <radialGradient id="cp-stain-a" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b6914" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8b6914" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cp-stain-b" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5c3d1e" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#5c3d1e" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="cp-river-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a8f9b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#4a7280" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="cp-forest-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4d6b42" />
          <stop offset="100%" stopColor="#354a2e" />
        </linearGradient>

        <clipPath id="cp-parchment-edge">
          <path d="M 42 28 Q 18 52 32 118 Q 8 210 38 310 Q 14 420 48 520 Q 22 610 58 668 L 942 672 Q 978 580 958 470 Q 992 360 962 250 Q 988 140 948 48 Q 900 18 820 32 Q 720 8 620 24 Q 520 6 420 22 Q 320 10 220 26 Q 120 12 42 28 Z" />
        </clipPath>

        <pattern id="cp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#3d2914" strokeWidth="0.6" opacity="0.25" />
        </pattern>
      </defs>

      {/* 羊皮纸底 */}
      <g clipPath="url(#cp-parchment-edge)" filter="url(#cp-paper-grain)">
        <rect width="1000" height="700" fill="url(#cp-parchment-base)" />
        <ellipse cx="780" cy="560" rx="180" ry="120" fill="url(#cp-stain-a)" />
        <ellipse cx="210" cy="180" rx="140" ry="90" fill="url(#cp-stain-b)" />
        <ellipse cx="520" cy="380" rx="90" ry="60" fill="url(#cp-stain-a)" opacity="0.6" />

        {/* 远山 */}
        <g opacity="0.35" fill="none" stroke="#5c4a38" strokeWidth="1.2">
          <path d="M 60 200 Q 180 120 300 165 Q 420 95 540 150 Q 660 110 780 140 Q 880 100 960 160" />
          <path d="M 80 230 Q 200 170 320 200 Q 440 150 560 190 Q 680 160 800 185 Q 900 155 970 200" />
        </g>

        {/* 左侧森林 */}
        <g className="cp-map-forest" transform="translate(60, 520)">
          <ForestCluster x={0} y={0} scale={1.05} />
          <ForestCluster x={55} y={70} scale={0.9} />
          <ForestCluster x={10} y={140} scale={0.85} />
          <text x="4" y="175" className="cp-map-ink-label" fontSize="11">古橡林</text>
        </g>

        {/* 低语密林 */}
        <g className="cp-map-forest" transform="translate(140, 280)">
          <ForestCluster x={0} y={0} scale={0.95} />
          <ForestCluster x={-50} y={55} scale={0.8} />
          <ForestCluster x={40} y={45} scale={0.75} />
          <text x="-35" y="95" className="cp-map-ink-label" fontSize="10">低语林</text>
        </g>

        {/* 右下森林 */}
        <g className="cp-map-forest" transform="translate(760, 420)">
          <ForestCluster x={0} y={0} scale={0.95} />
          <ForestCluster x={-65} y={55} scale={0.85} />
          <text x="-50" y="88" className="cp-map-ink-label" fontSize="10">侧翼林</text>
        </g>

        {/* 右上幽林 */}
        <g className="cp-map-forest" transform="translate(820, 80)" opacity="0.85">
          <ForestCluster x={0} y={0} scale={0.75} />
          <ForestCluster x={-45} y={55} scale={0.65} />
          <text x="-30" y="88" className="cp-map-ink-sublabel" fontSize="9">迷雾林</text>
        </g>

        {/* 中左小林 */}
        <g className="cp-map-forest" transform="translate(160, 360)" opacity="0.75">
          <ForestCluster x={0} y={0} scale={0.65} />
        </g>

        {/* 溪畔聚落 */}
        <g className="cp-map-village" transform="translate(250, 240)">
          <rect x="30" y="48" width="22" height="18" fill="#c4a574" stroke="#3d2914" strokeWidth="1" />
          <polygon points="41,48 22,48 41,32" fill="#8b5a3c" stroke="#3d2914" strokeWidth="0.8" />
          <rect x="68" y="52" width="26" height="16" fill="#d4b896" stroke="#3d2914" strokeWidth="1" />
          <polygon points="81,52 58,52 81,36" fill="#7a4a32" stroke="#3d2914" strokeWidth="0.8" />
          <line x1="20" y1="70" x2="110" y2="70" stroke="#3d2914" strokeWidth="0.8" opacity="0.5" />
          <text x="22" y="92" className="cp-map-ink-sublabel" fontSize="9">溪畔聚落</text>
        </g>

        {/* 溪流 */}
        <g className="cp-map-stream">
          <path
            d="M 120 80 C 180 120, 220 180, 260 240 S 340 340, 380 400 S 460 520, 520 580 S 620 640, 700 660"
            fill="none"
            stroke="url(#cp-river-grad)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.45"
          />
          <path
            d="M 120 80 C 180 120, 220 180, 260 240 S 340 340, 380 400 S 460 520, 520 580 S 620 640, 700 660"
            fill="none"
            stroke="#2a4a52"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* 溪流标注 */}
          <text x="155" y="115" className="cp-map-ink-label cp-map-ink-label--curved" fontSize="11">
            银雾溪
          </text>
          {/* 木桥 */}
          <g transform="translate(350, 395)">
            <rect x="-18" y="-3" width="36" height="6" fill="#8b6914" stroke="#3d2914" strokeWidth="0.8" rx="1" />
            <line x1="-14" y1="3" x2="-14" y2="10" stroke="#5c4033" strokeWidth="1.2" />
            <line x1="14" y1="3" x2="14" y2="10" stroke="#5c4033" strokeWidth="1.2" />
            <line x1="0" y1="3" x2="0" y2="10" stroke="#5c4033" strokeWidth="1" />
          </g>
        </g>

        {/* 回声山谷 */}
        <g className="cp-map-valley" transform="translate(520, 240)">
          <ellipse cx="80" cy="70" rx="110" ry="55" fill="url(#cp-hatch)" opacity="0.35" />
          <path
            d="M 0 90 Q 40 30 80 20 Q 120 30 160 90 Q 120 110 80 105 Q 40 110 0 90"
            fill="none"
            stroke="#4a3828"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path d="M 20 75 Q 50 45 80 40 Q 110 45 140 75" fill="none" stroke="#5c4838" strokeWidth="1" />
          <path d="M 35 85 Q 60 60 80 55 Q 100 60 125 85" fill="none" stroke="#5c4838" strokeWidth="0.8" />
          {/* 山谷两侧山脊 */}
          <path d="M -15 85 Q 10 40 35 55" fill="none" stroke="#4a3828" strokeWidth="1.2" opacity="0.6" />
          <path d="M 175 85 Q 150 35 125 50" fill="none" stroke="#4a3828" strokeWidth="1.2" opacity="0.6" />
          <text x="48" y="135" className="cp-map-ink-label" fontSize="12">回声山谷</text>
          <text x="58" y="150" className="cp-map-ink-sublabel" fontSize="9">迷雾低语之地</text>
        </g>

        {/* 边境村庄 */}
        <g className="cp-map-village" transform="translate(180, 480)">
          <rect x="30" y="48" width="22" height="18" fill="#c4a574" stroke="#3d2914" strokeWidth="1" />
          <polygon points="41,48 22,48 41,32" fill="#8b5a3c" stroke="#3d2914" strokeWidth="0.8" />
          <rect x="68" y="52" width="26" height="16" fill="#d4b896" stroke="#3d2914" strokeWidth="1" />
          <polygon points="81,52 58,52 81,36" fill="#7a4a32" stroke="#3d2914" strokeWidth="0.8" />
          <rect x="52" y="62" width="18" height="12" fill="#b8956a" stroke="#3d2914" strokeWidth="0.8" />
          <line x1="20" y1="70" x2="110" y2="70" stroke="#3d2914" strokeWidth="0.8" opacity="0.5" />
          <circle cx="95" cy="58" r="3" fill="#c45c3a" opacity="0.7" />
          <text x="18" y="95" className="cp-map-ink-label" fontSize="12">边境村庄</text>
          <text x="28" y="108" className="cp-map-ink-sublabel" fontSize="9">招募义勇处</text>
        </g>

        {/* 迷雾王宫 / 城堡 */}
        <g className="cp-map-castle" transform="translate(420, 18)">
          <rect x="60" y="55" width="140" height="70" fill="#9a8a78" stroke="#3d2914" strokeWidth="1.5" />
          <rect x="85" y="30" width="30" height="50" fill="#8a7a68" stroke="#3d2914" strokeWidth="1.2" />
          <rect x="145" y="30" width="30" height="50" fill="#8a7a68" stroke="#3d2914" strokeWidth="1.2" />
          <polygon points="100,30 115,8 130,30" fill="#6a3a3a" stroke="#3d2914" strokeWidth="1" />
          <polygon points="160,30 175,8 190,30" fill="#6a3a3a" stroke="#3d2914" strokeWidth="1" />
          <rect x="118" y="68" width="24" height="38" fill="#2a1810" stroke="#3d2914" strokeWidth="1" />
          <path d="M 55 125 L 205 125" stroke="#3d2914" strokeWidth="1" opacity="0.4" />
          {/* 迷雾 */}
          <ellipse cx="130" cy="20" rx="90" ry="22" fill="#b8c8d0" opacity="0.35" />
          <ellipse cx="100" cy="15" rx="50" ry="14" fill="#d0dce4" opacity="0.25" />
          <text x="72" y="148" className="cp-map-ink-label cp-map-ink-label--castle" fontSize="13">迷雾王宫</text>
          <text x="88" y="163" className="cp-map-ink-sublabel" fontSize="9">
            {monsterName ? `${monsterName} 盘踞` : '邪恶军团盘踞'}
          </text>
        </g>

        {/* 前哨石塔 */}
        <g transform="translate(350, 58)" opacity="0.85">
          <rect x="14" y="28" width="12" height="32" fill="#8a7a68" stroke="#3d2914" strokeWidth="1" />
          <polygon points="20,28 20,12 26,28" fill="#6a3a3a" stroke="#3d2914" strokeWidth="0.8" />
          <rect x="10" y="60" width="20" height="4" fill="#5c4033" stroke="#3d2914" strokeWidth="0.6" />
          <text x="-2" y="78" className="cp-map-ink-sublabel" fontSize="8">前哨塔</text>
        </g>

        {/* 出发营地 */}
        <g transform="translate(480, 580)">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#3d2914" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
          <path d="M 12 28 L 20 12 L 28 28 Z" fill="#8b6914" stroke="#3d2914" strokeWidth="0.8" />
          <line x1="20" y1="12" x2="20" y2="6" stroke="#3d2914" strokeWidth="0.8" />
          <text x="-8" y="52" className="cp-map-ink-label" fontSize="11">出发营地</text>
        </g>

        {/* 探险路线 */}
        {alternatePaths?.map((alt) => (
          <path key={alt.slice(0, 24)} className="cp-map-route cp-map-route--alt" d={alt} />
        ))}
        <path className="cp-map-route-shadow" d={pathD} />
        <path className="cp-map-route" d={pathD} />

        {/* 神秘符号 */}
        <g opacity="0.45" transform="translate(860, 320)">
          <circle cx="0" cy="0" r="22" fill="none" stroke="#3d2914" strokeWidth="0.8" />
          <path d="M 0 -14 L 4 8 L -4 8 Z" fill="none" stroke="#3d2914" strokeWidth="0.8" />
          <path d="M -12 4 L 12 4" stroke="#3d2914" strokeWidth="0.8" />
          <text x="-18" y="38" className="cp-map-ink-sublabel" fontSize="8">未知领域</text>
        </g>

        {/* 星象装饰 */}
        <g opacity="0.35" transform="translate(90, 55)">
          <circle cx="0" cy="0" r="1.5" fill="#3d2914" />
          <circle cx="28" cy="12" r="1" fill="#3d2914" />
          <circle cx="55" cy="4" r="1.2" fill="#3d2914" />
          <path d="M 0 0 L 28 12 L 55 4" fill="none" stroke="#3d2914" strokeWidth="0.5" />
          <text x="0" y="28" className="cp-map-ink-sublabel" fontSize="7">远征星轨</text>
        </g>

        {/* 海怪装饰 */}
        <g className="cp-map-sea-beast" transform="translate(720, 620)" opacity="0.4">
          <path
            d="M 0 0 Q 20 -15 40 0 Q 60 12 80 -5 Q 60 8 40 5 Q 20 10 0 0"
            fill="none"
            stroke="#3d2914"
            strokeWidth="1.2"
          />
          <circle cx="68" cy="-2" r="2" fill="#3d2914" />
          <path d="M 10 5 Q 5 18 0 25" fill="none" stroke="#3d2914" strokeWidth="0.8" />
        </g>

        {/* 边框装饰 */}
        <rect x="36" y="24" width="928" height="652" fill="none" stroke="#3d2914" strokeWidth="2" opacity="0.35" rx="4" />
        <rect x="48" y="36" width="904" height="628" fill="none" stroke="#3d2914" strokeWidth="0.8" opacity="0.2" rx="2" />

        {/*  cartouche 标题 */}
        <g transform="translate(340, 620)">
          <path
            d="M 0 20 Q 0 0 20 0 L 300 0 Q 320 0 320 20 L 320 48 Q 320 68 300 68 L 20 68 Q 0 68 0 48 Z"
            fill="#dcc9a3"
            stroke="#3d2914"
            strokeWidth="1.2"
            opacity="0.92"
          />
          <text x="160" y="28" textAnchor="middle" className="cp-map-cartouche-title" fontSize="14">
            {kingdomName}
          </text>
          <text x="160" y="48" textAnchor="middle" className="cp-map-cartouche-sub" fontSize="9">
            词性军团远征图 · 王国一
          </text>
        </g>
      </g>

      {/* 罗盘 */}
      <g className="cp-map-compass" transform="translate(880, 580)">
        <circle cx="0" cy="0" r="38" fill="#e8d5b5" stroke="#3d2914" strokeWidth="1.2" opacity="0.92" />
        <circle cx="0" cy="0" r="32" fill="none" stroke="#3d2914" strokeWidth="0.6" opacity="0.5" />
        <polygon points="0,-26 6,0 0,8 -6,0" fill="#6a3a3a" stroke="#3d2914" strokeWidth="0.6" />
        <polygon points="0,26 4,0 0,-4 -4,0" fill="#3d2914" opacity="0.5" />
        <text x="0" y="-42" textAnchor="middle" className="cp-map-ink-label" fontSize="10">北</text>
        <text x="0" y="52" textAnchor="middle" className="cp-map-ink-sublabel" fontSize="8">南</text>
        <text x="44" y="4" textAnchor="middle" className="cp-map-ink-sublabel" fontSize="8">东</text>
        <text x="-44" y="4" textAnchor="middle" className="cp-map-ink-sublabel" fontSize="8">西</text>
      </g>

      {/* 卷边阴影（羊皮纸外缘） */}
      <path
        className="cp-parchment-rim"
        d="M 42 28 Q 18 52 32 118 Q 8 210 38 310 Q 14 420 48 520 Q 22 610 58 668 L 942 672 Q 978 580 958 470 Q 992 360 962 250 Q 988 140 948 48 Q 900 18 820 32 Q 720 8 620 24 Q 520 6 420 22 Q 320 10 220 26 Q 120 12 42 28 Z"
        fill="none"
        stroke="#2a1810"
        strokeWidth="3"
        opacity="0.55"
      />
    </svg>
  )
}

function ForestCluster({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="30" cy="38" rx="28" ry="12" fill="#3d5a35" opacity="0.35" />
      <Tree x={10} h={28} />
      <Tree x={28} h={34} />
      <Tree x={46} h={26} />
      <Tree x={22} h={22} w={0.8} />
      <Tree x={38} h={30} w={0.85} />
    </g>
  )
}

function Tree({ x, h, w = 1 }: { x: number; h: number; w?: number }) {
  const bw = 4 * w
  return (
    <g transform={`translate(${x}, ${50 - h})`}>
      <rect x={-bw / 2} y={h - 6} width={bw} height={8} fill="#5c4033" />
      <polygon
        points={`0,0 ${8 * w},${h * 0.45} ${-8 * w},${h * 0.45}`}
        fill="url(#cp-forest-grad)"
        stroke="#2a3a24"
        strokeWidth="0.6"
      />
      <polygon
        points={`0,${h * 0.25} ${7 * w},${h * 0.65} ${-7 * w},${h * 0.65}`}
        fill="url(#cp-forest-grad)"
        stroke="#2a3a24"
        strokeWidth="0.5"
        opacity="0.9"
      />
    </g>
  )
}

/**
 * 将百分比坐标转为 viewBox 路径。
 * @param swayScale 摆动幅度系数：1 为原始曲折山路；接近 0 时近似贴节点直连（用于真实底图叠加）。
 */
export function buildParchmentPathD(
  points: Array<{ x: number; y: number }>,
  viewW = 1000,
  viewH = 700,
  swayScale = 1,
): string {
  if (points.length < 2) return ''
  const scaled = points.map((p) => ({ x: (p.x / 100) * viewW, y: (p.y / 100) * viewH }))
  const [first, ...rest] = scaled
  let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
  for (let i = 0; i < rest.length; i++) {
    const prev = i === 0 ? first : rest[i - 1]
    const curr = rest[i]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const sway = (i % 2 === 0 ? 1 : -1) * Math.min(48, len * 0.35) * swayScale
    const cpx = (prev.x + curr.x) / 2 + nx * sway
    const cpy = (prev.y + curr.y) / 2 + ny * sway - 18 * swayScale
    d += ` Q ${cpx.toFixed(1)} ${cpy.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
  }
  return d
}

/** 节点间直线连接（标注模式用，无弯曲控制点） */
export function buildStraightPathD(
  points: Array<{ x: number; y: number }>,
  viewW = 1000,
  viewH = 700,
): string {
  if (points.length < 2) return ''
  const scaled = points.map((p) => ({ x: (p.x / 100) * viewW, y: (p.y / 100) * viewH }))
  let d = `M ${scaled[0].x.toFixed(1)} ${scaled[0].y.toFixed(1)}`
  for (let i = 1; i < scaled.length; i++) {
    d += ` L ${scaled[i].x.toFixed(1)} ${scaled[i].y.toFixed(1)}`
  }
  return d
}
