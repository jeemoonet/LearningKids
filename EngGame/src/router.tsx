import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PreloadPage } from './pages/PreloadPage';
import { BattlePage } from './pages/BattlePage';
import { ResultPage } from './pages/ResultPage';
import { WordBankPage } from './pages/WordBankPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/words" element={<WordBankPage />} />
        <Route path="/preload/:levelId" element={<PreloadPage />} />
        <Route path="/battle/:levelId" element={<BattlePage />} />
        <Route path="/result/:levelId" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}
