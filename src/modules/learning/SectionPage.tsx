import { useEffect, useState } from 'react'
import type { LearningNav } from './LearningModule'
import { learningApi, type QuizQuestion, type SectionDetail, type SectionWord } from './api'
import { speakEnglish } from '../vocab-training/speak'
import { WordHunterModule } from '../word-hunter/WordHunterModule'

type Courseware = 'flashcard' | 'quiz' | 'spelling' | 'games'

interface SectionPageProps {
  sectionId: string
  nav: LearningNav
}

const TABS: Array<{ id: Courseware; label: string }> = [
  { id: 'flashcard', label: '闪卡' },
  { id: 'quiz', label: '选择题' },
  { id: 'spelling', label: '拼写' },
  { id: 'games', label: '扩展游戏' },
]

function Flashcard({ words, sectionId }: { words: SectionWord[]; sectionId: string }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const word = words[index]

  useEffect(() => {
    setFlipped(false)
  }, [index])

  if (!word) return <p className="learning-empty">本节暂无单词。</p>

  const mark = async (value: number) => {
    await learningApi.updateFamiliarity(sectionId, word.word, value).catch(() => undefined)
    if (index < words.length - 1) setIndex(index + 1)
  }

  return (
    <div className="learning-flashcard">
      <div className="learning-flashcard-counter">
        {index + 1} / {words.length}
      </div>
      <button type="button" className="learning-flashcard-body" onClick={() => setFlipped((v) => !v)}>
        <span className="learning-flashcard-word">{word.word}</span>
        <span className="learning-flashcard-phonetic">{word.phonetic}</span>
        {flipped && (
          <>
            <span className="learning-flashcard-pos">{word.posLabel}</span>
            <span className="learning-flashcard-meaning">{word.meaningZh}</span>
            {word.exampleEn && <span className="learning-flashcard-example">{word.exampleEn}</span>}
          </>
        )}
        {!flipped && <span className="learning-flashcard-hint">点击查看释义</span>}
      </button>
      <div className="learning-flashcard-tools">
        <button type="button" onClick={() => speakEnglish(word.word)}>🔊 朗读</button>
      </div>
      <div className="learning-flashcard-actions">
        <button type="button" className="learning-secondary" onClick={() => mark(2)}>
          不熟
        </button>
        <button type="button" className="learning-primary" onClick={() => mark(5)}>
          认识了
        </button>
      </div>
    </div>
  )
}

