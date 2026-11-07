/** Disposition des volets et stores (affichage-objets-2026-11-006) : catalogue, groupes et ordre effectif. */
import { SHUTTER_NAME_CATALOG } from './shutterNames';
import { effectiveLayout, type EffectiveLayout, type ObjectLayout } from '../layout/objectLayout';

export const SHUTTER_IDS: readonly string[] = SHUTTER_NAME_CATALOG.map((e) => e.id);

/** Les 14 premiers sont des volets, les 2 derniers (voletstore, store) des éléments spéciaux. */
export const SHUTTER_MAIN_COUNT = 14;
export const shutterGroupOf = (id: string): string => (SHUTTER_IDS.indexOf(id) < SHUTTER_MAIN_COUNT ? 'Volets' : 'Stores');

export const shutterLayout = (layout?: ObjectLayout): EffectiveLayout => effectiveLayout(SHUTTER_IDS, layout);
