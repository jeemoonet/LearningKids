import { SceneArrivalModal } from './SceneArrivalModal'
import type { LevelIntroContent } from '../data/levelIntro'

interface LevelIntroModalProps {
  open: boolean
  intro: LevelIntroContent
  onConfirm: () => void
}

/** 关卡练习开始前的情境介绍弹窗 */
export function LevelIntroModal({ open, intro, onConfirm }: LevelIntroModalProps) {
  return (
    <SceneArrivalModal
      open={open}
      eyebrow="关卡简报"
      icon={intro.icon}
      title={intro.title}
      location={intro.location}
      body={intro.body}
      note={intro.note}
      primaryLabel={intro.primaryLabel}
      onConfirm={onConfirm}
    />
  )
}
