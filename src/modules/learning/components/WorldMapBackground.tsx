/** 我的世界 · 统一世界地图背景（CSS 背景 + 暗角，避免 img 加载失败出现碎图） */
export const WORLD_MAP_BG_SRC = '/assets/conquer-planet/world-map-bg.png'

export function WorldMapBackground() {
  return (
    <>
      <div
        className="lk-world-bg-img"
        style={{ backgroundImage: `url(${WORLD_MAP_BG_SRC})` }}
        role="presentation"
        aria-hidden="true"
      />
      <span className="lk-world-bg-vignette" aria-hidden="true" />
    </>
  )
}
