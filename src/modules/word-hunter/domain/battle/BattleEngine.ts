import {
  ATTACK_POS_OPTIONS,
  BattlePhase,
  type BattleState,
  type ClipSlot,
  type LevelConfig,
  type PartOfSpeech,
  type WordEntry,
} from './battleTypes';
import { AmmoClip } from '../clip/AmmoClip';
import { SpellChecker } from '../spell/SpellChecker';
import { DamageResolver } from '../element/DamageResolver';
import { DistractorGen } from '../quiz/DistractorGen';
import { MonsterAI } from '../monster/MonsterAI';
import type { WordBank } from '../word/WordBank';

const ENRAGE_TURN = 20;

export class BattleEngine {
  private state: BattleState
  private clip: AmmoClip
  private monsterAI: MonsterAI
  private level: LevelConfig
  private wordBank: WordBank

  constructor(
    level: LevelConfig,
    wordBank: WordBank,
    initialClip: ClipSlot[],
    themeWords: WordEntry[],
    learnedWords: WordEntry[],
    rng?: () => number,
  ) {
    this.level = level
    this.wordBank = wordBank
    this.clip = new AmmoClip();
    this.clip.load(initialClip);
    this.monsterAI = new MonsterAI(level, themeWords, learnedWords, rng);
    this.state = {
      phase: BattlePhase.INIT,
      levelId: level.id,
      turn: 0,
      playerHp: 100,
      playerMaxHp: 100,
      sealsBroken: 0,
      sealsTotal: 10,
      sealDamageBuffer: 0,
      monsterPartOfSpeech: level.monsterPartOfSpeech,
      combo: 0,
      isEnraged: false,
      attackWordId: null,
      defenseOptions: null,
      pendingCapture: null,
      selectedWordId: null,
      selectedPos: null,
      spellPrompt: null,
      timerSeconds: level.timerSeconds,
      timerRemaining: level.timerSeconds,
      clip: [...initialClip],
      hitLog: [],
      monsterAttackLog: [],
      damageLog: [],
      lastHitResult: null,
      lastDefenseCorrect: null,
      resolveMessage: null,
    };
  }

  getState(): Readonly<BattleState> {
    return this.state;
  }

  start(): void {
    this.startMonsterAttack();
  }

  submitDefense(optionId: string): void {
    if (this.state.phase !== BattlePhase.DEFENSE_QUIZ) return;

    const correct = this.state.defenseOptions?.find((o) => o.id === optionId)?.isCorrect ?? false;
    this.state.lastDefenseCorrect = correct;

    if (correct) {
      const captured: ClipSlot = {
        wordId: this.state.attackWordId!,
        source: 'captured',
        capturedAtTurn: this.state.turn,
      };

      if (this.clip.isFull && !this.clip.findSlot(captured.wordId)) {
        this.state = {
          ...this.state,
          phase: BattlePhase.CAPTURE_OVERFLOW,
          pendingCapture: captured,
          combo: this.state.combo + 1,
        };
        return;
      }

      const captureResult = this.clip.addCaptured(captured);
      this.state = {
        ...this.state,
        phase: BattlePhase.PLAYER_SELECT,
        clip: [...this.clip.all],
        pendingCapture: null,
        combo: this.state.combo + 1,
        resolveMessage:
          captureResult === 'skipped'
            ? '闪避成功！'
            : '闪避成功！缴获弹药入匣',
      };
      return;
    }

    const dmg = this.monsterAI.getDamage();
    this.state = {
      ...this.state,
      playerHp: this.state.playerHp - dmg,
      damageLog: [...this.state.damageLog, dmg],
      combo: 0,
      phase: BattlePhase.PLAYER_SELECT,
      resolveMessage: `认词失败，受到 ${dmg} 点伤害`,
    };
  }

  onDefenseTimeout(): void {
    this.submitDefense('__timeout__');
  }

  resolveCaptureOverflow(action: 'replace' | 'discard', replaceIndex?: number): void {
    if (this.state.phase !== BattlePhase.CAPTURE_OVERFLOW || !this.state.pendingCapture) return;

    if (action === 'replace' && replaceIndex !== undefined) {
      this.clip.replace(replaceIndex, this.state.pendingCapture);
    }

    this.state = {
      ...this.state,
      phase: BattlePhase.PLAYER_SELECT,
      clip: [...this.clip.all],
      pendingCapture: null,
      resolveMessage: action === 'replace' ? '已替换弹药' : '放弃缴获',
    };
  }

  selectAttribute(pos: PartOfSpeech): void {
    if (
      this.state.phase !== BattlePhase.PLAYER_SELECT &&
      this.state.phase !== BattlePhase.PLAYER_SPELL
    ) {
      return;
    }
    if (!ATTACK_POS_OPTIONS.includes(pos as (typeof ATTACK_POS_OPTIONS)[number])) return;

    const candidates = this.clip.all.filter((slot) => {
      const entry = this.wordBank.getEntry(slot.wordId);
      return entry?.partOfSpeech === pos;
    });
    if (candidates.length === 0) return;

    const picked = candidates[Math.floor(this.rng() * candidates.length)];
    const entry = this.wordBank.getEntry(picked.wordId);
    if (!entry) return;

    this.state = {
      ...this.state,
      phase: BattlePhase.PLAYER_SPELL,
      selectedWordId: picked.wordId,
      selectedPos: pos,
      spellPrompt: SpellChecker.buildClipPrompt(entry, picked.source),
    };
  }

