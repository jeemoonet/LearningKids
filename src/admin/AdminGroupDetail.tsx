import { useEffect, useMemo, useState } from 'react'
import type { AdminTierGroup } from './adminApi'
import { regenerateAdminPassage, regenerateAdminWord, updateAdminWord } from './adminApi'
import { AdminWordActionButtons, AdminWordEditModal, RegenerateIcon } from './AdminWordEditModal'
import { GroupCoverImage } from '../components/GroupCoverImage'
import { GroupCoverBadge } from '../components/GroupCoverPreviewModal'
import { hasGroupCover } from '../modules/vocab-training/groupCover'
import { splitPassageByWords } from '../modules/vocab-training/passageAudio'
import { getThreeExamples, formatVerbTensesLine, getNounPlural, getVerbTenses } from '../modules/vocab-training/wordForms'
import type { VocabPos, VocabTier, VocabTierId, VocabWord } from '../modules/vocab-training/types'
import { getWordDisplay } from '../modules/vocab-training/wordFrequency'
import { getSpeakableWord } from '../modules/vocab-training/VocabWordHeadline'
import { WordFrequencyTag } from '../modules/vocab-training/WordFrequencyTag'

const TIER_SHORT_LABEL: Record<VocabTierId, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

function PassageBlock({ text, words }: { text: string; words: string[] }) {
  const segments = useMemo(() => splitPassageByWords(text, words), [text, words])
  if (!text.trim()) return null

  return (
    <p className="admin-detail-passage-en">
      {segments.map((seg, index) =>
        seg.highlight ? (
          <mark key={index} className="admin-detail-passage-highlight">
            {seg.text}
          </mark>
        ) : (
          <span key={index}>{seg.text}</span>
        ),
      )}
    </p>
  )
}

interface AdminWordDetailRowProps {
  word: VocabWord
  tierLabel: string
  regenerating: boolean
  onEdit: (word: VocabWord) => void
  onRegenerate: (word: VocabWord) => void
}

