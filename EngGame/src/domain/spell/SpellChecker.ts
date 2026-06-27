import type { ClipWordSource, WordEntry } from '../battle/battleTypes';
import type { SpellPrompt } from '../battle/battleTypes';

export interface SpellValidationResult {
  correct: boolean;
  wrongIndices: number[];
}

export class SpellChecker {
  static buildPrompt(entry: WordEntry, source: ClipWordSource): SpellPrompt {
    const indices =
      source === 'owned' ? [...entry.keySlots.own] : [...entry.keySlots.captured];
    const chars = entry.word.split('');
    const displayChars = chars.map((c, i) => (indices.includes(i) ? '_' : c));

    return {
      wordId: entry.id,
      source,
      displayChars,
      blankIndices: indices,
      submitted: false,
    };
  }

  /** 弹药匣展示：自有词 1 空、缴获词 2 空 */
  static buildClipPrompt(entry: WordEntry, source: ClipWordSource): SpellPrompt {
    return SpellChecker.buildPrompt(entry, source);
  }

  /** 进攻拼写：全部字母空白，给中文释义让玩家完整填写 */
  static buildFullPrompt(entry: WordEntry, source: ClipWordSource): SpellPrompt {
    const chars = entry.word.split('');
    return {
      wordId: entry.id,
      source,
      displayChars: chars.map(() => '_'),
      blankIndices: chars.map((_, i) => i),
      submitted: false,
    };
  }

  static validate(
    prompt: SpellPrompt,
    entry: WordEntry,
    inputs: Record<number, string>,
  ): SpellValidationResult {
    const wrongIndices: number[] = [];

    for (const idx of prompt.blankIndices) {
      const expected = entry.word[idx].toLowerCase();
      const actual = (inputs[idx] ?? '').toLowerCase();
      if (expected !== actual) wrongIndices.push(idx);
    }

    return { correct: wrongIndices.length === 0, wrongIndices };
  }
}
