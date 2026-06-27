import { useCallback, useRef, useState } from 'react'

interface AdminContinentMapPickerProps {
  mapX: number
  mapY: number
  mapRegion: string
  kingdomName: string
  onPositionChange: (x: number, y: number) => void
  onRegionChange: (region: string) => void
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function clientToPct(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  return {
    x: round1(Math.min(100, Math.max(0, x))),
    y: round1(Math.min(100, Math.max(0, y))),
  }
}

export function AdminContinentMapPicker({
  mapX,
  mapY,
  mapRegion,
  kingdomName,
  onPositionChange,
  onRegionChange,
}: AdminContinentMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const placeAt = useCallback(
    (clientX: number, clientY: number) => {
      const el = mapRef.current
      if (!el) return
      const { x, y } = clientToPct(el, clientX, clientY)
      onPositionChange(x, y)
    },
    [onPositionChange],
  )

  const handleMapClick = (e: React.MouseEvent) => {
    if (dragging) return
    placeAt(e.clientX, e.clientY)
  }

  const handleMarkerPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { pointerId: e.pointerId }
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleMarkerPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId !== e.pointerId) return
    placeAt(e.clientX, e.clientY)
  }

  const handleMarkerPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId !== e.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className="admin-continent-picker">
      <div
        ref={mapRef}
        className="admin-continent-picker__map"
        onClick={handleMapClick}
        role="presentation"
      >
        <button
          type="button"
          className={`admin-continent-picker__marker${dragging ? ' is-dragging' : ''}`}
          style={{ left: `${mapX}%`, top: `${mapY}%` }}
          title={`${kingdomName} (${mapX}, ${mapY})`}
          onPointerDown={handleMarkerPointerDown}
          onPointerMove={handleMarkerPointerMove}
          onPointerUp={handleMarkerPointerUp}
          onPointerCancel={handleMarkerPointerUp}
          onClick={(e) => e.stopPropagation()}
        />
        <p className="admin-continent-picker__hint">点击地图或拖拽标记调整位置</p>
      </div>
      <div className="admin-form-card admin-continent-picker__fields">
        <p className="admin-continent-picker__panel-title">位置参数</p>
        <label className="admin-field admin-field--full">
          <span className="admin-field__label">区域名称</span>
          <input
            className="admin-input"
            value={mapRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder="如：南麓平原"
          />
        </label>
        <div className="admin-field-grid admin-field-grid--coords">
          <label className="admin-field admin-field--sm">
            <span className="admin-field__label">横坐标 X（%）</span>
            <input
              className="admin-input admin-input--number"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={mapX}
              onChange={(e) => onPositionChange(Number(e.target.value), mapY)}
            />
          </label>
          <label className="admin-field admin-field--sm">
            <span className="admin-field__label">纵坐标 Y（%）</span>
            <input
              className="admin-input admin-input--number"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={mapY}
              onChange={(e) => onPositionChange(mapX, Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
