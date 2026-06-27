import { describe, it, expect } from 'vitest';
import { AmmoClip } from '@/domain/clip/AmmoClip';

describe('AmmoClip', () => {
  it('dedupes word ids on load', () => {
    const clip = new AmmoClip();
    clip.load([
      { wordId: 'word_hi', source: 'owned' },
      { wordId: 'word_hi', source: 'owned' },
      { wordId: 'word_no', source: 'owned' },
    ]);
    expect(clip.size).toBe(2);
  });

  it('upgrades owned slot instead of duplicating captured word', () => {
    const clip = new AmmoClip();
    clip.load([{ wordId: 'word_hi', source: 'owned' }]);
    const result = clip.addCaptured({
      wordId: 'word_hi',
      source: 'captured',
      capturedAtTurn: 1,
    });
    expect(result).toBe('upgraded');
    expect(clip.size).toBe(1);
    expect(clip.findSlot('word_hi')?.source).toBe('captured');
  });

  it('skips duplicate captured word', () => {
    const clip = new AmmoClip();
    clip.load([{ wordId: 'word_hi', source: 'captured', capturedAtTurn: 1 }]);
    const result = clip.addCaptured({
      wordId: 'word_hi',
      source: 'captured',
      capturedAtTurn: 2,
    });
    expect(result).toBe('skipped');
    expect(clip.size).toBe(1);
  });
});
