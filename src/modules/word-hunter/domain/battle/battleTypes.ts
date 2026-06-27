export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'prep'
  | 'pronoun'
  | 'other';

/** 进攻时可选择的四种词性属性 */
export const ATTACK_POS_OPTIONS: Array<
  Exclude<PartOfSpeech, 'other' | 'prep' | 'pronoun'>
> = ['noun', 'verb', 'adjective', 'adverb'];
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'earth';
export type ClipWordSource = 'owned' | 'captured';
export type PrefillTag = 'recent' | 'recommended';
export type LearnedVia = 'starter' | 'victory' | 'captured';
export type PosAffinity = 'synergy' | 'resist' | 'neutral';

export interface WordEntry {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  theme?: string;
  difficulty?: 1 | 2 | 3;
  partOfSpeech: PartOfSpeech;
  keySlots: {
    own: number[];
    captured: number[];
  };
  keySlotHint?: string;
  /** 挖空例句，如 "I write a ___ every day." */
  clozeSentence?: string;
  /** 例句中文 */
  clozeSentenceZh?: string;
  exampleEn?: string;
  exampleZh?: string;
}

export interface MonsterSkill {
  type: 'damage_reduction' | 'burn' | 'shorter_timer' | 'blur_options' | 'image_attack';
  value?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  monsterName: string;
  monsterAsset: string;
  backgroundAsset?: string;
  monsterPartOfSpeech: PartOfSpeech;
  themeWordIds: string[];
  isTutorialLevel?: boolean;
  damageMultiplier?: number;
  timerSeconds: number;
  skills: MonsterSkill[];
  attackPoolWeights: {
    theme: number;
    learned: number;
  };
}

export interface ClipSlot {
  wordId: string;
  source: ClipWordSource;
  prefillTag?: PrefillTag;
  capturedAtTurn?: number;
}

export interface WordMastery {
  wordId: string;
  familiarity: number;
  learnedVia: LearnedVia;
  firstLearnedAt: string;
  lastReviewedAt?: string;
}

export interface PlayerProgress {
  version: number;
  unlockedLevel: number;
  wordMastery: Record<string, WordMastery>;
  stats: {
    totalBattlesWon: number;
    totalWordsLearned: number;
    bestCombo: number;
  };
}

export interface SaveData {
  version: 1;
  progress: PlayerProgress;
  ownedWordIds: string[];
  updatedAt: string;
}

export const BattlePhase = {
  INIT: 'INIT',
  MONSTER_ATTACK: 'MONSTER_ATTACK',
  DEFENSE_QUIZ: 'DEFENSE_QUIZ',
  CAPTURE_OVERFLOW: 'CAPTURE_OVERFLOW',
  PLAYER_SELECT: 'PLAYER_SELECT',
  PLAYER_SPELL: 'PLAYER_SPELL',
  RESOLVE: 'RESOLVE',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
} as const

export type BattlePhase = (typeof BattlePhase)[keyof typeof BattlePhase]

export interface DefenseOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface SpellPrompt {
  wordId: string;
  source: ClipWordSource;
  displayChars: string[];
  blankIndices: number[];
  submitted: boolean;
}

export interface HitResult {
  wordPos: PartOfSpeech;
  monsterPos: PartOfSpeech;
  affinity: PosAffinity;
  damageMultiplier: number;
  rawDamage: number;
  sealsBrokenThisHit: number;
}

export interface BattleState {
  phase: BattlePhase;
  levelId: number;
  turn: number;
  playerHp: number;
  playerMaxHp: number;
  sealsBroken: number;
  sealsTotal: number;
  sealDamageBuffer: number;
  monsterPartOfSpeech: PartOfSpeech;
  combo: number;
  isEnraged: boolean;
  attackWordId: string | null;
  defenseOptions: DefenseOption[] | null;
  pendingCapture: ClipSlot | null;
  selectedWordId: string | null;
  selectedPos: PartOfSpeech | null;
  spellPrompt: SpellPrompt | null;
  timerSeconds: number;
  timerRemaining: number;
  clip: ClipSlot[];
  hitLog: string[];
  /** 妖怪历次抛词 id，用于右侧记忆词库展示最近 3 个 */
  monsterAttackLog: string[];
  damageLog: number[];
  lastHitResult: HitResult | null;
  lastDefenseCorrect: boolean | null;
  resolveMessage: string | null;
}

export interface PrefillResult {
  slots: ClipSlot[];
  recentIds: string[];
  recommendedIds: string[];
}
