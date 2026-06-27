import type { WordEntry } from '../domain/battle/battleTypes';

/**
 * 妖怪主题词列表：按缴获难度展示，固定使用 keySlots.captured 挖 2 个关键字母。
 */
export function buildMonsterThemeWordDisplay(entry: WordEntry): {
  displayChars: string[];
  hiddenIndices: number[];
} {
  const chars = entry.word.split('');
  const hiddenIndices = [...entry.keySlots.captured];
  const displayChars = chars.map((c, i) => (hiddenIndices.includes(i) ? '?' : c));
  return { displayChars, hiddenIndices };
}

/**
 * 妖怪抛词攻击：比玩家弹药更复杂，隐藏 2 个关键字母（有词条时用 captured 槽位）。
 */
export function buildMonsterWordDisplay(
  word: string,
  entry?: WordEntry | null,
): {
  displayChars: string[];
  hiddenIndices: number[];
} {
  if (entry) {
    return buildMonsterThemeWordDisplay(entry);
  }

  const chars = word.split('');
  const hiddenIndices: number[] = [];

  for (let i = 1; i < chars.length && hiddenIndices.length < 2; i++) {
    hiddenIndices.push(i);
  }
  if (hiddenIndices.length < 1 && chars.length > 1) {
    hiddenIndices.push(1);
  }

  const displayChars = chars.map((c, i) => (hiddenIndices.includes(i) ? '?' : c));
  return { displayChars, hiddenIndices };
}
