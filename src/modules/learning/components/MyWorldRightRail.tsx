import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface MyWorldRightRailProps {
  children: ReactNode
}

/** 将任务 / 小伙伴 / 成就墙挂载到右上角命令面板网格 */
export function MyWorldRightRail({ children }: MyWorldRightRailProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setSlot(document.getElementById('lw-mw-rail-slot'))
  }, [])

  if (!slot) return null
  return createPortal(children, slot)
}
