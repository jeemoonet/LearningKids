/** 七王国守护怪物 · 手绘墨水风 SVG 插画 */

import type { ReactNode } from 'react'

export type MonsterId =
  | 'mist-golem'
  | 'stew-guardian'
  | 'forest-stalker'
  | 'hourglass-demon'
  | 'market-serpent'
  | 'echo-phantom'
  | 'shadow-crown'

interface MonsterSpriteProps {
  id: MonsterId | string
  size?: number
  className?: string
  title?: string
}

export function MonsterSprite({ id, size = 120, className = '', title }: MonsterSpriteProps) {
  const render = MONSTER_RENDERERS[id as MonsterId] ?? MONSTER_RENDERERS['mist-golem']
  return (
    <svg
      className={`cp-monster-art ${className}`.trim()}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {render()}
    </svg>
  )
}

const INK = '#3d2914'
const INK_LIGHT = '#5c4033'
const MIST = '#9ab0bc'
const SHADOW = '#2a1810'

function MistGolem() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="38" ry="8" fill={SHADOW} opacity="0.15" />
      <path
        d="M 30 95 Q 28 70 38 52 Q 42 38 52 32 Q 58 18 60 12 Q 62 18 68 32 Q 78 38 82 52 Q 92 70 90 95 Z"
        fill="#8a9aa8"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path d="M 38 55 Q 60 48 82 55" fill="none" stroke={INK_LIGHT} strokeWidth="1" opacity="0.6" />
      <ellipse cx="48" cy="58" rx="6" ry="8" fill={MIST} stroke={INK} strokeWidth="1.2" />
      <ellipse cx="72" cy="58" rx="6" ry="8" fill={MIST} stroke={INK} strokeWidth="1.2" />
      <circle cx="48" cy="58" r="2.5" fill={INK} />
      <circle cx="72" cy="58" r="2.5" fill={INK} />
      <path d="M 52 72 Q 60 78 68 72" fill="none" stroke={INK} strokeWidth="1.2" />
      <path d="M 20 80 Q 35 65 45 75" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 100 80 Q 85 65 75 75" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="60" cy="28" rx="22" ry="10" fill="#c8d4dc" opacity="0.45" />
    </>
  )
}

function StewGuardian() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="34" ry="7" fill={SHADOW} opacity="0.15" />
      <path
        d="M 35 95 L 35 70 Q 35 55 60 50 Q 85 55 85 70 L 85 95 Z"
        fill="#6a4a32"
        stroke={INK}
        strokeWidth="1.5"
      />
      <ellipse cx="60" cy="50" rx="28" ry="10" fill="#8b6914" stroke={INK} strokeWidth="1.2" />
      <path d="M 32 58 Q 60 42 88 58" fill="#a08030" stroke={INK} strokeWidth="1" />
      <circle cx="48" cy="68" r="5" fill="#c45c3a" stroke={INK} strokeWidth="0.8" />
      <circle cx="72" cy="68" r="5" fill="#81c995" stroke={INK} strokeWidth="0.8" />
      <path d="M 50 82 Q 60 88 70 82" fill="none" stroke={INK} strokeWidth="1.2" />
      <path d="M 60 38 L 60 22 M 52 26 L 68 26" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 25 75 Q 15 60 18 45" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.6" />
    </>
  )
}

function ForestStalker() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="40" ry="7" fill={SHADOW} opacity="0.15" />
      <path
        d="M 60 15 L 95 95 L 25 95 Z"
        fill="#3d5a35"
        stroke={INK}
        strokeWidth="1.5"
        opacity="0.85"
      />
      <path d="M 60 30 L 80 85 L 40 85 Z" fill="#4a6741" stroke={INK} strokeWidth="1" />
      <circle cx="52" cy="62" r="5" fill="#fdd663" stroke={INK} strokeWidth="1" />
      <circle cx="68" cy="62" r="5" fill="#fdd663" stroke={INK} strokeWidth="1" />
      <ellipse cx="52" cy="62" rx="1.5" ry="3" fill={INK} />
      <ellipse cx="68" cy="62" rx="1.5" ry="3" fill={INK} />
      <path d="M 55 75 L 65 75 L 60 82 Z" fill={INK} opacity="0.7" />
      <path d="M 15 70 Q 30 55 40 65" fill="none" stroke={INK} strokeWidth="1.5" />
      <path d="M 105 70 Q 90 55 80 65" fill="none" stroke={INK} strokeWidth="1.5" />
    </>
  )
}

