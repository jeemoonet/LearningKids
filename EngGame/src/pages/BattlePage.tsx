import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BattlePhase } from '../domain/battle/battleTypes';
import { SpellChecker } from '../domain/spell/SpellChecker';
import { useGameStore } from '../store/gameStore';
import { useCountdown } from '../hooks/useCountdown';
import { PlayerPanel } from '../components/battle/PlayerPanel';
import { MonsterPanel } from '../components/battle/MonsterPanel';
import { BattleArena } from '../components/battle/BattleArena';
import { AmmoClipCard } from '../components/battle/AmmoClipCard';
import '../styles/battle.css';

export function BattlePage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const id = Number(levelId ?? 1);
  const battle = useGameStore((s) => s.battle);
  const getLevel = useGameStore((s) => s.getLevel);
  const getWord = useGameStore((s) => s.getWord);
  const submitDefense = useGameStore((s) => s.submitDefense);
  const defenseTimeout = useGameStore((s) => s.defenseTimeout);
  const captureReplace = useGameStore((s) => s.captureReplace);
  const captureDiscard = useGameStore((s) => s.captureDiscard);
  const selectWord = useGameStore((s) => s.selectWord);
  const fireClip = useGameStore((s) => s.fireClip);
  const finishResolve = useGameStore((s) => s.finishResolve);
  const clearDefenseFeedback = useGameStore((s) => s.clearDefenseFeedback);
  const level = getLevel(id);
  const timeoutFired = useRef(false);
  const [spellInputs, setSpellInputs] = useState<Record<number, string>>({});
  const [firePulse, setFirePulse] = useState(false);

  const isDefense = battle?.phase === BattlePhase.DEFENSE_QUIZ;

  const onExpire = useCallback(() => {
    if (!timeoutFired.current) {
      timeoutFired.current = true;
      defenseTimeout();
    }
  }, [defenseTimeout]);

  const remaining = useCountdown(isDefense, battle?.timerSeconds ?? 10, onExpire);

  useEffect(() => {
    timeoutFired.current = false;
  }, [battle?.attackWordId, battle?.phase]);

  useEffect(() => {
    setSpellInputs({});
  }, [battle?.selectedWordId, battle?.turn]);

  useEffect(() => {
    const defenseFeedbackActive =
      battle?.lastDefenseCorrect !== null && Boolean(battle?.resolveMessage);
    if (
      battle?.phase === BattlePhase.PLAYER_SELECT &&
      !battle.selectedWordId &&
      battle.clip.length > 0 &&
      !defenseFeedbackActive
    ) {
      selectWord(battle.clip[0].wordId);
    }
  }, [
    battle?.phase,
    battle?.selectedWordId,
    battle?.clip,
    battle?.lastDefenseCorrect,
    battle?.resolveMessage,
    selectWord,
  ]);

  useEffect(() => {
    if (!battle) {
      navigate(`/preload/${id}`);
      return;
    }
    if (battle.phase === BattlePhase.VICTORY) {
      navigate(`/result/${id}?win=1`);
    }
    if (battle.phase === BattlePhase.DEFEAT) {
      navigate(`/result/${id}?win=0`);
    }
  }, [battle, id, navigate]);

  useEffect(() => {
    if (battle?.phase === BattlePhase.RESOLVE) {
      const t = setTimeout(() => finishResolve(), 2200);
      return () => clearTimeout(t);
    }
  }, [battle?.phase, finishResolve]);

  useEffect(() => {
    if (
      battle?.phase === BattlePhase.PLAYER_SELECT &&
      battle.lastDefenseCorrect !== null &&
      battle.resolveMessage
    ) {
      const t = setTimeout(() => clearDefenseFeedback(), 2200);
      return () => clearTimeout(t);
    }
  }, [
    battle?.phase,
    battle?.lastDefenseCorrect,
    battle?.resolveMessage,
    clearDefenseFeedback,
  ]);

  const canAttack =
    battle?.phase === BattlePhase.PLAYER_SELECT ||
    battle?.phase === BattlePhase.PLAYER_SPELL;
  const selectedId = battle?.selectedWordId ?? null;
  const selectedEntry = selectedId ? getWord(selectedId) : null;
  const selectedSlot =
    selectedId && battle ? battle.clip.find((s) => s.wordId === selectedId) : undefined;
  const clipPrompt =
    selectedEntry && selectedSlot
      ? SpellChecker.buildClipPrompt(selectedEntry, selectedSlot.source)
      : null;
  const canFire = Boolean(
    canAttack &&
      clipPrompt &&
      clipPrompt.blankIndices.every((idx) => (spellInputs[idx] ?? '').length === 1),
  );

  const handleFire = useCallback(() => {
    if (!selectedId || !clipPrompt) return;
    const inputs: Record<number, string> = {};
    for (const idx of clipPrompt.blankIndices) {
      const value = spellInputs[idx] ?? '';
      if (value.length !== 1) return;
      inputs[idx] = value;
    }
    fireClip(selectedId, inputs);
    setSpellInputs({});
    setFirePulse(true);
    window.setTimeout(() => setFirePulse(false), 550);
  }, [selectedId, clipPrompt, spellInputs, fireClip]);

  useEffect(() => {
    if (!canFire) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault();
      handleFire();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canFire, handleFire]);

  if (!battle || !level) return <div className="page">加载战斗…</div>;

  const attackWord = battle.attackWordId ? getWord(battle.attackWordId) : null;
  const recentMonsterWordId =
    battle.phase === BattlePhase.DEFENSE_QUIZ && battle.attackWordId
      ? battle.attackWordId
      : battle.monsterAttackLog[battle.monsterAttackLog.length - 1] ?? null;
  const recentMonsterWord = recentMonsterWordId ? getWord(recentMonsterWordId) : null;
  const isOverflow = battle.phase === BattlePhase.CAPTURE_OVERFLOW;
  const isDefenseFail =
    (battle.phase === BattlePhase.PLAYER_SELECT ||
      battle.phase === BattlePhase.PLAYER_SPELL) &&
    battle.lastDefenseCorrect === false &&
    Boolean(battle.resolveMessage);
  const defenseFeedbackActive =
    battle.lastDefenseCorrect !== null && Boolean(battle.resolveMessage);
  const bg = level.backgroundAsset ?? 'level-01-mist';

  return (
    <div
      className="battle-scene"
      style={{ backgroundImage: `url(/assets/backgrounds/${bg}.png)` }}
    >
      <header className="battle-topbar">
        <span>{level.name}</span>
        <span>回合 {battle.turn}</span>
        <span>弹药 {battle.clip.length}</span>
        {battle.isEnraged && <span className="tag resist">狂暴</span>}
      </header>

      <div className="battle-layout">
        {/* 左：玩家 + 弹药匣 + 发射 */}
        <div className="battle-column battle-column--left">
          <PlayerPanel battle={battle} compact damaged={isDefenseFail} />
          {!isOverflow && (
            <button
              type="button"
              className={`btn-fire btn-fire--global ${firePulse ? 'btn-fire--launching' : ''}`}
              disabled={!canFire}
              onClick={handleFire}
            >
              发射
            </button>
          )}
          <div className="ammo-clip-panel ammo-clip-panel--compact">
            {isOverflow && (
              <div className="overflow-box overflow-box--compact">
                <span>缴获入匣</span>
                <button type="button" className="btn-secondary btn-sm" onClick={captureDiscard}>
                  放弃
                </button>
              </div>
            )}
            <div className="ammo-clip-list">
              {battle.clip.map((slot, index) => {
                const w = getWord(slot.wordId);
                if (!w) return null;
                return (
                  <AmmoClipCard
                    key={`${slot.wordId}-${slot.source}-${index}`}
                    slot={slot}
                    entry={w}
                    isSelected={selectedId === slot.wordId}
                    isDisabled={(!canAttack && !isOverflow) || defenseFeedbackActive}
                    replaceMode={isOverflow}
                    inputs={spellInputs}
                    onSelect={selectWord}
                    onInputChange={(i, v) =>
                      setSpellInputs((prev) => ({ ...prev, [i]: v }))
                    }
                    onEnterFire={
                      selectedId === slot.wordId && canFire ? handleFire : undefined
                    }
                    onReplace={() => captureReplace(index)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 中：作战区 */}
        <div className="battle-column battle-column--center">
          <BattleArena
            level={level}
            battle={battle}
            attackWord={attackWord ?? null}
            remaining={remaining}
            onDefense={submitDefense}
          />
        </div>

        {/* 右：妖精立绘 + 词库 */}
        <div className="battle-column battle-column--right">
          <MonsterPanel
            level={level}
            battle={battle}
            recentWord={recentMonsterWord ?? null}
            attackWordId={isDefense ? battle.attackWordId : null}
            hitEffect={battle.phase === BattlePhase.RESOLVE ? battle.lastHitResult : null}
          />
        </div>
      </div>
    </div>
  );
}
