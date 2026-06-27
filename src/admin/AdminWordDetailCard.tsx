import { AdminWordActionButtons, AdminWordEditButton } from './AdminWordEditModal'
import { getThreeExamples, formatVerbTensesLine, getNounPlural, getVerbTenses } from '../modules/vocab-training/wordForms'
import type { VocabWord } from '../modules/vocab-training/types'
import { getWordDisplay } from '../modules/vocab-training/wordFrequency'
import { getSpeakableWord } from '../modules/vocab-training/VocabWordHeadline'
import { WordFrequencyTag } from '../modules/vocab-training/WordFrequencyTag'

interface AdminWordDetailCardProps {
  word: VocabWord
  regenerating?: boolean
  deleting?: boolean
  showRegenerate?: boolean
  alwaysShowEdit?: boolean
  onEdit: (word: VocabWord) => void
  onRegenerate?: (word: VocabWord) => void
  onDelete?: (word: VocabWord) => void
}

export function AdminWordDetailCard({
  word,
  regenerating = false,
  deleting = false,
  showRegenerate = false,
  alwaysShowEdit = false,
  onEdit,
  onRegenerate,
  onDelete,
}: AdminWordDetailCardProps) {
  const { baseWord, frequency } = getWordDisplay(word.word, word)
  const speakWord = getSpeakableWord(word.word, word)
  const examples = getThreeExamples(word)
  const verbTenses = word.pos === 'verb' ? getVerbTenses(speakWord) : null
  const plural = word.pos === 'noun' ? getNounPlural(speakWord) : null

  return (
    <article
      className={[
        'admin-word-detail-card',
        regenerating || deleting ? 'is-regenerating' : '',
        alwaysShowEdit ? 'admin-word-detail-card--always-edit' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showRegenerate && onRegenerate ? (
        <AdminWordActionButtons
          onEdit={() => onEdit(word)}
          onRegenerate={() => onRegenerate(word)}
          onDelete={onDelete ? () => onDelete(word) : undefined}
          regenerating={regenerating}
          deleting={deleting}
        />
      ) : (
        <AdminWordEditButton onClick={() => onEdit(word)} />
      )}

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
            {examples.slice(0, 1).map((example, index) => (
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