  /** @deprecated 保留供测试；进攻改用 selectAttribute */
  selectAttackWord(wordId: string): void {
    if (
      this.state.phase !== BattlePhase.PLAYER_SELECT &&
      this.state.phase !== BattlePhase.PLAYER_SPELL
    ) {
      return;
    }

    const slot = this.clip.findSlot(wordId);
    const entry = this.wordBank.getEntry(wordId);
    if (!slot || !entry) return;

    this.state = {
      ...this.state,
      phase: BattlePhase.PLAYER_SPELL,
      selectedWordId: wordId,
      selectedPos: entry.partOfSpeech,
      spellPrompt: SpellChecker.buildClipPrompt(entry, slot.source),
    };
  }

  countAmmoByPos(): Record<PartOfSpeech, number> {
    const counts: Record<PartOfSpeech, number> = {
      noun: 0,
      verb: 0,
      adjective: 0,
      adverb: 0,
      prep: 0,
      pronoun: 0,
      other: 0,
    };
    for (const slot of this.clip.all) {
      const entry = this.wordBank.getEntry(slot.wordId);
      if (entry) counts[entry.partOfSpeech] += 1;
    }
    return counts;
  }

  private rng(): number {
    return Math.random();
  }

  private consumeSelectedAmmo(): void {
    const id = this.state.selectedWordId;
    if (!id) return;
    const idx = this.clip.all.findIndex((s) => s.wordId === id);
    if (idx >= 0) {
      this.clip.remove(idx);
      this.state.clip = [...this.clip.all];
    }
  }

  submitSpell(inputs: Record<number, string>): void {
    if (
      this.state.phase !== BattlePhase.PLAYER_SELECT &&
      this.state.phase !== BattlePhase.PLAYER_SPELL
    ) {
      return;
    }
    if (!this.state.selectedWordId || !this.state.spellPrompt) return;
    if (this.state.spellPrompt.submitted) return;

    const entry = this.wordBank.getEntry(this.state.selectedWordId!);
    if (!entry || !this.state.spellPrompt) return;

    const firedWordId = this.state.selectedWordId!;
    const result = SpellChecker.validate(this.state.spellPrompt, entry, inputs);

    // 发射后弹药消耗，无论命中与否
    this.consumeSelectedAmmo();

    if (result.correct) {
      const hit = DamageResolver.resolve(entry, this.state.monsterPartOfSpeech);
      const applied = DamageResolver.applyToSeals(
        this.state.sealsBroken,
        this.state.sealDamageBuffer,
        hit.rawDamage,
        this.state.sealsTotal,
      );
      hit.sealsBrokenThisHit = applied.brokenThisHit;

      this.state = {
        ...this.state,
        phase: BattlePhase.RESOLVE,
        selectedWordId: null,
        spellPrompt: null,
        sealsBroken: applied.sealsBroken,
        sealDamageBuffer: applied.buffer,
        lastHitResult: hit,
        combo: this.state.combo + 1,
        hitLog: [...this.state.hitLog, firedWordId],
        resolveMessage: `命中！${DamageResolver.affinityLabel(hit.affinity)}，击破 ${applied.brokenThisHit} 格封印`,
      };
    } else {
      this.state = {
        ...this.state,
        phase: BattlePhase.RESOLVE,
        selectedWordId: null,
        spellPrompt: null,
        combo: 0,
        lastHitResult: null,
        resolveMessage: '拼写错误，弹药已消耗',
      };
    }
  }

  clearDefenseFeedback(): void {
    if (this.state.phase !== BattlePhase.PLAYER_SELECT) return;
    this.state = {
      ...this.state,
      resolveMessage: null,
      lastDefenseCorrect: null,
      attackWordId: null,
    };
  }

  finishResolve(): void {
    if (this.state.phase !== BattlePhase.RESOLVE) return;

    if (this.state.sealsBroken >= this.state.sealsTotal) {
      this.state = { ...this.state, phase: BattlePhase.VICTORY };
      return;
    }
    if (this.state.playerHp <= 0) {
      this.state = { ...this.state, phase: BattlePhase.DEFEAT };
      return;
    }

    const turn = this.state.turn + 1;
    const isEnraged = turn >= ENRAGE_TURN;
    this.state = {
      ...this.state,
      turn,
      isEnraged,
      selectedWordId: null,
      selectedPos: null,
      spellPrompt: null,
      lastHitResult: null,
      lastDefenseCorrect: null,
      resolveMessage: null,
    };
    this.startMonsterAttack();
  }

  private startMonsterAttack(): void {
    const attackWord = this.monsterAI.pickAttackWord();
    const pool = this.wordBank.getAllEntries();
    const options = DistractorGen.build(attackWord, pool);
    const timer = this.monsterAI.getTimerSeconds(this.level.timerSeconds, this.state.isEnraged);

    this.state = {
      ...this.state,
      phase: BattlePhase.DEFENSE_QUIZ,
      attackWordId: attackWord.id,
      defenseOptions: options,
      timerSeconds: timer,
      timerRemaining: timer,
      monsterAttackLog: [...this.state.monsterAttackLog, attackWord.id],
    };
  }
}