function AdminWordDetailRow({
  word,
  tierLabel,
  regenerating,
  onEdit,
  onRegenerate,
}: AdminWordDetailRowProps) {
  const { baseWord, frequency } = getWordDisplay(word.word, word)
  const speakWord = getSpeakableWord(word.word, word)
  const examples = getThreeExamples(word)
  const verbTenses = word.pos === 'verb' ? getVerbTenses(speakWord) : null
  const plural = word.pos === 'noun' ? getNounPlural(speakWord) : null

  return (
    <article className={`admin-word-detail-card${regenerating ? ' is-regenerating' : ''}`}>
      <AdminWordActionButtons
        onEdit={() => onEdit(word)}
        onRegenerate={() => onRegenerate(word)}
        regenerating={regenerating}
      />

      <header className="admin-word-detail-head">
        <h3 className="admin-word-detail-word">{baseWord}</h3>
        {frequency && <WordFrequencyTag frequency={frequency} className="admin-word-detail-freq" />}
      </header>

      <dl className="admin-word-detail-grid">
        <div className="admin-word-detail-field">
          <dt>音标</dt>
          <dd>{word.phonetic || '暂无'}</dd>
        </div>
        <div className="admin-word-detail-field">
          <dt>管理层</dt>
          <dd>{tierLabel}</dd>
        </div>
        <div className="admin-word-detail-field">
          <dt>词性</dt>
          <dd>{word.posLabel || word.pos}</dd>
        </div>
        {verbTenses && (
          <div className="admin-word-detail-field admin-word-detail-field-wide">
            <dt>动词时态</dt>
            <dd className="admin-word-detail-forms">{formatVerbTensesLine(verbTenses)}</dd>
          </div>
        )}
        {plural && (
          <div className="admin-word-detail-field">
            <dt>复数</dt>
            <dd className="admin-word-detail-forms">{plural}</dd>
          </div>
        )}
        <div className="admin-word-detail-field admin-word-detail-field-wide">
          <dt>释义</dt>
          <dd>{word.meaningZh || '暂无'}</dd>
        </div>
      </dl>

      {examples.length > 0 ? (
        <div className="admin-word-detail-examples">
          <span className="admin-word-detail-examples-title">例句</span>
          <ul>
            {examples.map((example, index) => (
              <li key={index}>
                <p className="admin-word-detail-example-en">{example.en}</p>
                {example.zh && <p className="admin-word-detail-example-zh">{example.zh}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="admin-word-detail-no-example">暂无例句</p>
      )}
    </article>
  )
}

interface AdminGroupDetailProps {
  tier: VocabTier
  group: AdminTierGroup
  onBack: () => void
  onPreviewCover?: () => void
  onGroupChange?: (group: AdminTierGroup) => void
  nextGroupTitle?: string | null
  onOpenNextGroup?: () => void
}

export function AdminGroupDetail({
  tier,
  group,
  onBack,
  onPreviewCover,
  onGroupChange,
  nextGroupTitle = null,
  onOpenNextGroup,
}: AdminGroupDetailProps) {
  const [words, setWords] = useState(group.words)
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null)
  const [regeneratingWordId, setRegeneratingWordId] = useState<number | null>(null)
  const [regeneratingPassage, setRegeneratingPassage] = useState(false)
  const [passageEn, setPassageEn] = useState(group.passageEn)
  const [passageZh, setPassageZh] = useState(group.passageZh)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [regenerateError, setRegenerateError] = useState('')
  const [passageRegenerateError, setPassageRegenerateError] = useState('')

  useEffect(() => {
    setWords(group.words)
    setPassageEn(group.passageEn)
    setPassageZh(group.passageZh)
  }, [group])

  const coverAvailable = hasGroupCover(tier.id, group.groupIndex)
  const highlightWords = useMemo(
    () => words.map((word) => getWordDisplay(word.word, word).baseWord),
    [words],
  )
  const hasPassage = passageEn.trim().length > 0
  const tierLabel = TIER_SHORT_LABEL[tier.id] ?? tier.label

  const syncGroupWords = (nextWords: VocabWord[]) => {
    setWords(nextWords)
    onGroupChange?.({ ...group, words: nextWords })
  }

  const syncGroupPassage = (nextPassageEn: string, nextPassageZh: string) => {
    setPassageEn(nextPassageEn)
    setPassageZh(nextPassageZh)
    onGroupChange?.({ ...group, passageEn: nextPassageEn, passageZh: nextPassageZh, words })
  }

  const handleSaveWord = async (patch: {
    meaningZh: string
    exampleEn: string
    exampleZh: string
    pos: VocabPos
  }) => {
    if (!editingWord) return

    setSaving(true)
    setEditError('')
    try {
      const updated = await updateAdminWord(editingWord.id, {
        meaningZh: patch.meaningZh,
        exampleEn: patch.exampleEn,
        exampleZh: patch.exampleZh,
        pos: patch.pos !== editingWord.pos ? patch.pos : undefined,
      })
      const nextWords = words.map((item) => (item.id === updated.id ? updated : item))
      syncGroupWords(nextWords)
      setEditingWord(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRegeneratePassage = async () => {
    setRegeneratingPassage(true)
    setPassageRegenerateError('')
    try {
      const result = await regenerateAdminPassage(tier.id, group.groupIndex)
      syncGroupPassage(result.passageEn, result.passageZh)
    } catch (err) {
      setPassageRegenerateError(err instanceof Error ? err.message : '短文生成失败')
    } finally {
      setRegeneratingPassage(false)
    }
  }

  const handleRegenerateWord = async (word: VocabWord) => {
    setRegeneratingWordId(word.id)
    setRegenerateError('')
    try {
      const updated = await regenerateAdminWord(word.id)
      const nextWords = words.map((item) => (item.id === updated.id ? updated : item))
      syncGroupWords(nextWords)
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : '重新生成失败')
    } finally {
      setRegeneratingWordId(null)
    }
  }

  return (
    <div className="admin-group-detail">
      <header className="admin-detail-header">
        <button type="button" className="admin-btn admin-btn-outline admin-detail-back" onClick={onBack}>
          ← 返回小组列表
        </button>
        <div className="admin-detail-title-block">
          <h1>{group.title}</h1>
          <p>
            {tier.label} · 第 {group.groupIndex + 1} 组 · {group.wordCount} 词
          </p>
        </div>
      </header>

      <div className="admin-detail-layout">
        <section
          className={`admin-detail-passage-section${regeneratingPassage ? ' is-regenerating' : ''}`}
        >
          <div className="admin-detail-passage-head">
            <h2>场景短文</h2>
            {!hasPassage && !regeneratingPassage && (
              <span className="admin-detail-tag">暂无短文</span>
            )}
            <button
              type="button"
              className="admin-detail-passage-regen"
              onClick={() => void handleRegeneratePassage()}
              disabled={regeneratingPassage}
              title={hasPassage ? '重新生成场景短文' : '生成场景短文'}
              aria-label={hasPassage ? '重新生成场景短文' : '生成场景短文'}
            >
              {regeneratingPassage ? (
                <span className="admin-word-action-spinner" aria-hidden="true" />
              ) : (
                <RegenerateIcon />
              )}
            </button>
          </div>
          {passageRegenerateError && (
            <p className="admin-alert admin-alert-error admin-detail-passage-error">
              {passageRegenerateError}
            </p>
          )}

          {coverAvailable && (
            <div className="admin-detail-cover-wrap">
              <GroupCoverImage
                tierId={tier.id}
                groupIndex={group.groupIndex}
                title={group.title}
                className="admin-detail-cover"
              />
              {onPreviewCover && (
                <button
                  type="button"
                  className="admin-detail-cover-preview"
                  onClick={onPreviewCover}
                  title="查看大图"
                >
                  <GroupCoverBadge />
                </button>
              )}
            </div>
          )}

          {hasPassage ? (
            <div className="admin-detail-passage-body">
              <PassageBlock text={passageEn} words={highlightWords} />
              {passageZh.trim() && <p className="admin-detail-passage-zh">{passageZh}</p>}
            </div>
          ) : (
            !regeneratingPassage && (
              <p className="admin-detail-passage-empty">该小组尚未配置英文短文。</p>
            )
          )}

          {nextGroupTitle && onOpenNextGroup && (
            <button
              type="button"
              className="admin-detail-passage-next"
              onClick={onOpenNextGroup}
            >
              下一课：{nextGroupTitle}
            </button>
          )}
        </section>

        <section className="admin-detail-words-section">
          <h2>单词详情</h2>
          {regenerateError && <p className="admin-alert admin-alert-error">{regenerateError}</p>}
          <div className="admin-word-detail-list">
            {words.map((word) => (
              <AdminWordDetailRow
                key={word.id}
                word={word}
                tierLabel={tierLabel}
                regenerating={regeneratingWordId === word.id}
                onEdit={(item) => {
                  setEditError('')
                  setEditingWord(item)
                }}
                onRegenerate={(item) => void handleRegenerateWord(item)}
              />
            ))}
          </div>
        </section>
      </div>

      <AdminWordEditModal
        open={editingWord != null}
        word={editingWord}
        saving={saving}
        error={editError}
        onClose={() => {
          if (!saving) setEditingWord(null)
        }}
        onSave={(patch) => void handleSaveWord(patch)}
      />
    </div>
  )
}
