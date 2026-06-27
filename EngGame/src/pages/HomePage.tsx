import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export function HomePage() {
  const navigate = useNavigate();
  const initGame = useGameStore((s) => s.initGame);
  const save = useGameStore((s) => s.save);
  const ownedCount = save?.ownedWordIds.length ?? 0;
  const unlocked = save?.progress.unlockedLevel ?? 1;

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="page">
      <h1 className="title">Word Hunter</h1>
      <p className="subtitle">单词猎人 — 用单词作子弹，击败妖怪</p>
      <div className="panel">
        <p>词库：{ownedCount} 个单词</p>
        <p>已解锁关卡：{unlocked}</p>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => navigate('/preload/1')}>
          挑战第 1 关 · 迷雾小妖
        </button>
        <button className="btn-secondary" onClick={() => navigate('/words')}>
          查看词库
        </button>
      </div>
    </div>
  );
}
