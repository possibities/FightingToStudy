import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameStateProvider } from './state/GameStateContext.jsx';
import { ThemeProvider } from './theme/ThemeContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import StardustTrail from './components/StardustTrail.jsx';
import Layout from './components/Layout.jsx';
import Camp from './pages/Camp.jsx';

// 首屏只加载营地;冒险页(含 framer-motion)、图鉴、统计按需分包
const Adventure = lazy(() => import('./pages/Adventure.jsx'));
const Collection = lazy(() => import('./pages/Collection.jsx'));
const Stats = lazy(() => import('./pages/Stats.jsx'));

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <GameStateProvider>
          <StardustTrail />
          <BrowserRouter>
            <Suspense fallback={<div className="splash">🔥 正在点亮篝火…</div>}>
              <Routes>
                <Route path="/adventure" element={<Adventure />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Camp />} />
                  <Route path="collection" element={<Collection />} />
                  <Route path="stats" element={<Stats />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </GameStateProvider>
      </ToastProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
