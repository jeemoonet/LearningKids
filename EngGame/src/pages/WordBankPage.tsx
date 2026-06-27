import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { ElementBadge } from '../components/battle/ElementBadge';

export function WordBankPage() {
  const initGame = useGameStore((s) => s.initGame);
  const save = useGameStore((s) => s.save);
  const getWord = useGameStore((s) => s.getWord);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const ids = save?.ownedWordIds ?? [];

  return (
    <div className="page">
      <h1 className="title">大词库</h1>
      <p className="subtitle">已拥有 {ids.length} 个单词</p>
      <div className="prefill-list">
        {ids.map((id) => {
          const w = getWord(id);
          const m = save?.progress.wordMastery[id];
          return w ? (
            <div key={id} className="prefill-item">
              <span>
                <ElementBadge entry={w} /> {w.word} — {w.meaning}
              </span>
              <span className="tag">熟练 {m?.familiarity ?? 0}</span>
            </div>
          ) : null;
        })}
      </div>
      <Link to="/" style={{ display: 'inline-block', marginTop: 24 }}>
        ← 返回首页
      </Link>
    </div>
  );
}
