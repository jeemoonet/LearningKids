import type { BattleState } from '../../domain/battle/battleTypes';

interface Props {
  battle: BattleState;
  compact?: boolean;
  damaged?: boolean;
}

export function PlayerPanel({ battle, compact, damaged }: Props) {
  return (
    <aside
      className={`battle-side battle-side--player ${compact ? 'battle-side--compact' : ''} ${damaged ? 'battle-side--damaged' : ''}`}
    >
      <div className={`side-portrait player-portrait ${compact ? 'side-portrait--sm' : ''}`}>
        <img src="/assets/ui/player-hero.svg" alt="单词猎人" className="portrait-img" />
      </div>
      <h2 className="side-name">单词猎人</h2>
      <div className="hp-bar hp-bar--side">
        <div
          className="hp-fill"
          style={{ width: `${(battle.playerHp / battle.playerMaxHp) * 100}%` }}
        />
      </div>
      <p className="hp-text">
        HP {battle.playerHp}/{battle.playerMaxHp}
        <span className="combo"> · Combo ×{battle.combo}</span>
      </p>
    </aside>
  );
}
