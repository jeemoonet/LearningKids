import type { DefenseOption, WordEntry } from '../battle/battleTypes';
import { shuffle } from '../../utils/shuffle';

export class DistractorGen {
  static build(entry: WordEntry, pool: WordEntry[]): DefenseOption[] {
    const distractors = pool
      .filter((w) => w.id !== entry.id && w.meaning !== entry.meaning)
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options: DefenseOption[] = [
      { id: 'correct', text: entry.meaning, isCorrect: true },
      ...distractors.map((d, i) => ({
        id: `d${i}`,
        text: d.meaning,
        isCorrect: false,
      })),
    ];

    return shuffle(options);
  }
}
