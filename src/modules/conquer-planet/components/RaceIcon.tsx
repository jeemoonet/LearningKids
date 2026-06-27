import { useId, type ReactElement, type ReactNode } from 'react'
import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import { POS_RACE } from '../types'

interface RaceIconProps {
  pos: PartOfSpeech
  className?: string
  size?: number
}

/** 统一图标画布：大轮廓、少细节，小尺寸也清晰 */
const VB = 24

function RaceSvg({
  size,
  children,
}: {
  size: number
  children: ReactNode
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {children}
    </svg>
  )
}

function WarriorIcon({ size }: { size: number }) {
  return (
    <RaceSvg size={size}>
      {/* 简约盾形：居中、扁平色、细描边 */}
      <path
        d="M12 3.5 17 5.5v11q0 3.5-5 4.5-5-1-5-4.5V5.5l5-2Z"
        fill="#ea4335"
      />
      <path
        d="M12 3.5 17 5.5v11q0 3.5-5 4.5-5-1-5-4.5V5.5l5-2Z"
        stroke="#c5221f"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </RaceSvg>
  )
}

function ClothCapIcon({ size }: { size: number }) {
  const uid = useId().replace(/:/g, '')
  const cloth = `rk-${uid}-cloth`

  return (
    <RaceSvg size={size}>
      <defs>
        <linearGradient id={cloth} x1="5" y1="8" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde293" />
          <stop offset="100%" stopColor="#e37400" />
        </linearGradient>
      </defs>

      {/* 帽檐 */}
      <ellipse cx="12" cy="18.5" rx="8.5" ry="2.2" fill="#c56200" />
      <ellipse cx="12" cy="18.2" rx="7.5" ry="1.6" fill="#e37400" />

      {/* 布帽主体 */}
      <path
        d="M5.5 18c0-5 2.8-9.5 6.5-10.5s6.5 4 6.5 10.5"
        fill={`url(#${cloth})`}
      />
      <path
        d="M7 17.5c1.5-5 3.5-7.5 5-8s3.5 3 5 8"
        stroke="#fbbc04"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* 前额褶边 */}
      <path
        d="M8 14.5c1.5-1.2 3.2-1.5 4-1.5s2.5.3 4 1.5"
        stroke="#c56200"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* 顶部高光 */}
      <ellipse cx="11" cy="9.5" rx="3" ry="2.5" fill="#ffffff" opacity="0.35" />
    </RaceSvg>
  )
}

function DoctorCapIcon({ size }: { size: number }) {
  return (
    <RaceSvg size={size}>
      {/* 帽檐带 */}
      <rect x="4" y="17" width="16" height="3" rx="1" fill="#2b579a" />
      <rect x="4.5" y="17.3" width="15" height="1.2" rx="0.6" fill="#5b9bd5" opacity="0.45" />

      {/* 护士帽三角 */}
      <path d="M12 4.5 20.5 17H3.5L12 4.5Z" fill="#f5f7fa" />
      <path d="M12 4.5 20.5 17H3.5" stroke="#4285f4" strokeWidth="1.2" strokeLinejoin="round" />

      {/* 红十字 */}
      <rect x="10.2" y="11" width="3.6" height="7" rx="0.8" fill="#ea4335" />
      <rect x="8.5" y="12.7" width="7" height="3.6" rx="0.8" fill="#ea4335" />

      {/* 高光 */}
      <path d="M12 6.5 17 15" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </RaceSvg>
  )
}

function WizardHatIcon({ size }: { size: number }) {
  const uid = useId().replace(/:/g, '')
  const hat = `rk-${uid}-hat`

  return (
    <RaceSvg size={size}>
      <defs>
        <linearGradient id={hat} x1="4" y1="5" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5cbf6a" />
          <stop offset="100%" stopColor="#1e7e34" />
        </linearGradient>
      </defs>

      {/* 帽檐 */}
      <ellipse cx="12" cy="18.5" rx="9" ry="2.4" fill="#1e6b32" />
      <ellipse cx="12" cy="18" rx="8" ry="1.8" fill="#2d8e47" />

      {/* 尖顶帽 */}
      <path d="M12 3.5 21 18H3L12 3.5Z" fill={`url(#${hat})`} />
      <path d="M12 3.5 21 18H3" stroke="#1e6b32" strokeWidth="1.2" strokeLinejoin="round" />

      {/* 帽带 */}
      <rect x="5" y="15" width="14" height="2.2" rx="1" fill="#fdd663" opacity="0.85" />

      {/* 星星 */}
      <path
        d="M12 8.5 12.8 10.5 15 10.8 13.2 12.2 13.5 14.5 12 13.2 10.5 14.5 10.8 12.2 8.5 10.5 8 12 8.5Z"
        fill="#c8f5d0"
      />

      {/* 弯折帽尖 */}
      <path
        d="M12 3.5c1.5-.8 3.5-.2 4.5 1.2"
        stroke="#a5d6a7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </RaceSvg>
  )
}

const HAT_ICONS: Partial<Record<PartOfSpeech, (props: { size: number }) => ReactElement>> = {
  verb: WarriorIcon,
  noun: ClothCapIcon,
  adjective: DoctorCapIcon,
  adverb: WizardHatIcon,
}

export function RaceIcon({ pos, className, size = 28 }: RaceIconProps) {
  const Hat = HAT_ICONS[pos]
  if (Hat) {
    return (
      <span
        className={`race-icon${className ? ` ${className}` : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          lineHeight: 0,
          flexShrink: 0,
        }}
      >
        <Hat size={Math.round(size * 0.92)} />
      </span>
    )
  }
  return (
    <span
      className={`race-icon${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      style={{ fontSize: size * 0.85, lineHeight: 1, flexShrink: 0 }}
    >
      {POS_RACE[pos].icon}
    </span>
  )
}
