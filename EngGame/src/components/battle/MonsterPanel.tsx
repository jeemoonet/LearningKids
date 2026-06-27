import type { BattleState, LevelConfig, WordEntry, HitResult } from '../../domain/battle/battleTypes';
import { buildMonsterThemeWordDisplay } from '../../utils/monsterWordMask';
import { MonsterPosBadge } from './ElementBadge';

interface Props {
  level: LevelConfig;
  battle: BattleState;
  recentWord: WordEntry | null;
  attackWordId?: string | null;
  hitEffect?: HitResult | null;
}

export function MonsterPanel({ level, battle, recentWord, attackWordId, hitEffect }: Props) {
  const asset = level.monsterAsset ?? 'mist';
  const sealRemaining = battle.sealsTotal - battle.sealsBroken;
  const sealPct = (sealRemaining / battle.sealsTotal) * 100;
  const isHit = Boolean(hitEffect);
  const sealBreak = (hitEffect?.sealsBrokenThisHit ?? 0) > 0;

  return (
    <aside className={`monster-panel ${isHit ? 'monster-panel--hit' : ''}`}>
      <header className="monster-panel__header">
        <h2 className="monster-panel__name">{level.monsterName}</h2>
        <MonsterPosBadge pos={level.monsterPartOfSpeech} />
        <div className={`hp-bar hp-bar--monster ${sealBreak ? 'hp-bar--seal-break' : ''}`}>
          <div className="hp-fill hp-fill--seal" style={{ width: `${sealPct}%` }} />
        </div>
        <p className="monster-panel__hp">
          封印 {sealRemaining}/{battle.sealsTotal}
        </p>
      </header>

      <div className="monster-panel__portrait">
        <img
          src={`/assets/monsters/${asset}.png`}
          alt={level.monsterName}
          className={`monster-panel__img ${isHit ? `monster-panel__img--hit monster-panel__img--${hitEffect?.affinity}` : ''}`}
        />
        {isHit && <div className="monster-hit-ring" aria-hidden />}
      </div>

      <div className="monster-panel__words">
        <p className="monster-panel__words-label">最近单词</p>
        {recentWord ? (
          <div
            className={`monster-word-item ${attackWordId === recentWord.id ? 'monster-word-item--active' : ''}`}
          >
            <div className="spell-row ammo-spell-row">
              {buildMonsterThemeWordDisplay(recentWord).displayChars.map((ch, i) =>
                ch === '?' ? (
                  <span key={i} className="monster-spell-blank">
                    ?
                  </span>
                ) : (
                  <span key={i} className="spell-char">
                    {ch}
                  </span>
                ),
              )}
            </div>
          </div>
        ) : (
          <p className="monster-panel__words-empty">等待妖精出词…</p>
        )}
      </div>
    </aside>
  );
}
