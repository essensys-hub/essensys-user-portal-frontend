/**
 * Noms personnalisés des volets et stores (noms-volets-2026-11-005), jumeau de lights/lightNames.ts.
 *
 * Les 16 volets et stores sont identifiés par l'`id` historique du portail. Le cloud renvoie, pour
 * chacun, le nom d'origine (`default`) et le nom personnalisé (`name`, null si aucun). Le nom
 * affiché est `name` s'il existe, sinon `default`. Routes : GET /api/portal/shutters/names et
 * PUT /api/portal/admin/shutters/names/{id}. Le nom est toujours rendu comme texte brut.
 */
import { LIGHT_NAME_MAX_LENGTH, validateLightName } from '../lights/lightNames';

export interface ShutterNameEntry {
  id: string;
  default: string;
}

/** Ordre d'affichage du contrat : 14 volets puis 2 éléments spéciaux. */
export const SHUTTER_NAME_CATALOG: readonly ShutterNameEntry[] = [
  { id: 'volet1salon', default: 'Volet 1 Salon' },
  { id: 'volet2salon', default: 'Volet 2 Salon' },
  { id: 'volet3salon', default: 'Volet 3 Salon' },
  { id: 'volet1salleamanger', default: 'Volet 1 Salle à Manger' },
  { id: 'volet2salleamanger', default: 'Volet 2 Salle à Manger' },
  { id: 'volet1cuisine', default: 'Volet 1 Cuisine' },
  { id: 'volet2cuisine', default: 'Volet 2 Cuisine' },
  { id: 'voletsdb', default: 'Volet Salle de Bain 1' },
  { id: 'volet1gdchamb', default: 'Volet 1 Grande Chambre' },
  { id: 'volet2gdchamb', default: 'Volet 2 Grande Chambre' },
  { id: 'volet1ptchamb', default: 'Volet Petite Chambre 1' },
  { id: 'volet2ptchamb', default: 'Volet Petite Chambre 2' },
  { id: 'volet3ptchamb', default: 'Volet Petite Chambre 3' },
  { id: 'voletbureau', default: 'Volet Bureau' },
  { id: 'voletstore', default: 'Volet "Store"' },
  { id: 'store', default: 'Store (banne)' },
];

export const SHUTTER_NAME_MAX_LENGTH = LIGHT_NAME_MAX_LENGTH;

/** Noms personnalisés lus, par id ; un volet sans nom personnalisé est absent. */
export type ShutterNameMap = Readonly<Record<string, string>>;

/** Nom d'origine d'un volet (l'id lui-même s'il est inconnu du catalogue). */
export const defaultName = (id: string): string =>
  SHUTTER_NAME_CATALOG.find((e) => e.id === id)?.default ?? id;

/** Nom affiché : le nom personnalisé s'il existe, sinon le nom d'origine. */
export const displayName = (id: string, names: ShutterNameMap = {}): string => names[id] ?? defaultName(id);

/** Règle du nom, identique à celle des lumières (design du change). Le serveur reste seul juge. */
export const validateShutterName = validateLightName;

/**
 * Normalise la réponse du GET en table des noms personnalisés. Une entrée inconnue, sans nom ou au
 * nom invalide est ignorée (le nom d'origine s'affiche).
 */
export const parseShutterNames = (data: unknown): ShutterNameMap => {
  const rows = (data as { shutters?: unknown } | null)?.shutters;
  const list = Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  const out: Record<string, string> = {};
  for (const entry of SHUTTER_NAME_CATALOG) {
    const row = list.find((r) => r?.id === entry.id);
    if (row && typeof row.name === 'string') {
      const checked = validateShutterName(row.name);
      if (checked.ok) out[entry.id] = checked.name;
    }
  }
  return out;
};

/** Message clair pour une erreur de l'écriture. */
export const shutterNameErrorMessage = (status: number, code?: string): string => {
  if (status === 403) return "Renommer un volet est réservé à l'administrateur de l'armoire.";
  if (status === 503) return 'Les noms sont momentanément indisponibles. Réessayez plus tard.';
  if (status === 400) {
    return code === 'unknown_shutter'
      ? 'Ce volet est inconnu du serveur.'
      : 'Nom refusé : 1 à 40 caractères, sans « < » ni « > ».';
  }
  return `Enregistrement impossible (${status}).`;
};
