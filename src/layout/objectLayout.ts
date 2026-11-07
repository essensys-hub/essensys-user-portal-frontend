/**
 * Disposition des objets (affichage-objets-2026-11-006) : logique commune aux lumières et aux volets.
 *
 * Un document par armoire et par genre : `order` (identifiants du catalogue, ordre choisi) et
 * `disabled` (objets masqués). Routes : GET /api/portal/{lights|shutters}/layout et
 * PUT /api/portal/admin/{lights|shutters}/layout. Le portail ne lit ni n'écrit rien dans l'armoire.
 */
export type LayoutKind = 'lights' | 'shutters';

export interface ObjectLayout {
  order: string[];
  disabled: string[];
  version: number;
  updated_at: string | null;
}

/** Disposition par défaut : ordre du catalogue, rien de désactivé. */
export const DEFAULT_LAYOUT: ObjectLayout = { order: [], disabled: [], version: 0, updated_at: null };

const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Normalise la réponse du GET ; une réponse illisible donne null (le client garde sa dernière valeur). */
export const parseLayout = (data: unknown): ObjectLayout | null => {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (!isStringList(d.order) || !isStringList(d.disabled)) return null;
  return {
    order: d.order,
    disabled: d.disabled,
    version: typeof d.version === 'number' ? d.version : 0,
    updated_at: typeof d.updated_at === 'string' ? d.updated_at : null,
  };
};

export interface EffectiveLayout {
  /** Tous les identifiants du catalogue dans l'ordre effectif (écran de gestion). */
  ordered: string[];
  /** Identifiants désactivés (inconnus ignorés). */
  disabled: ReadonlySet<string>;
  isActive: (id: string) => boolean;
  /** Vrai si l'ordre effectif diffère de l'ordre du catalogue (et non si `order` est vide). */
  reordered: boolean;
  /** Éléments d'un groupe (ou d'un écran sans groupe) : ordre effectif, désactivés retirés. */
  apply: <T extends { id: string }>(items: readonly T[]) => T[];
}

/**
 * Règle commune aux quatre clients : `order` d'abord (identifiants du catalogue, premier exemplaire),
 * puis les identifiants connus absents, dans l'ordre du catalogue ; les identifiants inconnus sont
 * ignorés. L'ordre ne s'applique qu'à l'intérieur de la liste reçue : un objet ne change pas de groupe.
 */
export const effectiveLayout = (catalogue: readonly string[], layout: ObjectLayout = DEFAULT_LAYOUT): EffectiveLayout => {
  const known = new Set(catalogue);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of layout.order) {
    if (known.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const id of catalogue) if (!seen.has(id)) ordered.push(id);
  const disabled = new Set(layout.disabled.filter((id) => known.has(id)));
  const rank = new Map(ordered.map((id, i) => [id, i]));
  return {
    ordered,
    disabled,
    isActive: (id) => !disabled.has(id),
    reordered: ordered.some((id, i) => id !== catalogue[i]),
    apply: <T extends { id: string }>(items: readonly T[]) =>
      items
        .filter((it) => !disabled.has(it.id))
        .sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)),
  };
};

/** Échange l'élément avec son voisin du même groupe (null si déjà en tête ou en queue de groupe). */
export const moveInGroup = (
  ordered: readonly string[],
  groupOf: (id: string) => string,
  id: string,
  direction: -1 | 1,
): string[] | null => {
  const from = ordered.indexOf(id);
  if (from < 0) return null;
  let to = from + direction;
  while (to >= 0 && to < ordered.length && groupOf(ordered[to]) !== groupOf(id)) to += direction;
  if (to < 0 || to >= ordered.length) return null;
  const next = [...ordered];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

/** Message clair pour une erreur de l'écriture de la disposition. */
export const layoutErrorMessage = (kind: LayoutKind, status: number, code?: string): string => {
  const label = kind === 'lights' ? 'des lumières' : 'des volets';
  if (status === 403) return `Modifier l'affichage ${label} est réservé à l'administrateur de l'armoire.`;
  if (status === 503) return "L'affichage est momentanément indisponible. Réessayez plus tard.";
  if (status === 400) {
    if (code === 'unknown_light' || code === 'unknown_shutter') return "Un objet est inconnu du serveur.";
    return 'Disposition refusée par le serveur.';
  }
  return `Enregistrement impossible (${status}).`;
};
