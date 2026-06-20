import type { ParsedWordFrequency } from './wordFrequency'

/** 中考高频词标记（红色关注图标，无文字） */
export function HighFrequencyBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`vocab-high-freq-badge${className ? ` ${className}` : ''}`}
      title="中考高频词"
      aria-label="中考高频词"
    >
      <svg
        className="vocab-high-freq-icon"
        viewBox="0 0 16 16"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M8 1.25a.75.75 0 0 1 .67.41l1.58 3.2 3.53.51a.75.75 0 0 1 .42 1.28l-2.55 2.49.6 3.51a.75.75 0 0 1-1.09.79L8 11.98l-3.16 1.66a.75.75 0 0 1-1.09-.79l.6-3.51L1.8 6.65a.75.75 0 0 1 .42-1.28l3.53-.51 1.58-3.2A.75.75 0 0 1 8 1.25z"
        />
      </svg>
    </span>
  )
}

interface WordFrequencyTagProps {
  frequency: ParsedWordFrequency
  className?: string
}

/** 仅高频词显示红色关注图标，中低频不展示任何频率标记 */
export function WordFrequencyTag({ frequency, className = '' }: WordFrequencyTagProps) {
  if (frequency.freqLevel !== 'high') return null
  return <HighFrequencyBadge className={className} />
}
