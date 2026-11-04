import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkForUpdate, UpdateInfo } from '../utils/updateChecker';

const CHECK_INTERVAL_MS = 1000 * 60 * 60; // 1h while running

export function useUpdateChecker(autoCheck = true) {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (force = true) => {
    setChecking(true);
    try {
      const result = await checkForUpdate(force);
      setInfo(result);
      return result;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    check(false);

    // On foreground
    let lastState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (
        lastState.match(/inactive|background/) &&
        next === 'active'
      ) {
        check(false);
      }
      lastState = next;
    });

    // Periodic
    const id = setInterval(() => check(false), CHECK_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [autoCheck, check]);

  return { info, checking, check };
}