import type { Element, PartOfSpeech, WordEntry } from '../battle/battleTypes';

export const POS_TO_ELEMENT: Record<PartOfSpeech, Element> = {
  noun: 'metal',
  verb: 'fire',
  adjective: 'water',
  adverb: 'wood',
  other: 'earth',
};

export const ELEMENT_LABEL: Record<Element, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

export const POS_LABEL: Record<PartOfSpeech, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  other: '其他',
};

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
