import { useCallback, useEffect, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import type { PlanetSoldier } from '../../conquer-planet/types'

import { generateWordlistReading } from '../../conquer-planet/api'

import {

  ReadingPassagePanel,

  ReadingQuizPanel,

  type ReadingPassageData,

} from './ReadingPassageQuiz'

import '../readingPassage.css'



interface WordlistReadingModalProps {

  soldiers: PlanetSoldier[]

  onClose: () => void

}



function buildWordPayload(soldiers: PlanetSoldier[]) {

  return soldiers.map((item) => ({

    word: item.word,

    meaning: item.meaning,

    pos: item.partOfSpeech,

    exampleEn: item.exampleEn,

    exampleZh: item.exampleZh,

  }))

}



export function WordlistReadingModal({ soldiers, onClose }: WordlistReadingModalProps) {

  const [reading, setReading] = useState<ReadingPassageData | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [showZh, setShowZh] = useState(false)

  const [score, setScore] = useState<number | null>(null)

  const requestSeqRef = useRef(0)

  const initialSoldiersRef = useRef(soldiers)



  const load = useCallback(async (sourceSoldiers: PlanetSoldier[]) => {

    const seq = ++requestSeqRef.current

    setLoading(true)

    setError('')

    setReading(null)

    setShowZh(false)

    setScore(null)

    try {

      const { reading: nextReading } = await generateWordlistReading(buildWordPayload(sourceSoldiers))

      if (seq !== requestSeqRef.current) return

      setReading(nextReading)

    } catch (err) {

      if (seq !== requestSeqRef.current) return

      setError(err instanceof Error ? err.message : '生成失败，请稍后重试')

    } finally {

      if (seq === requestSeqRef.current) setLoading(false)

    }

  }, [])



  useEffect(() => {

    void load(initialSoldiersRef.current)

  }, [load])



  useEffect(() => {

    const onKey = (event: KeyboardEvent) => {

      if (event.key === 'Escape') onClose()

    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)

  }, [onClose])



  return createPortal(

    <div className="learning-modal-backdrop learning-modal-backdrop--top" role="presentation" onClick={onClose}>

      <div

        className="learning-modal lw-wordlist-reading"

        role="dialog"

        aria-modal="true"

        aria-labelledby="lw-wordlist-reading-title"

        onClick={(event) => event.stopPropagation()}

      >

        <header className="learning-modal-header">

          <div>

            <h2 id="lw-wordlist-reading-title">阅读短文</h2>

            <p className="learning-modal-subtitle">

              从当前单词表随机抽取单词，生成约 100 词的阅读材料与 3 道选择题

            </p>

          </div>

          <button type="button" className="learning-modal-close" onClick={onClose} aria-label="关闭">

            ×

          </button>

        </header>



        <div className="learning-modal-body lw-wordlist-reading__body">

          {loading ? <p className="learning-status">正在生成阅读短文…</p> : null}

          {error ? (

            <div className="lw-wordlist-reading__error">

              <p>{error}</p>

              <button type="button" className="learning-primary" onClick={() => void load(soldiers)}>

                重试

              </button>

            </div>

          ) : null}



          {!loading && !error && reading ? (

            <>

              {reading.source === 'fallback' ? (

                <p className="lw-wordlist-reading__notice">AI 暂不可用，已使用例句拼接生成备用短文。</p>

              ) : null}

              <ReadingPassagePanel reading={reading} showZh={showZh} onToggleZh={() => setShowZh((v) => !v)} />

              <ReadingQuizPanel

                key={reading.passageEn}

                questions={reading.questions}

                onComplete={({ score: nextScore }) => setScore(nextScore)}

              />

              {score !== null ? (

                <p className="lw-wordlist-reading__done">练习完成，可重新生成一篇新的阅读材料。</p>

              ) : null}

            </>

          ) : null}

        </div>



        <footer className="lw-wordlist-reading__footer">

          <button

            type="button"

            className="learning-secondary"

            disabled={loading || soldiers.length < 5}

            onClick={() => void load(soldiers)}

          >

            {loading ? '生成中…' : '重新生成'}

          </button>

          <button type="button" className="learning-primary" onClick={onClose}>

            关闭

          </button>

        </footer>

      </div>

    </div>,

    document.body,

  )

}

