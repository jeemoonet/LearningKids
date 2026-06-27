import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { ElementBadge } from '../components/battle/ElementBadge';
import { MonsterPosBadge } from '../components/battle/ElementBadge';

export function PreloadPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const id = Number(levelId ?? 1);
  const initGame = useGameStore((s) => s.initGame);
  const prepareBattle = useGameStore((s) => s.prepareBattle);
  const startBattle = useGameStore((s) => s.startBattle);
  const prefill = useGameStore((s) => s.prefill);
  const getWord = useGameStore((s) => s.getWord);
  const getLevel = useGameStore((s) => s.getLevel);
  const level = getLevel(id);

  useEffect(() => {
    initGame();
    prepareBattle(id);
  }, [initGame, prepareBattle, id]);

  if (!level || !prefill) {
    return <div className="page">加载中…</div>;
  }

  return (
    <div className="page">
      <h1 className="title">战前预填</h1>
      <p className="subtitle">
        {level.name} · {level.monsterName}
      </p>
      <MonsterPosBadge pos={level.monsterPartOfSpeech} />
      <p style={{ marginTop: 16, color: '#aaa' }}>
        系统已装填 10 发弹药（5 最近学习 + 5 系统推荐）
      </p>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>最近学习（5）</h3>
        <div className="prefill-list">
          {prefill.recentIds.map((wid) => {
            const w = getWord(wid);
            return w ? (
              <div key={wid} className="prefill-item">
                <span>
                  {w.word} — {w.meaning}
                </span>
                <span className="tag recent">最近</span>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h3>系统推荐（5）</h3>
        <div className="prefill-list">
          {prefill.recommendedIds.map((wid) => {
            const w = getWord(wid);
            return w ? (
              <div key={wid} className="prefill-item">
                <span>
                  <ElementBadge entry={w} compact /> {w.word}
                </span>
                <span className="tag recommended">推荐</span>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ marginTop: 24, width: '100%' }}
        onClick={() => {
          startBattle(id);
          navigate(`/battle/${id}`);
        }}
      >
        开始战斗
      </button>
    </div>
  );
}
