import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameStateProvider } from './state/GameStateContext.jsx';
import { ThemeProvider } from './theme/ThemeContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import Camp from './pages/Camp.jsx';
import Adventure from './pages/Adventure.jsx';
import Collection from './pages/Collection.jsx';
import Stats from './pages/Stats.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GameStateProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/adventure" element={<Adventure />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Camp />} />
                <Route path="collection" element={<Collection />} />
                <Route path="stats" element={<Stats />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </GameStateProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
