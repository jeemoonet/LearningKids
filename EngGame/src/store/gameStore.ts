import { create } from 'zustand';
import type { BattleState, LevelConfig, PrefillResult, SaveData, WordEntry } from '../domain/battle/battleTypes';
import { BattleEngine } from '../domain/battle/BattleEngine';
import { AutoLoadout } from '../domain/loadout/AutoLoadout';
import { WordBank } from '../domain/word/WordBank';
import { createNewSave, getAllWordEntries, SaveService } from '../services/SaveService';
import level01 from '../data/levels/level-01.json';
import starterWords from '../data/words/starter-100.json';

const levels: Record<number, LevelConfig> = {
  1: level01 as LevelConfig,
};

interface GameStore {
  save: SaveData | null;
  wordBank: WordBank | null;
  engine: BattleEngine | null;
  battle: BattleState | null;
  prefill: PrefillResult | null;
  initGame: () => void;
  getWord: (id: string) => WordEntry | undefined;
  getLevel: (id: number) => LevelConfig | undefined;
  prepareBattle: (levelId: number) => PrefillResult | null;
  startBattle: (levelId: number) => void;
  submitDefense: (optionId: string) => void;
  defenseTimeout: () => void;
  captureReplace: (index: number) => void;
  captureDiscard: () => void;
  selectWord: (wordId: string) => void;
  fireClip: (wordId: string, inputs: Record<number, string>) => void;
  submitSpell: (inputs: Record<number, string>) => void;
  finishResolve: () => void;
  clearDefenseFeedback: () => void;
  onVictoryPersist: () => void;
  resetBattle: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  save: null,
  wordBank: null,
  engine: null,
  battle: null,
  prefill: null,

  initGame: () => {
    const entries = getAllWordEntries();
    let save = SaveService.load();
    if (!save) {
      const starterIds = (starterWords as WordEntry[]).map((w) => w.id);
      save = createNewSave(starterIds);
      SaveService.persist(save);
    }
    const wordBank = new WordBank(entries, save);
    set({ save, wordBank });
  },

  getWord: (id) => get().wordBank?.getEntry(id),

  getLevel: (id) => levels[id],

  prepareBattle: (levelId) => {
    const { wordBank } = get();
    const level = levels[levelId];
    if (!wordBank || !level) return null;
    const prefill = AutoLoadout.build(wordBank, level);
    set({ prefill });
    return prefill;
  },

  startBattle: (levelId) => {
    const { wordBank, prefill } = get();
    const level = levels[levelId];
    if (!wordBank || !level || !prefill) return;

    const themeWords = level.themeWordIds
      .map((id) => wordBank.getEntry(id))
      .filter((w): w is WordEntry => Boolean(w));
    const learnedWords = wordBank.getOwnedEntries();

    const engine = new BattleEngine(level, wordBank, prefill.slots, themeWords, learnedWords);
    engine.start();
    set({ engine, battle: { ...engine.getState() } });
  },

  submitDefense: (optionId) => {
    const { engine } = get();
    if (!engine) return;
    engine.submitDefense(optionId);
    set({ battle: { ...engine.getState() } });
  },

  defenseTimeout: () => {
    const { engine } = get();
    if (!engine) return;
    engine.onDefenseTimeout();
    set({ battle: { ...engine.getState() } });
  },

  captureReplace: (index) => {
    const { engine } = get();
    if (!engine) return;
    engine.resolveCaptureOverflow('replace', index);
    set({ battle: { ...engine.getState() } });
  },

  captureDiscard: () => {
    const { engine } = get();
    if (!engine) return;
    engine.resolveCaptureOverflow('discard');
    set({ battle: { ...engine.getState() } });
  },

  selectWord: (wordId) => {
    const { engine } = get();
    if (!engine) return;
    engine.selectAttackWord(wordId);
    set({ battle: { ...engine.getState() } });
  },

  fireClip: (wordId, inputs) => {
    const { engine } = get();
    if (!engine) return;
    engine.selectAttackWord(wordId);
    engine.submitSpell(inputs);
    set({ battle: { ...engine.getState() } });
  },

  submitSpell: (inputs) => {
    const { engine } = get();
    if (!engine) return;
    engine.submitSpell(inputs);
    set({ battle: { ...engine.getState() } });
  },

  finishResolve: () => {
    const { engine } = get();
    if (!engine) return;
    engine.finishResolve();
    set({ battle: { ...engine.getState() } });
  },

  clearDefenseFeedback: () => {
    const { engine } = get();
    if (!engine) return;
    engine.clearDefenseFeedback();
    set({ battle: { ...engine.getState() } });
  },

  onVictoryPersist: () => {
    const { wordBank, battle } = get();
    const level = battle ? levels[battle.levelId] : null;
    if (!wordBank || !level || !battle) return;

    wordBank.unlockWords(level.themeWordIds, 'victory');
    const save = wordBank.getSave();
    save.progress.unlockedLevel = Math.max(save.progress.unlockedLevel, level.id + 1);
    save.progress.stats.totalBattlesWon += 1;
    save.progress.stats.bestCombo = Math.max(save.progress.stats.bestCombo, battle.combo);
    SaveService.persist(save);
    set({ save, wordBank: new WordBank(getAllWordEntries(), save) });
  },

  resetBattle: () => {
    set({ engine: null, battle: null, prefill: null });
  },
}));
