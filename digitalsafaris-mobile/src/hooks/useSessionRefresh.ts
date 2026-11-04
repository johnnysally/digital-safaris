import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store';

const INTERVAL_MS = 60_000;

export function useSessionRefresh() {
  const { isAuthenticated, refresh } = useAuthStore();
  const stateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) return;

    const tick = () => {
      refresh().catch(() => {});
    };

    const id = setInterval(tick, INTERVAL_MS);

    const sub = AppState.addEventListener('change', (next) => {
      const prev = stateRef.current;
      stateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        tick();
      }
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [isAuthenticated, refresh]);
}

export default useSessionRefresh;