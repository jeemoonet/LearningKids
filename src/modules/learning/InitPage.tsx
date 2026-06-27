import { useCallback, useEffect, useState } from 'react'

import type { LearningNav } from './LearningModule'

import { learningApi, type InitStatus, type InitWord, type KnownWord } from './api'



const TIER_OPTIONS = [

  { id: 'beginner', label: '初级' },

  { id: 'intermediate', label: '中级' },

  { id: 'advanced', label: '高级' },

]



const POS_LABEL: Record<string, string> = {

  noun: '名词',

  verb: '动词',

  adj: '形容词',

  pronoun: '代词',

  adv: '副词',

  other: '其他',

}



interface InitPageProps {

  onDone: () => Promise<void>

  nav: LearningNav

}



interface InitDrawModalProps {

  open: boolean

  onClose: () => void

  onImported: () => Promise<void>

  nav: LearningNav

}



function InitDrawModal({ open, onClose, onImported, nav }: InitDrawModalProps) {

  const [tier, setTier] = useState('beginner')

  const [status, setStatus] = useState<InitStatus | null>(null)

  const [batch, setBatch] = useState<InitWord[]>([])

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState('')



  const visibleBatch = batch.filter((w) => !dismissed.has(w.word))

  const wordsToImport = visibleBatch.map((w) => w.word)



  const loadStatus = useCallback(async (t: string) => {

    const s = await learningApi.initStatus(t)

    setStatus(s)

    return s

  }, [])



  const drawBatch = useCallback(async () => {

    setLoading(true)

    setMessage('')

    try {

      const { words, status: s } = await learningApi.initDraw(tier)

      setBatch(words)

      setDismissed(new Set())

      setStatus(s)

      if (words.length === 0) {

        setMessage(s.initialized ? '已达到初始化目标（100 词）' : '该档暂无更多可抽单词')

      }

    } catch (err) {

      setMessage(err instanceof Error ? err.message : '抽词失败')

    } finally {

      setLoading(false)

    }

  }, [tier])



  useEffect(() => {

    if (!open) return

    setBatch([])

    setDismissed(new Set())

    setMessage('')

    void loadStatus(tier).then((s) => {

      if (!s.initialized) void drawBatch()

    })

  }, [open, tier, loadStatus, drawBatch])



  useEffect(() => {

    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {

      if (event.key === 'Escape') onClose()

    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)

  }, [open, onClose])



  const dismissWord = (word: string) => {

    setDismissed((prev) => new Set(prev).add(word))

  }



  const importKeptWords = async () => {

    if (wordsToImport.length === 0) return



    setLoading(true)

    setMessage('')

    try {

      const { status: s } = await learningApi.initKeep(tier, wordsToImport)

      setStatus(s)

      await onImported()

      if (s.initialized) {

        setMessage('初始化完成！已建立 100 词基础库。')

        setBatch([])

        return

      }

      setMessage(`已导入 ${wordsToImport.length} 个词，继续抽取下一批…`)

      await drawBatch()

    } catch (err) {

      setMessage(err instanceof Error ? err.message : '保存失败')

    } finally {

      setLoading(false)

    }

  }



  if (!open) return null



  const progress = status ? Math.min(100, Math.round((status.knownCount / status.targetCount) * 100)) : 0



  return (

    <div className="learning-modal-backdrop" role="presentation" onClick={onClose}>

      <div

        className="learning-modal"

        role="dialog"

        aria-modal="true"

        aria-labelledby="learning-init-modal-title"

        onClick={(event) => event.stopPropagation()}

      >

        <header className="learning-modal-header">

          <div>

            <h2 id="learning-init-modal-title">抽取单词并导入</h2>

            <p className="learning-modal-subtitle">

              从标准库随机抽词，点 × 去掉不认识的，其余导入我的单词库

            </p>

          </div>

          <button type="button" className="learning-modal-close" onClick={onClose} aria-label="关闭">

            ×

          </button>

        </header>



        <div className="learning-modal-body">

          <div className="learning-form-row">

            <label>抽词来源</label>

            <select value={tier} onChange={(e) => setTier(e.target.value)} disabled={loading}>

              {TIER_OPTIONS.map((o) => (

                <option key={o.id} value={o.id}>

                  {o.label}

                </option>

              ))}

            </select>

          </div>



          <div className="learning-progress">

            <div className="learning-progress-bar" style={{ width: `${progress}%` }} />

            <span className="learning-progress-text">

              已掌握 {status?.knownCount ?? 0} / {status?.targetCount ?? 100}

            </span>

          </div>



          {status?.initialized ? (

            <div className="learning-modal-done">

              <p>基础词库已建立（100 词），可前往选择学习库继续学习。</p>

              <div className="learning-form-actions">

                <button type="button" className="learning-secondary" onClick={() => nav.go('library')}>

                  选择学习库

                </button>

                <button type="button" className="learning-primary" onClick={onClose}>

                  关闭

                </button>

              </div>

            </div>

          ) : batch.length === 0 ? (

            <div className="learning-modal-empty">

              <p>{message || '正在抽取单词…'}</p>

              <button type="button" className="learning-primary" onClick={drawBatch} disabled={loading}>

                {loading ? '抽词中…' : '重新抽词'}

              </button>

            </div>

          ) : (

            <>

              <p className="learning-init-hint">

                不认识的词点右上角 × 移除；保留的 {visibleBatch.length} 个词将一并导入。

              </p>

              {visibleBatch.length === 0 ? (

                <p className="learning-hint">本轮已全部移除，请换一批或关闭后重试。</p>

              ) : (

                <div className="learning-init-grid learning-init-grid-modal">

                  {visibleBatch.map((w) => (

                    <div key={w.id} className="learning-init-word is-kept">

                      <button

                        type="button"

                        className="learning-init-word-close"

                        aria-label={`移除 ${w.word}`}

                        onClick={() => dismissWord(w.word)}

                      >

                        ×

                      </button>

                      <div className="learning-init-word-body">

                        <span className="learning-init-word-en">{w.word}</span>

                        <span className="learning-init-word-pos">{w.posLabel}</span>

                        <span className="learning-init-word-zh">{w.meaningZh}</span>

                      </div>

                    </div>

                  ))}

                </div>

              )}

              <div className="learning-init-summary">

                <span>待导入 {visibleBatch.length} 个</span>

                {dismissed.size > 0 && <span>已移除 {dismissed.size} 个</span>}

              </div>

              <div className="learning-form-actions">

                <button

                  type="button"

                  className="learning-secondary"

                  onClick={drawBatch}

                  disabled={loading}

                >

                  换一批

                </button>

                <button

                  type="button"

                  className="learning-primary"

                  onClick={importKeptWords}

                  disabled={loading || visibleBatch.length === 0}

                >

                  {loading ? '导入中…' : `导入 ${visibleBatch.length} 个词`}

                </button>

              </div>

            </>

          )}



          {message && !status?.initialized && batch.length > 0 && (

            <p className="learning-hint">{message}</p>

          )}

        </div>

      </div>

    </div>

  )

}



