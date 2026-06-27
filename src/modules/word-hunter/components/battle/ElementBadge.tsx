import type { PartOfSpeech, WordEntry } from '../../domain/battle/battleTypes';
import {
  ELEMENT_COLOR,
  ELEMENT_LABEL,
  getElementFromPos,
  getElementFromWord,
  POS_LABEL,
} from '../../domain/element/Element';

interface Props {
  entry: WordEntry;
  compact?: boolean;
}

export function ElementBadge({ entry, compact }: Props) {
  const el = getElementFromWord(entry);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: compact ? '0.75rem' : '0.85rem',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: ELEMENT_COLOR[el],
        }}
      />
      {POS_LABEL[entry.partOfSpeech]}
      {!compact && ` · ${ELEMENT_LABEL[el]}`}
    </span>
  );
}

export function MonsterPosBadge({ pos }: { pos: PartOfSpeech }) {
  const el = getElementFromPos(pos);
  return (
    <span className="monster-pos" style={{ borderLeft: `4px solid ${ELEMENT_COLOR[el]}` }}>
      妖性：{POS_LABEL[pos]}（{ELEMENT_LABEL[el]}）
    </span>
  );
}