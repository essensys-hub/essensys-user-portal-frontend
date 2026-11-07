/** Disposition des lumières (affichage-objets-2026-11-006) : catalogue, groupes et ordre effectif. */
import { LIGHT_NAME_CATALOG } from './lightNames';
import { effectiveLayout, type EffectiveLayout, type ObjectLayout } from '../layout/objectLayout';

export const LIGHT_IDS: readonly string[] = LIGHT_NAME_CATALOG.map((e) => e.id);

/** Les 21 premières lumières du catalogue sont principales, les 12 suivantes indirectes. */
export const LIGHT_MAIN_COUNT = 21;
export const lightGroupOf = (id: string): string => (LIGHT_IDS.indexOf(id) < LIGHT_MAIN_COUNT ? 'Principaux' : 'Indirects');

export const lightLayout = (layout?: ObjectLayout): EffectiveLayout => effectiveLayout(LIGHT_IDS, layout);
