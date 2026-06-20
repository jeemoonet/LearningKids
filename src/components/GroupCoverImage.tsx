import { useState } from 'react'
import { groupCoverUrl } from '../modules/vocab-training/groupCover'
import type { VocabTierId } from '../modules/vocab-training/types'

interface GroupCoverImageProps {
  tierId: VocabTierId
  groupIndex: number
  title: string
  className: string
}

/** 按 groupIndex 匹配配图；加载失败时不占位 */
export function GroupCoverImage({ tierId, groupIndex, title, className }: GroupCoverImageProps) {
  const [hidden, setHidden] = useState(false)
  const src = groupCoverUrl(tierId, groupIndex)

  if (!src || hidden) return null

  return (
    <img
      className={className}
      src={src}
      alt={`${title} 场景配图`}
      loading="lazy"
      onError={() => setHidden(true)}
    />
  )
}
