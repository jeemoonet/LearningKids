import { describe, it, expect } from 'vitest';
import { SpellChecker } from '@/domain/spell/SpellChecker';
import type { WordEntry } from '@/domain/battle/battleTypes';

const apple: WordEntry = {
  id: 'word_apple',
  word: 'apple',
  meaning: '苹果',
  partOfSpeech: 'noun',
  keySlots: { own: [3], captured: [2, 3] },
};

describe('SpellChecker', () => {
  it('validates 1 blank for owned', () => {
    const prompt = SpellChecker.buildPrompt(apple, 'owned');
    const result = SpellChecker.validate(prompt, apple, { 3: 'l' });
    expect(result.correct).toBe(true);
  });

  it('fails on wrong letter', () => {
    const prompt = SpellChecker.buildPrompt(apple, 'owned');
    const result = SpellChecker.validate(prompt, apple, { 3: 'x' });
    expect(result.correct).toBe(false);
  });

  it('requires both blanks for captured', () => {
    const prompt = SpellChecker.buildPrompt(apple, 'captured');
    expect(prompt.blankIndices.length).toBe(2);
    const partial = SpellChecker.validate(prompt, apple, { 2: 'p', 3: 'x' });
    expect(partial.correct).toBe(false);
    const full = SpellChecker.validate(prompt, apple, { 2: 'p', 3: 'l' });
    expect(full.correct).toBe(true);
  });
});
