import { describe, it, expect } from 'vitest';
import { DamageResolver } from '@/domain/element/DamageResolver';

describe('DamageResolver', () => {
  it('verb monster + adverb = synergy 1.2', () => {
    expect(DamageResolver.getAffinity('adverb', 'verb')).toBe('synergy');
  });

  it('verb monster + verb = resist 0.8', () => {
    expect(DamageResolver.getAffinity('verb', 'verb')).toBe('resist');
  });

  it('verb monster + noun = neutral 1.0', () => {
    expect(DamageResolver.getAffinity('noun', 'verb')).toBe('neutral');
  });

  it('applyToSeals accumulates 0.8 damage', () => {
    let broken = 0;
    let buffer = 0;
    for (let i = 0; i < 5; i++) {
      const r = DamageResolver.applyToSeals(broken, buffer, 0.8);
      broken = r.sealsBroken;
      buffer = r.buffer;
    }
    expect(broken).toBe(4);
    expect(buffer).toBeCloseTo(0);
  });
});
