import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getObjectLayout, putObjectLayout } from '../services/legacyApi';
import { DEFAULT_LAYOUT, type LayoutKind, type ObjectLayout } from './objectLayout';

/**
 * Magasin partagé de la disposition d'un genre : une seule lecture pour toute l'application.
 * Lecture impossible ou 404 : catalogue complet dans l'ordre d'origine ; après une lecture réussie,
 * une coupure passagère conserve la dernière disposition lue.
 */
interface Store {
  layout: ObjectLayout;
  loaded: boolean;
  loading: Promise<void> | null;
  listeners: Set<() => void>;
}

const stores: Record<LayoutKind, Store> = {
  lights: { layout: DEFAULT_LAYOUT, loaded: false, loading: null, listeners: new Set() },
  shutters: { layout: DEFAULT_LAYOUT, loaded: false, loading: null, listeners: new Set() },
};

const publish = (s: Store, next: ObjectLayout) => {
  s.layout = next;
  s.listeners.forEach((l) => l());
};

const load = (kind: LayoutKind): Promise<void> => {
  const s = stores[kind];
  if (!s.loading) {
    s.loading = getObjectLayout(kind)
      .then((next) => {
        // null : 404, échec ou réponse illisible → on garde la dernière valeur (défaut au départ).
        if (next) {
          s.loaded = true;
          publish(s, next);
        }
      })
      .finally(() => {
        s.loading = null;
      });
  }
  return s.loading;
};

/** Réinitialise les magasins (tests). */
export const resetObjectLayoutStores = () => {
  for (const s of Object.values(stores)) {
    s.layout = DEFAULT_LAYOUT;
    s.loaded = false;
    s.loading = null;
    s.listeners.forEach((l) => l());
  }
};

export const useObjectLayout = (kind: LayoutKind) => {
  const s = stores[kind];
  const layout = useSyncExternalStore(
    (l) => {
      s.listeners.add(l);
      return () => {
        s.listeners.delete(l);
      };
    },
    () => s.layout,
  );

  useEffect(() => {
    if (!s.loaded) void load(kind);
  }, [kind, s]);

  /** Une seule écriture : `{order, disabled}` ou `{reset:true}`. */
  const save = useCallback(
    async (body: { order: string[]; disabled: string[] } | { reset: true }): Promise<'saved' | 'dry_run'> => {
      const result = await putObjectLayout(kind, body);
      if (result.mode === 'saved' && result.layout) {
        s.loaded = true;
        publish(s, result.layout);
      }
      return result.mode;
    },
    [kind, s],
  );

  return { layout, save };
};
