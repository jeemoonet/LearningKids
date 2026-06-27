import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export function ResultPage() {
  const { levelId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const win = params.get('win') === '1';
  const getLevel = useGameStore((s) => s.getLevel);
  const getWord = useGameStore((s) => s.getWord);
  const onVictoryPersist = useGameStore((s) => s.onVictoryPersist);
  const resetBattle = useGameStore((s) => s.resetBattle);
  const level = getLevel(Number(levelId ?? 1));

  useEffect(() => {
    if (win) onVictoryPersist();
    return () => resetBattle();
  }, [win, onVictoryPersist, resetBattle]);

  if (!level) return null;

  return (
    <div className="page">
      <h1 className="title">{win ? '胜利！' : '战斗失败'}</h1>
      <p className="subtitle">
        {win
          ? `${level.monsterName} 已被击败，获得记忆碎片！`
          : '别灰心，复习后再来挑战'}
      </p>

      {win && (
        <div className="panel prefill-list">
          <h3>本关记忆单词</h3>
          {level.themeWordIds.map((id) => {
            const w = getWord(id);
            return w ? (
              <div key={id} className="prefill-item">
                <span>
                  {w.word} — {w.meaning}
                </span>
              </div>
            ) : null;
          })}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className="btn-primary" onClick={() => navigate('/')}>
          返回首页
        </button>
        {!win && (
          <button className="btn-secondary" onClick={() => navigate(`/preload/${level.id}`)}>
            再战
          </button>
        )}
      </div>
    </div>
  );
}
