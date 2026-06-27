import type { Element, PartOfSpeech, WordEntry } from '../battle/battleTypes';

export const POS_TO_ELEMENT: Record<PartOfSpeech, Element> = {
  noun: 'metal',
  verb: 'fire',
  adjective: 'water',
  adverb: 'wood',
  prep: 'earth',
  pronoun: 'metal',
  other: 'earth',
};

export const ELEMENT_LABEL: Record<Element, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

/** 六大战斗种族统一叫法（我的世界 / 军团 / 战斗共用） */
export const RACE_LABEL: Record<PartOfSpeech, string> = {
  noun: '平民 NOUN',
  verb: '武士 VERB',
  adjective: '学者 ADJ',
  adverb: '魔法师 ADV',
  prep: '精灵 PREP',
  pronoun: '贵族 PRON',
  other: '其他 OTHER',
};

export const POS_LABEL: Record<PartOfSpeech, string> = RACE_LABEL;

export const ELEMENT_COLOR: Record<Element, string> = {
  metal: '#9aa0a6',
  wood: '#34a853',
  water: '#4285f4',
  fire: '#ea4335',
  earth: '#fbbc04',
};

export function getElementFromWord(entry: WordEntry): Element {
  return POS_TO_ELEMENT[entry.partOfSpeech];
}

export function getElementFromPos(pos: PartOfSpeech): Element {
  return POS_TO_ELEMENT[pos];
}
