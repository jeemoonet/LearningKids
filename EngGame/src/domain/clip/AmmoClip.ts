import type { ClipSlot } from '../battle/battleTypes';

export class AmmoClip {
  static readonly MAX = 10;

  constructor(private slots: ClipSlot[] = []) {}

  get size(): number {
    return this.slots.length;
  }

  get isFull(): boolean {
    return this.slots.length >= AmmoClip.MAX;
  }

  get all(): readonly ClipSlot[] {
    return this.slots;
  }

  load(slots: ClipSlot[]): void {
    const seen = new Set<string>();
    const deduped: ClipSlot[] = [];
    for (const slot of slots) {
      if (seen.has(slot.wordId)) continue;
      seen.add(slot.wordId);
      deduped.push(slot);
    }
    if (deduped.length > AmmoClip.MAX) throw new Error('装填超限');
    this.slots = deduped;
  }

  addCaptured(slot: ClipSlot): 'added' | 'upgraded' | 'skipped' {
    const existingIdx = this.slots.findIndex((s) => s.wordId === slot.wordId);
    if (existingIdx >= 0) {
      if (this.slots[existingIdx].source === 'owned') {
        this.slots[existingIdx] = slot;
        return 'upgraded';
      }
      return 'skipped';
    }
    if (this.isFull) throw new Error('弹匣已满，需先替换');
    this.slots.push(slot);
    return 'added';
  }

  replace(index: number, slot: ClipSlot): void {
    this.slots[index] = slot;
    this.dedupeByWordId();
  }

  private dedupeByWordId(): void {
    const seen = new Set<string>();
    this.slots = this.slots.filter((s) => {
      if (seen.has(s.wordId)) return false;
      seen.add(s.wordId);
      return true;
    });
  }

  remove(index: number): void {
    this.slots.splice(index, 1);
  }

  findSlot(wordId: string): ClipSlot | undefined {
    return this.slots.find((s) => s.wordId === wordId);
  }
}
