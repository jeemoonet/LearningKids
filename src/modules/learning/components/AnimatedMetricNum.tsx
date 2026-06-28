import { useEffect, useRef, useState } from 'react'

interface AnimatedMetricNumProps {
  value: number
  format?: (value: number) => string
  className?: string
}

export function AnimatedMetricNum({ value, format, className }: AnimatedMetricNumProps) {
  const prevRef = useRef(value)
  const rafRef = useRef<number | undefined>(undefined)
  const [display, setDisplay] = useState(value)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = value

    if (value === prev) {
      setDisplay(value)
      return
    }

    if (value < prev) {
      setDisplay(value)
      return
    }

    setBump(true)
    const start = performance.now()
    const duration = 520
    const delta = value - prev

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(prev + delta * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    const bumpTimer = window.setTimeout(() => setBump(false), 720)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.clearTimeout(bumpTimer)
    }
  }, [value])

  const text = format ? format(display) : String(Math.round(display * 10) / 10)

  return (
    <span className={[className, bump ? 'lk-metric-num--bump' : ''].filter(Boolean).join(' ')}>
      {text}
    </span>
  )
}
