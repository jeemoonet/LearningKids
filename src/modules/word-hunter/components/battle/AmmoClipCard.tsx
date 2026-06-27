import { useEffect, useRef } from 'react';
import { SpellChecker } from '../../domain/spell/SpellChecker';
import type { ClipSlot, WordEntry } from '../../domain/battle/battleTypes';

interface Props {
  slot: ClipSlot;
  entry: WordEntry;
  isSelected: boolean;
  isDisabled: boolean;
  replaceMode?: boolean;
  inputs: Record<number, string>;
  onSelect: (wordId: string) => void;
  onInputChange: (index: number, value: string) => void;
  onEnterFire?: () => void;
  onReplace?: () => void;
}

export function AmmoClipCard({
  slot,
  entry,
  isSelected,
  isDisabled,
  replaceMode = false,
  inputs,
  onSelect,
  onInputChange,
  onEnterFire,
  onReplace,
}: Props) {
  const prompt = SpellChecker.buildClipPrompt(entry, slot.source);
  const firstBlankRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSelected) {
      firstBlankRef.current?.focus();
    }
  }, [isSelected]);

  const activateInput = () => {
    if (!isDisabled && !isSelected) {
      onSelect(entry.id);
    }
  };

  if (replaceMode) {
    return (
      <button type="button" className="ammo-card ammo-card--replace" onClick={onReplace}>
        <div className="spell-row ammo-spell-row">
          {prompt.displayChars.map((ch, i) =>
            ch === '_' ? (
              <span key={i} className="spell-char spell-char--blank">
                _
              </span>
            ) : (
              <span key={i} className="spell-char">
                {ch}
              </span>
            ),
          )}
        </div>
        <span className="ammo-replace-label">替换</span>
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`ammo-card ammo-card--compact ${slot.source === 'captured' ? 'captured' : ''} ${isSelected ? 'active' : ''}`}
      onClick={() => !isDisabled && onSelect(entry.id)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' || isDisabled) return;
        e.preventDefault();
        if (isSelected && onEnterFire) {
          onEnterFire();
        } else {
          onSelect(entry.id);
        }
      }}
    >
      <div className="spell-row ammo-spell-row">
        {prompt.displayChars.map((ch, i) => {
          if (ch !== '_') {
            return (
              <span key={i} className="spell-char">
                {ch}
              </span>
            );
          }

          const isFirstBlank = prompt.blankIndices[0] === i;

          return (
            <input
              key={i}
              ref={isFirstBlank ? firstBlankRef : undefined}
              className="spell-input ammo-spell-input"
              maxLength={1}
              disabled={isDisabled}
              readOnly={!isSelected}
              value={isSelected ? (inputs[i] ?? '') : ''}
              onChange={(e) => onInputChange(i, e.target.value.slice(-1).toLowerCase())}
              onClick={(e) => {
                e.stopPropagation();
                activateInput();
              }}
              onFocus={(e) => {
                e.stopPropagation();
                activateInput();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onEnterFire) {
                  e.preventDefault();
                  e.stopPropagation();
                  onEnterFire();
                }
              }}
              aria-label="填写字母"
            />
          );
        })}
      </div>
    </div>
  );
}
