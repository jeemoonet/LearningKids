import { SceneArrivalModal } from './SceneArrivalModal'
import type { LevelIntroContent } from '../data/levelIntro'

interface LevelIntroModalProps {
  open: boolean
  intro: LevelIntroContent
  onConfirm: () => void
  eyebrow?: string
}

/** 关卡练习开始前的情境介绍弹窗 */
export function LevelIntroModal({ open, intro, onConfirm, eyebrow = '关卡简报' }: LevelIntroModalProps) {
  return (
    <SceneArrivalModal
      open={open}
      eyebrow={eyebrow}
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