function HourglassDemon() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="32" ry="7" fill={SHADOW} opacity="0.15" />
      <path
        d="M 42 20 L 78 20 L 68 55 L 78 100 L 42 100 L 52 55 Z"
        fill="#c9a86c"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path d="M 48 35 L 72 35 L 60 55 L 72 85 L 48 85 L 60 55 Z" fill="#e8d5b5" stroke={INK} strokeWidth="0.8" />
      <circle cx="60" cy="55" r="4" fill="#8b6914" stroke={INK} strokeWidth="0.8" />
      <path d="M 30 40 Q 20 55 30 70" fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
      <path d="M 90 40 Q 100 55 90 70" fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
      <circle cx="35" cy="30" r="3" fill="none" stroke={INK} strokeWidth="0.8" />
      <circle cx="85" cy="30" r="3" fill="none" stroke={INK} strokeWidth="0.8" />
    </>
  )
}

function MarketSerpent() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="42" ry="7" fill={SHADOW} opacity="0.15" />
      <path
        d="M 20 80 Q 35 40 60 35 Q 85 40 100 80 Q 85 95 60 98 Q 35 95 20 80"
        fill="#5a7a48"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path d="M 60 35 L 60 20" stroke={INK} strokeWidth="1.5" />
      <circle cx="48" cy="62" r="4" fill="#fdd663" stroke={INK} strokeWidth="0.8" />
      <circle cx="72" cy="62" r="4" fill="#fdd663" stroke={INK} strokeWidth="0.8" />
      <circle cx="60" cy="55" r="4" fill="#fdd663" stroke={INK} strokeWidth="0.8" />
      <path d="M 52 78 Q 60 84 68 78" fill="none" stroke={INK} strokeWidth="1" />
      <path d="M 15 70 Q 8 55 12 40" fill="none" stroke={INK} strokeWidth="1.2" />
      <path d="M 105 70 Q 112 55 108 40" fill="none" stroke={INK} strokeWidth="1.2" />
    </>
  )
}

function EchoPhantom() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="30" ry="7" fill={SHADOW} opacity="0.15" />
      <path
        d="M 60 18 Q 85 35 82 65 Q 78 95 60 100 Q 42 95 38 65 Q 35 35 60 18"
        fill="#b8c8d8"
        stroke={INK}
        strokeWidth="1.5"
        opacity="0.75"
      />
      <path
        d="M 60 25 Q 78 38 76 62 Q 73 88 60 92 Q 47 88 44 62 Q 42 38 60 25"
        fill="none"
        stroke={INK_LIGHT}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <ellipse cx="50" cy="55" rx="5" ry="7" fill="#d0dce8" stroke={INK} strokeWidth="1" />
      <ellipse cx="70" cy="55" rx="5" ry="7" fill="#d0dce8" stroke={INK} strokeWidth="1" />
      <path d="M 48 72 Q 60 78 72 72" fill="none" stroke={INK} strokeWidth="1" opacity="0.6" />
      <path d="M 25 50 Q 40 45 55 50" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.35" />
      <path d="M 65 50 Q 80 45 95 50" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.35" />
    </>
  )
}

function ShadowCrown() {
  return (
    <>
      <ellipse cx="60" cy="108" rx="44" ry="8" fill={SHADOW} opacity="0.25" />
      <path
        d="M 25 95 L 35 45 L 50 60 L 60 30 L 70 60 L 85 45 L 95 95 Z"
        fill="#2a1810"
        stroke={INK}
        strokeWidth="1.8"
      />
      <path d="M 35 45 L 50 60 L 60 30 L 70 60 L 85 45" fill="none" stroke="#6a3a3a" strokeWidth="1" />
      <circle cx="48" cy="68" r="5" fill="#ea4335" stroke={INK} strokeWidth="0.8" opacity="0.85" />
      <circle cx="72" cy="68" r="5" fill="#ea4335" stroke={INK} strokeWidth="0.8" opacity="0.85" />
      <path d="M 52 82 Q 60 88 68 82" fill="none" stroke="#8a4848" strokeWidth="1.2" />
      <ellipse cx="60" cy="22" rx="18" ry="8" fill="#1a1018" opacity="0.6" />
      <path d="M 42 38 L 38 28 M 78 38 L 82 28" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )
}

const MONSTER_RENDERERS: Record<MonsterId, () => ReactNode> = {
  'mist-golem': MistGolem,
  'stew-guardian': StewGuardian,
  'forest-stalker': ForestStalker,
  'hourglass-demon': HourglassDemon,
  'market-serpent': MarketSerpent,
  'echo-phantom': EchoPhantom,
  'shadow-crown': ShadowCrown,
}

export function getMonsterIdForKingdom(kingdomId: string): MonsterId {
  const map: Record<string, MonsterId> = {
    'kingdom-1': 'mist-golem',
    'kingdom-2': 'stew-guardian',
    'kingdom-3': 'forest-stalker',
    'kingdom-4': 'hourglass-demon',
    'kingdom-5': 'market-serpent',
    'kingdom-6': 'echo-phantom',
    'kingdom-7': 'shadow-crown',
  }
  return map[kingdomId] ?? 'mist-golem'
}
