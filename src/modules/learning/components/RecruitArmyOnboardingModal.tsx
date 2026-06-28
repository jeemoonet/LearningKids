import { useEffect, useMemo, useState } from 'react'
import { learningApi, type LearningLibrary, type LearningProfile } from '../api'
import { InitWordDrawPanel } from './InitWordDrawPanel'
import { PLANET_NAME } from '../planetBrand'

type OnboardStep = 'target' | 'recruit' | 'launch'

const STEPS: Array<{ id: OnboardStep; label: string }> = [
  { id: 'target', label: '选择目标' },
  { id: 'recruit', label: '招募军队' },
  { id: 'launch', label: '开始探险' },
]

function resolveInitialStep(profile: LearningProfile): OnboardStep {
  if (!profile.currentLibraryId) return 'target'
  if (!profile.initDone) return 'recruit'
  return 'launch'
}

function tierFromLibrary(lib: LearningLibrary | undefined): string {
  const tier = lib?.sourceTier
  if (tier === 'intermediate' || tier === 'advanced') return tier
  return 'beginner'
}

export function needsRecruitOnboarding(profile: LearningProfile | null): boolean {
  if (!profile) return false
  return !profile.initDone || !profile.currentLibraryId
}

interface RecruitArmyOnboardingModalProps {
  open: boolean
  profile: LearningProfile | null
  libraries: LearningLibrary[]
  kingdomName?: string | null
  onRefresh: () => Promise<void>
  onEnterAdventure: () => void
  onClose: () => void
}

export function RecruitArmyOnboardingModal({
  open,
  profile,
  libraries,
  kingdomName,
  onRefresh,
  onEnterAdventure,
  onClose,
}: RecruitArmyOnboardingModalProps) {
  const [step, setStep] = useState<OnboardStep>('target')
  const [selectedLibraryId, setSelectedLibraryId] = useState('')
  const [targetBusy, setTargetBusy] = useState(false)
  const [targetMsg, setTargetMsg] = useState('')

  useEffect(() => {
    if (!open || !profile) return
    setStep(resolveInitialStep(profile))
    setSelectedLibraryId(profile.currentLibraryId ?? libraries[0]?.id ?? '')
  }, [open, profile, libraries])

  const selectedLibrary = useMemo(
    () => libraries.find((lib) => lib.id === selectedLibraryId),
    [libraries, selectedLibraryId],
  )

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const confirmTarget = async () => {
    if (!selectedLibraryId) {
      setTargetMsg('请先选择一个征服目标')
      return
    }
    if (selectedLibraryId === profile?.currentLibraryId) {
      setStep('recruit')
      return
    }
    setTargetBusy(true)
    setTargetMsg('')
    try {
      await learningApi.setCurrentLibrary(selectedLibraryId)
      await onRefresh()
      setStep('recruit')
    } catch (err) {
      setTargetMsg(err instanceof Error ? err.message : '保存失败')
    } finally {
      setTargetBusy(false)
    }
  }

  if (!open || !profile) return null

  return (
    <div className="lw-mw-overlay lw-mw-onboard-overlay" role="presentation">
      <div
        className="lw-mw-sheet lw-mw-onboard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lw-onboard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lw-mw-sheet__head lw-mw-onboard__head">
          <div>
            <p className="lw-mw-onboard__eyebrow">首次远征</p>
            <h2 id="lw-onboard-title" className="lw-mw-sheet__title">
              ⚔️ 招募军队
            </h2>
          </div>
        </div>

        <ol className="lw-mw-onboard__steps" aria-label="引导步骤">
          {STEPS.map((item, idx) => (
            <li
              key={item.id}
              className={`lw-mw-onboard__step${idx === stepIndex ? ' is-active' : ''}${idx < stepIndex ? ' is-done' : ''}`}
            >
              <span className="lw-mw-onboard__step-num">{idx < stepIndex ? '✓' : idx + 1}</span>
              <span className="lw-mw-onboard__step-label">{item.label}</span>
            </li>
          ))}
        </ol>

        <div className="lw-mw-sheet__body lw-mw-onboard__body">
          {step === 'target' && (
            <>
              <p className="lw-mw-onboard__intro">
                欢迎来到{PLANET_NAME}！先选定你要征服的学习目标，再挑选你认识的单词组建初始军团。
              </p>
              {targetMsg && <p className="lw-mw-lib-msg">{targetMsg}</p>}
              <ul className="lw-mw-lib-list">
                {libraries.map((lib) => {
                  const active = lib.id === selectedLibraryId
                  return (
                    <li key={lib.id}>
                      <button
                        type="button"
                        className={`lw-mw-lib-item${active ? ' is-active' : ''}`}
                        disabled={targetBusy}
                        onClick={() => setSelectedLibraryId(lib.id)}
                      >
                        <span className="lw-mw-lib-item__main">
                          <span className="lw-mw-lib-item__name">{lib.name}</span>
                          <span className="lw-mw-lib-item__count">{lib.wordCount} 词</span>
                        </span>
                        {active && <span className="lw-mw-lib-item__badge">已选</span>}
                      </button>
                    </li>
                  )
                })}
                {libraries.length === 0 && <li className="lw-mw-lib-msg">暂无可选学习库</li>}
              </ul>
              <div className="lw-mw-onboard__actions">
                <button
                  type="button"
                  className="lw-mw-onboard__primary"
                  disabled={targetBusy || !selectedLibraryId}
                  onClick={() => void confirmTarget()}
                >
                  {targetBusy ? '保存中…' : '下一步：招募军队'}
                </button>
              </div>
            </>
          )}

          {step === 'recruit' && (
            <>
              <InitWordDrawPanel
                active
                variant="embedded"
                tier={tierFromLibrary(selectedLibrary)}
                tierLocked
                onImported={onRefresh}
                onInitialized={() => setStep('launch')}
                onBack={() => setStep('target')}
              />
              {profile.initDone && (
                <div className="lw-mw-onboard__actions">
                  <button type="button" className="lw-mw-onboard__secondary" onClick={() => setStep('target')}>
                    上一步：重选目标
                  </button>
                  <button type="button" className="lw-mw-onboard__primary" onClick={() => setStep('launch')}>
                    下一步：准备出征
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'launch' && (
            <>
              <div className="lw-mw-onboard__launch">
                <span className="lw-mw-onboard__launch-icon" aria-hidden="true">
                  🚀
                </span>
                <h3 className="lw-mw-onboard__launch-title">军团集结完毕！</h3>
                <p className="lw-mw-onboard__launch-desc">
                  你已招募 <strong>{profile.knownCount}</strong> 名勇士，征服目标为
                  <strong> {profile.currentLibraryName ?? selectedLibrary?.name}</strong>。
                  准备好前往{kingdomName ? `「${kingdomName}」` : '第一个王国'}开始探险了吗？
                </p>
              </div>
              <div className="lw-mw-onboard__actions">
                <button type="button" className="lw-mw-onboard__secondary" onClick={() => setStep('recruit')}>
                  上一步
                </button>
                <button type="button" className="lw-mw-onboard__secondary" onClick={onClose}>
                  稍后再说
                </button>
                <button type="button" className="lw-mw-onboard__primary" onClick={onEnterAdventure}>
                  开始探险
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