export function InitPage({ onDone, nav }: InitPageProps) {

  const [known, setKnown] = useState<KnownWord[]>([])

  const [status, setStatus] = useState<InitStatus | null>(null)

  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)



  const loadPage = useCallback(async () => {

    setLoading(true)

    try {

      const [{ words }, s] = await Promise.all([

        learningApi.listKnownWords(),

        learningApi.initStatus('beginner'),

      ])

      setKnown(words)

      setStatus(s)

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    void loadPage()

  }, [loadPage])



  const handleImported = async () => {

    await onDone()

    await loadPage()

  }



  const progress = status ? Math.min(100, Math.round((status.knownCount / status.targetCount) * 100)) : 0



  return (

    <div className="learning-page">

      <header className="learning-page-head learning-page-head-row">

        <div>

          <h1>我的单词库</h1>

          <p>

            已掌握的单词会出现在下方；目标 {status?.targetCount ?? 100} 词，用于后续学习白名单。

          </p>

        </div>

        <button type="button" className="learning-primary" onClick={() => setModalOpen(true)}>
          初始化
        </button>

      </header>



      <section className="learning-card">

        <div className="learning-progress">

          <div className="learning-progress-bar" style={{ width: `${progress}%` }} />

          <span className="learning-progress-text">

            已掌握 {status?.knownCount ?? 0} / {status?.targetCount ?? 100}

          </span>

        </div>

        {status?.initialized && (

          <div className="learning-form-actions">

            <button type="button" className="learning-secondary" onClick={() => nav.go('library')}>

              下一步：选择学习库

            </button>

          </div>

        )}

      </section>



      <section className="learning-card">

        <h2>全部单词（{known.length}）</h2>

        {loading ? (

          <p className="learning-status">加载中…</p>

        ) : known.length === 0 ? (

          <p className="learning-empty">还没有单词，点击右上角「初始化」抽取并导入认识的词。</p>

        ) : (

          <div className="learning-known-list">

            {known.map((w) => (

              <div key={w.word} className={`learning-known-row learning-known-${w.source}`}>

                <span className="learning-known-row-word">{w.word}</span>

                <span className="learning-known-row-pos">{POS_LABEL[w.pos] ?? w.pos}</span>

                <span className="learning-known-row-source">

                  {w.source === 'pronoun' ? '系统' : w.source === 'init' ? '初始化' : '学习通过'}

                </span>

              </div>

            ))}

          </div>

        )}

      </section>



      <InitDrawModal

        open={modalOpen}

        onClose={() => setModalOpen(false)}

        onImported={handleImported}

        nav={nav}

      />

    </div>

  )

}


