import { useEffect, useState, type RefObject } from 'react'

export function useContainerSize(
  ref: RefObject<HTMLElement | null>,
  maxSize: number,
  minSize = 200,
): number {
  const [size, setSize] = useState(maxSize)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateSize = () => {
      const width = element.clientWidth
      if (width <= 0) return
      setSize(Math.max(minSize, Math.min(maxSize, Math.floor(width))))
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    window.addEventListener('orientationchange', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', updateSize)
    }
  }, [maxSize, minSize, ref])

  return size
}
