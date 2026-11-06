import { useCallback, useEffect, useState } from 'react';
import { getLightTimers, setLightTimer } from '../services/legacyApi';
import type { LightTimer, LightTimerMinutes } from './lightTimers';

/** Lecture des six temporisations (une seule requête pour la page) et fonctions du composant de réglage. */
export const useLightTimers = (enabled: boolean) => {
  const [timers, setTimers] = useState<LightTimer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<LightTimer[] | null> => {
    try {
      const next = await getLightTimers();
      setTimers(next);
      setError(null);
      return next;
    } catch (e) {
      console.error(e);
      setError('Impossible de lire les temporisations.');
      return null;
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const readValue = useCallback(
    async (id: string): Promise<LightTimerMinutes> => {
      const next = await reload();
      return next?.find((t) => t.id === id)?.minutes ?? null;
    },
    [reload],
  );

  const writeValue = useCallback((id: string, minutes: number) => setLightTimer(id, minutes), []);

  return { timers, error, reload, readValue, writeValue };
};
