/**
 * Noms personnalisés des lumières (noms-lumieres-2026-11-004).
 *
 * Les 33 lumières sont identifiées par l'`id` historique du portail. Le cloud renvoie, pour chacune,
 * le nom d'origine (`default`) et le nom personnalisé (`name`, null si aucun). Le nom affiché est
 * `name` s'il existe, sinon `default`. Routes : GET /api/portal/lights/names et
 * PUT /api/portal/admin/lights/names/{id}. Le nom est toujours rendu comme texte brut.
 */
export interface LightNameEntry {
  id: string;
  default: string;
}

/** Ordre d'affichage du contrat : 21 principales puis 12 indirectes. */
export const LIGHT_NAME_CATALOG: readonly LightNameEntry[] = [
  { id: 'terrasse', default: 'Terrasse' },
  { id: 'entree', default: 'Entrée' },
  { id: 'escalier', default: 'Escalier' },
  { id: 'deg1', default: 'Dégagement 1' },
  { id: 'deg2', default: 'Dégagement 2' },
  { id: 'pieceserv', default: 'Pièce de service' },
  { id: 'ann1', default: 'Annexe 1' },
  { id: 'ann2', default: 'Annexe 2' },
  { id: 'salon', default: 'Salon' },
  { id: 'sam', default: 'Salle à Manger' },
  { id: 'cuisine', default: 'Cuisine' },
  { id: 'sdb1', default: 'Salle de Bain 1' },
  { id: 'sdb2', default: 'Salle de Bain 2' },
  { id: 'wc1', default: 'WC 1' },
  { id: 'wc2', default: 'WC 2' },
  { id: 'bureau', default: 'Bureau' },
  { id: 'gdchamb', default: 'Grande Chambre' },
  { id: 'ptchamb1', default: 'Petite Chambre 1' },
  { id: 'ptchamb2', default: 'Petite Chambre 2' },
  { id: 'ptchamb3', default: 'Petite Chambre 3' },
  { id: 'dressing', default: 'Dressing' },
  { id: 'isalonind', default: 'Salon (indirect 1)' },
  { id: 'isalonind2', default: 'Salon (indirect 2)' },
  { id: 'icuisine', default: 'Cuisine (plans de travail)' },
  { id: 'isdb1', default: 'Salle de Bain 1 (miroir)' },
  { id: 'isdb2', default: 'Salle de Bain 2 (miroir)' },
  { id: 'igdchamb1', default: 'Grande Chambre (chevet 1)' },
  { id: 'igdchamb2', default: 'Grande Chambre (chevet 2)' },
  { id: 'iptchamb1', default: 'Petite Chambre 1 (chevet 1)' },
  { id: 'iptchamb2', default: 'Petite Chambre 1 (chevet 2)' },
  { id: 'iptchamb22', default: 'Petite Chambre 2 (chevet)' },
  { id: 'iptchamb3', default: 'Petite Chambre 3 (chevet)' },
  { id: 'idressing', default: 'Dressing (placards)' },
];

export const LIGHT_NAME_MAX_LENGTH = 40;

/** Noms personnalisés lus, par id ; une lumière sans nom personnalisé est absente. */
export type LightNameMap = Readonly<Record<string, string>>;

/** Nom d'origine d'une lumière (l'id lui-même si elle est inconnue du catalogue). */
export const defaultName = (id: string): string =>
  LIGHT_NAME_CATALOG.find((e) => e.id === id)?.default ?? id;

/** Nom affiché : le nom personnalisé s'il existe, sinon le nom d'origine. */
export const displayName = (id: string, names: LightNameMap = {}): string => names[id] ?? defaultName(id);

export type LightNameResult = { ok: true; name: string } | { ok: false; error: string };

/**
 * Règle du nom (design du change) : après suppression des espaces aux extrémités, 1 à 40 caractères
 * Unicode, sans caractère de contrôle ni `<` `>`. Le serveur reste seul juge.
 */
export const validateLightName = (input: string): LightNameResult => {
  const name = input.trim();
  const length = Array.from(name).length;
  if (length === 0) {
    return { ok: false, error: "Saisissez un nom, ou utilisez « Nom d'origine »." };
  }
  if (length > LIGHT_NAME_MAX_LENGTH) {
    return { ok: false, error: `Le nom ne doit pas dépasser ${LIGHT_NAME_MAX_LENGTH} caractères.` };
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(name)) {
    return { ok: false, error: 'Le nom ne doit pas contenir de caractère de contrôle.' };
  }
  if (/[<>]/.test(name)) {
    return { ok: false, error: 'Le nom ne doit pas contenir « < » ni « > ».' };
  }
  return { ok: true, name };
};

/**
 * Normalise la réponse du GET en table des noms personnalisés. Une entrée inconnue, sans nom ou au
 * nom invalide est ignorée (le nom d'origine s'affiche).
 */
export const parseLightNames = (data: unknown): LightNameMap => {
  const rows = (data as { lights?: unknown } | null)?.lights;
  const list = Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  const out: Record<string, string> = {};
  for (const entry of LIGHT_NAME_CATALOG) {
    const row = list.find((r) => r?.id === entry.id);
    if (row && typeof row.name === 'string') {
      const checked = validateLightName(row.name);
      if (checked.ok) out[entry.id] = checked.name;
    }
  }
  return out;
};

/** Message clair pour une erreur de l'écriture. */
export const lightNameErrorMessage = (status: number, code?: string): string => {
  if (status === 403) return "Renommer une lumière est réservé à l'administrateur de l'armoire.";
  if (status === 503) return 'Les noms sont momentanément indisponibles. Réessayez plus tard.';
  if (status === 400) {
    return code === 'unknown_light'
      ? 'Cette lumière est inconnue du serveur.'
      : 'Nom refusé : 1 à 40 caractères, sans « < » ni « > ».';
  }
  return `Enregistrement impossible (${status}).`;
};
