import type { CSSProperties } from 'react';
import { BattlePhase } from '../../domain/battle/battleTypes';
import type { BattleState, LevelConfig, WordEntry } from '../../domain/battle/battleTypes';
import type { DefenseOption } from '../../domain/battle/battleTypes';
import { battleBackgroundUrl } from '../../assets';
import { DamageResolver } from '../../domain/element/DamageResolver';

interface Props {
  level: LevelConfig;
  battle: BattleState;
  attackWord: WordEntry | null;
  remaining: number;
  onDefense: (optionId: string) => void;
}

export function BattleArena({ level, battle, attackWord, remaining, onDefense }: Props) {
  const bg = level.backgroundAsset ?? 'level-01-mist';
  const bgUrl = battleBackgroundUrl(bg);

  if (battle.phase === BattlePhase.DEFENSE_QUIZ && attackWord) {
    return (
      <section
        className="battle-arena battle-arena--defense"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="arena-fx arena-fx--incoming" />
        <div className="arena-defense-core">
          <p className="arena-hint">妖精抛出单词 · 选择正确释义赢得本回合</p>
          <div className="countdown arena-countdown">⏱ {remaining}s</div>
          <div className="arena-attack-word-wrap">
            <p className="arena-attack-label">妖精抛出</p>
            <div className="arena-attack-word">{attackWord.word}</div>
          </div>
        </div>
        <div className="options-grid arena-options">
          {battle.defenseOptions?.map((opt) => (
            <DefenseOptionBtn key={opt.id} opt={opt} onPick={onDefense} />
          ))}
        </div>
      </section>
    );
  }

  if (battle.phase === BattlePhase.CAPTURE_OVERFLOW) {
    return (
      <section
        className="battle-arena"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <p className="arena-hint">弹药匣已满！请在左侧选择替换或放弃缴获</p>
      </section>
    );
  }

  const isDodgeSuccess =
    (battle.phase === BattlePhase.PLAYER_SELECT ||
      battle.phase === BattlePhase.PLAYER_SPELL) &&
    battle.lastDefenseCorrect === true &&
    Boolean(battle.resolveMessage);

  const isDefenseFail =
    (battle.phase === BattlePhase.PLAYER_SELECT ||
      battle.phase === BattlePhase.PLAYER_SPELL) &&
    battle.lastDefenseCorrect === false &&
    Boolean(battle.resolveMessage);

  if (isDefenseFail) {
    return (
      <section
        className="battle-arena battle-arena--damaged"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="arena-flash arena-flash--damage" aria-hidden />
        <div className="projectile-wrap projectile-wrap--incoming" aria-hidden>
          <div className="projectile projectile--incoming">
            <span className="projectile-trail" />
            <span className="projectile-core" />
          </div>
        </div>
        {attackWord && (
          <div className="incoming-word" aria-hidden>
            <span className="incoming-word-text">{attackWord.word}</span>
            <span className="incoming-word-trail" />
          </div>
        )}
        <div className="impact-burst impact-burst--damage" aria-hidden />
        <div className="damage-sparkles" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="damage-sparkle" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <div className="resolve-content">
          <p className="damage-banner">认词失败！</p>
          <p className="arena-message arena-message--damage arena-message--pop">
            {battle.resolveMessage}
          </p>
        </div>
        <p className="arena-hint arena-hint--after-damage">
          选中左侧弹药、填写空白，点击下方「发射」
        </p>
      </section>
    );
  }

  if (isDodgeSuccess) {
    return (
      <section
        className="battle-arena battle-arena--dodge"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="arena-flash arena-flash--dodge" aria-hidden />
        <div className="dodge-shield" aria-hidden>
          <span className="dodge-shield-ring" />
          <span className="dodge-shield-core">✦</span>
        </div>
        <div className="dodge-speedlines" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="dodge-speedline" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        {attackWord && (
          <div className="dodge-word-capture" aria-hidden>
            <span className="dodge-captured-word">{attackWord.word}</span>
            <span className="dodge-word-trail" />
          </div>
        )}
        <div className="dodge-sparkles" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="dodge-sparkle" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <div className="resolve-content">
          <p className="dodge-banner">闪避成功！</p>
          <p className="dodge-sub-banner">缴获弹药入匣</p>
        </div>
        <p className="arena-hint arena-hint--after-dodge">
          选中左侧弹药、填写空白，点击下方「发射」
        </p>
      </section>
    );
  }

  if (battle.phase === BattlePhase.RESOLVE && battle.lastHitResult) {
    const hit = battle.lastHitResult;
    const broken = hit.sealsBrokenThisHit;
    const artilleryTier = hit.artilleryTier ?? 0;
    const artilleryClass =
      artilleryTier === 2
        ? 'battle-arena--artillery-super'
        : artilleryTier === 1
          ? 'battle-arena--artillery-heavy'
          : '';
    const projectileArtilleryClass =
      artilleryTier === 2
        ? 'projectile--artillery-super'
        : artilleryTier === 1
          ? 'projectile--artillery-heavy'
          : '';
    const impactArtilleryClass =
      artilleryTier === 2
        ? 'impact-burst--artillery-super'
        : artilleryTier === 1
          ? 'impact-burst--artillery-heavy'
          : '';

    return (
      <section
        className={`battle-arena battle-arena--resolve battle-arena--resolve-hit battle-arena--resolve-${hit.affinity} ${artilleryClass}`}
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="arena-flash arena-flash--hit" aria-hidden />
        <div className="projectile-wrap" aria-hidden>
          <div className={`projectile projectile--${hit.affinity} ${projectileArtilleryClass}`}>
            <span className="projectile-trail" />
            <span className="projectile-core" />
          </div>
        </div>
        <div className={`impact-burst impact-burst--${hit.affinity} ${impactArtilleryClass}`} aria-hidden />
        {artilleryTier > 0 && <div className="artillery-shockwave" aria-hidden />}
        {broken > 0 && (
          <div className="seal-shards" aria-hidden>
            {Array.from({ length: broken * 4 }).map((_, i) => (
              <span key={i} className="seal-shard" style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        )}
        <div className="resolve-content">
          <p className="arena-message arena-message--pop">{battle.resolveMessage}</p>
          <p className="arena-damage arena-damage--pop">
            {DamageResolver.affinityLabel(hit.affinity)} · {hit.rawDamage.toFixed(1)} 伤害
          </p>
          {artilleryTier > 0 && (
            <p className="artillery-banner">
              {artilleryTier === 2 ? '超重炮发射！' : '重炮发射！'}（{hit.syllables} 音节）
            </p>
          )}
          {broken > 0 && (
            <p className="seal-break-banner">击破 {broken} 格封印！</p>
          )}
        </div>
      </section>
    );
  }

  if (battle.phase === BattlePhase.RESOLVE) {
    return (
      <section
        className="battle-arena battle-arena--resolve battle-arena--resolve-miss"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="projectile-wrap" aria-hidden>
          <div className="projectile projectile--miss">
            <span className="projectile-trail" />
            <span className="projectile-core" />
          </div>
        </div>
        <div className="resolve-content">
          <p className="arena-message arena-message--pop">{battle.resolveMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="battle-arena"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      {(battle.phase === BattlePhase.PLAYER_SELECT ||
        battle.phase === BattlePhase.PLAYER_SPELL) && (
        <>
          <p className="arena-hint">选中左侧弹药、填写空白，点击下方「发射」</p>
          <div className="arena-fx arena-fx--standby" />
        </>
      )}
      {battle.phase !== BattlePhase.PLAYER_SELECT &&
        battle.phase !== BattlePhase.PLAYER_SPELL &&
        battle.phase !== BattlePhase.DEFENSE_QUIZ &&
        !battle.resolveMessage && (
          <p className="arena-hint arena-hint--idle">准备下一轮…</p>
        )}
    </section>
  );
}

function DefenseOptionBtn({
  opt,
  onPick,
}: {
  opt: DefenseOption;
  onPick: (id: string) => void;
}) {
  return (
    <button type="button" className="option-btn arena-option" onClick={() => onPick(opt.id)}>
      {opt.text}
    </button>
  );
}
