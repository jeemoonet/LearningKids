interface VocabTranslateButtonProps {
  show: boolean
  onToggle: () => void
  className?: string
}

/** 英文末尾的「译」按钮，点击切换中文显示 */
export function VocabTranslateButton({ show, onToggle, className = '' }: VocabTranslateButtonProps) {
  return (
    <button
      type="button"
      className={`vocab-translate-button${show ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      onClick={onToggle}
      aria-label={show ? '隐藏中文翻译' : '显示中文翻译'}
      aria-expanded={show}
      title={show ? '隐藏翻译' : '显示翻译'}
    >
      译
    </button>
  )
}