function Quiz({ sectionId }: { sectionId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const load = () => {
    learningApi.sectionQuiz(sectionId).then(({ questions: qs }) => {
      setQuestions(qs)
      setIndex(0)
      setPicked(null)
      setCorrectCount(0)
      setDone(false)
    })
  }

  useEffect(load, [sectionId])

  const q = questions[index]
  if (questions.length === 0) return <p className="learning-empty">暂无选择题。</p>

  if (done) {
    return (
      <div className="learning-quiz-result">
        <p>得分：{correctCount} / {questions.length}</p>
        <button type="button" className="learning-primary" onClick={load}>
          再来一组
        </button>
      </div>
    )
  }

  const pick = (optId: number, isCorrect: boolean) => {
    if (picked !== null) return
    setPicked(optId)
    if (isCorrect) setCorrectCount((c) => c + 1)
    window.setTimeout(() => {
      if (index < questions.length - 1) {
        setIndex(index + 1)
        setPicked(null)
      } else {
        setDone(true)
      }
    }, 700)
  }

  return (
    <div className="learning-quiz">
      <div className="learning-flashcard-counter">
        {index + 1} / {questions.length}
      </div>
      <h3 className="learning-quiz-word">{q.word}</h3>
      <div className="learning-quiz-options">
        {q.options.map((opt) => {
          const state =
            picked === null
              ? ''
              : opt.isCorrect
                ? ' is-correct'
                : picked === opt.id
                  ? ' is-wrong'
                  : ''
          return (
            <button
              key={opt.id}
              type="button"
              className={`learning-quiz-option${state}`}
              onClick={() => pick(opt.id, opt.isCorrect)}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Spelling({ words }: { words: SectionWord[] }) {
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const word = words[index]

  useEffect(() => {
    setValue('')
    setResult('idle')
  }, [index])

  if (!word) return <p className="learning-empty">本节暂无单词。</p>

  const check = () => {
    const ok = value.trim().toLowerCase() === word.word.toLowerCase()
    setResult(ok ? 'correct' : 'wrong')
  }

  return (
    <div className="learning-spelling">
      <div className="learning-flashcard-counter">
        {index + 1} / {words.length}
      </div>
      <p className="learning-spelling-meaning">{word.meaningZh}</p>
      <p className="learning-spelling-hint">
        首字母：{word.word[0]} · 共 {word.word.length} 个字母
      </p>
      <input
        className={`learning-spelling-input is-${result}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && check()}
        placeholder="输入单词后回车"
      />
      {result === 'correct' && <p className="learning-hint">✓ 正确！</p>}
      {result === 'wrong' && <p className="learning-hint">正确答案：{word.word}</p>}
      <div className="learning-flashcard-actions">
        <button type="button" className="learning-secondary" onClick={check}>
          检查
        </button>
        <button
          type="button"
          className="learning-primary"
          onClick={() => setIndex((i) => Math.min(words.length - 1, i + 1))}
        >
          下一个
        </button>
      </div>
    </div>
  )
}

export function SectionPage({ sectionId, nav }: SectionPageProps) {
  const [section, setSection] = useState<SectionDetail | null>(null)
  const [tab, setTab] = useState<Courseware>('flashcard')
  const [wordHunterOpen, setWordHunterOpen] = useState(false)

  useEffect(() => {
    learningApi.getSection(sectionId).then(({ section: s }) => setSection(s)).catch(() => undefined)
  }, [sectionId])

  if (!section) return <p className="learning-status">加载小节…</p>

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <div className="learning-page-head-row">
          <button type="button" className="learning-back" onClick={() => nav.go('plan')}>
            ← 小节列表
          </button>
          <h1>第 {section.seq} 节学习（{section.words.length} 词）</h1>
        </div>
        <p>课件中的例句、关联词与测试题只会用到「我的单词库 + 本节单词」</p>
      </header>

      <div className="learning-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`learning-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="learning-card">
        {tab === 'flashcard' && <Flashcard words={section.words} sectionId={sectionId} />}
        {tab === 'quiz' && <Quiz sectionId={sectionId} />}
        {tab === 'spelling' && <Spelling words={section.words} />}
        {tab === 'games' && (
          wordHunterOpen ? (
            <WordHunterModule
              sectionId={sectionId}
              onBack={() => {
                setWordHunterOpen(false)
                learningApi.getSection(sectionId).then(({ section: s }) => setSection(s)).catch(() => undefined)
              }}
            />
          ) : (
            <div className="learning-games">
              <p>用当前小节单词闯关巩固（例句与干扰项来自「我的库 + 本节词」）：</p>
              <div className="learning-game-grid">
                <button
                  type="button"
                  className="learning-game-card learning-game-card--featured"
                  onClick={() => nav.go('conquer-planet')}
                >
                  <strong>征服星球</strong>
                  <span>词性军团 · 招募 / BOSS / 复习</span>
                </button>
                <button
                  type="button"
                  className="learning-game-card"
                  onClick={() => setWordHunterOpen(true)}
                >
                  <strong>Word Hunter</strong>
                  <span>战斗拼写 · 本节 {section.words.length} 词</span>
                </button>
                <button type="button" className="learning-game-card" onClick={() => nav.go('prep-game')}>
                  <strong>精灵起源</strong>
                  <span>中考精灵专项闯关</span>
                </button>
                <button type="button" className="learning-game-card" onClick={() => nav.go('sentence-game')}>
                  <strong>排兵布阵</strong>
                  <span>主谓宾定状补填空</span>
                </button>
              </div>
            </div>
          )
        )}
      </section>

      <div className="learning-section-footer">
        <button
          type="button"
          className="learning-primary learning-assess-button"
          onClick={() => nav.go('assessment', sectionId)}
        >
          完成练习，去测评 →
        </button>
      </div>
    </div>
  )
}
