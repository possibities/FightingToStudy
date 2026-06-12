import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const Ctx = createContext(null);

export function GameStateProvider({ children }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    try {
      setState(await api('/state'));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <Ctx.Provider value={{ state, refresh, error }}>{children}</Ctx.Provider>;
}

export const useGame = () => useContext(Ctx);
