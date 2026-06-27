import { useEffect, useState } from 'react';
import type { SpellPrompt } from '../../domain/battle/battleTypes';
import type { WordEntry } from '../../domain/battle/battleTypes';

interface Props {
  prompt: SpellPrompt;
  entry: WordEntry;
  onSubmit: (inputs: Record<number, string>) => void;
}

export function SpellInput({ prompt, entry, onSubmit }: Props) {
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const submitted = prompt.submitted;

  useEffect(() => {
    setInputs({});
  }, [prompt.wordId, prompt.source]);

  const handleSubmit = () => {
    if (submitted) return;
    onSubmit(inputs);
  };

  return (
    <div>
      <p style={{ textAlign: 'center', color: '#aaa' }}>
        拼写「{entry.word}」— {prompt.source === 'owned' ? '1个关键字母' : '2个关键字母'}
      </p>
      <div className="spell-row">
        {prompt.displayChars.map((ch, i) =>
          ch === '_' ? (
            <input
              key={i}
              className="spell-input"
              maxLength={1}
              disabled={submitted}
              value={inputs[i] ?? ''}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, [i]: e.target.value.slice(-1) }))
              }
              aria-label={`字母位置 ${i + 1}`}
            />
          ) : (
            <span key={i} className="spell-char">
              {ch}
            </span>
          ),
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <button className="btn-primary" disabled={submitted} onClick={handleSubmit}>
          {submitted ? '已发射' : '发射'}
        </button>
      </div>
    </div>
  );
}
