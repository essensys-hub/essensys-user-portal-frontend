/**
 * Temporisations des lumières (lumieres-temporisees-2026-11-003).
 *
 * L'armoire éteint six lumières après un délai (1 à 255 minutes, 0 = jamais). Le catalogue, la
 * validation et le formatage sont ici ; les routes sont décrites dans le design du change
 * (cloud : GET /api/portal/lights/timers, PUT /api/portal/admin/lights/timers/{id}).
 * Les clés ne servent qu'à l'information : le portail n'écrit jamais dans la table d'échange.
 */
export interface LightTimerEntry {
  id: string;
  label: string;
  key: number;
}

/** Ordre fixe du contrat : dressing, wc1, wc2, pieceserv, ann1, ann2. */
export const LIGHT_TIMER_CATALOG: readonly LightTimerEntry[] = [
  { id: 'dressing', label: 'Dressing', key: 521 },
  { id: 'wc1', label: 'WC 1', key: 555 },
  { id: 'wc2', label: 'WC 2', key: 556 },
  { id: 'pieceserv', label: 'Service', key: 557 },
  { id: 'ann1', label: 'Annexe 1', key: 561 },
  { id: 'ann2', label: 'Annexe 2', key: 562 },
];

export const LIGHT_TIMER_MIN_MINUTES = 1;
export const LIGHT_TIMER_MAX_MINUTES = 255;

export const lightTimerEntry = (id: string): LightTimerEntry | undefined =>
  LIGHT_TIMER_CATALOG.find((e) => e.id === id);

export const hasLightTimer = (id: string): boolean => lightTimerEntry(id) !== undefined;

/** Raccourcis : 15 min, 30 min, 1 h, Jamais (0). */
export const LIGHT_TIMER_SHORTCUTS: ReadonlyArray<{ minutes: number; label: string }> = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 0, label: 'Jamais' },
];

/** Valeur lue : entier 0 à 255, ou null si jamais lue (jamais 0 par défaut). */
export type LightTimerMinutes = number | null;

export const isValidMinutes = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= LIGHT_TIMER_MAX_MINUTES;

export type CustomMinutesResult = { ok: true; minutes: number } | { ok: false; error: string };

/** Valeur libre : entier de 1 à 255 ; 0 se choisit par « Jamais ». */
export const validateCustomMinutes = (input: string): CustomMinutesResult => {
  const text = input.trim();
  if (text === '') return { ok: false, error: 'Saisissez un nombre de minutes entre 1 et 255.' };
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Saisissez un nombre entier de minutes.' };
  const minutes = Number(text);
  if (minutes < LIGHT_TIMER_MIN_MINUTES || minutes > LIGHT_TIMER_MAX_MINUTES) {
    return {
      ok: false,
      error:
        minutes === 0
          ? 'Pour ne jamais éteindre, choisissez « Jamais ».'
          : `La durée doit être comprise entre ${LIGHT_TIMER_MIN_MINUTES} et ${LIGHT_TIMER_MAX_MINUTES} minutes.`,
    };
  }
  return { ok: true, minutes };
};

/** « 7 min », « 1 h », « 2 h », « Jamais », « inconnue ». */
export const formatMinutes = (minutes: LightTimerMinutes | undefined): string => {
  if (minutes === null || minutes === undefined || !isValidMinutes(minutes)) return 'inconnue';
  if (minutes === 0) return 'Jamais';
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
};

/** Administrateur de l'armoire : admin_local ou admin_global (le serveur reste seul juge). */
export const isLightTimerAdmin = (role: string | null | undefined): boolean =>
  role === 'admin_local' || role === 'admin_global';

export interface LightTimer extends LightTimerEntry {
  minutes: LightTimerMinutes;
}

/** Normalise la réponse du GET : ordre du catalogue, valeur invalide ou absente = null. */
export const parseLightTimers = (data: unknown): LightTimer[] => {
  const rows = (data as { timers?: unknown } | null)?.timers;
  const list = Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  return LIGHT_TIMER_CATALOG.map((entry) => {
    const row = list.find((r) => r?.id === entry.id);
    return { ...entry, minutes: row && isValidMinutes(row.minutes) ? row.minutes : null };
  });
};
