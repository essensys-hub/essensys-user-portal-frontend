import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getShutterNames, setShutterName } from '../services/legacyApi';
import { displayName as displayNameOf, type ShutterNameMap } from './shutterNames';

/**
 * Magasin partagé des noms : une seule lecture pour toute l'application, et un renommage se voit
 * aussitôt dans les listes, l'écran Temps de course et les messages, sans rechargement.
 */
let names: ShutterNameMap = {};
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const publish = (next: ShutterNameMap) => {
  names = next;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const load = (): Promise<void> => {
  if (!loading) {
    loading = getShutterNames()
      .then((next) => {
        loaded = true;
        publish(next);
      })
      .catch((e) => {
        // Lecture impossible : les noms d'origine restent affichés, sans message bloquant.
        console.error(e);
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
};

/** Réinitialise le magasin (tests). */
export const resetShutterNamesStore = () => {
  names = {};
  loaded = false;
  loading = null;
  listeners.forEach((l) => l());
};

export const useShutterNames = () => {
  const current = useSyncExternalStore(subscribe, () => names);

  useEffect(() => {
    if (!loaded) void load();
  }, []);

  const displayName = useCallback((id: string) => displayNameOf(id, current), [current]);

  /** Enregistre un nom (null = nom d'origine) et met à jour l'affichage. */
  const rename = useCallback(async (id: string, name: string | null): Promise<'saved' | 'dry_run'> => {
    const mode = await setShutterName(id, name);
    if (mode === 'dry_run') return mode;
    const next = { ...names };
    if (name === null) delete next[id];
    else next[id] = name;
    publish(next);
    loaded = true;
    return mode;
  }, []);

  return { names: current, displayName, rename };
};
