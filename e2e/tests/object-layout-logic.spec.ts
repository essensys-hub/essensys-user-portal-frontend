/**
 * Logique pure de la disposition des objets (affichage-objets-2026-11-006) : pas de navigateur, pas de réseau.
 * NR: NR-portal-frontend-13 essensys-hub/essensys-feature-lifecycle#41
 * NR: NR-portal-frontend-13 essensys-hub/essensys-feature-lifecycle#52
 */
import { test, expect } from '@playwright/test';
import { DEFAULT_LAYOUT, effectiveLayout, layoutErrorMessage, moveInGroup, parseLayout } from '../../src/layout/objectLayout';
import { LIGHT_IDS, lightGroupOf, lightLayout } from '../../src/lights/lightLayout';
import { SHUTTER_IDS, shutterGroupOf, shutterLayout } from '../../src/shutters/shutterLayout';

const layoutOf = (order: string[], disabled: string[]) => ({ ...DEFAULT_LAYOUT, order, disabled, version: 1 });

test.describe('disposition des objets : logique', () => {
  test('@nr NR-portal-frontend-13 catalogues : 33 lumieres (21 + 12) et 16 volets (14 + 2)', () => {
    expect(LIGHT_IDS).toHaveLength(33);
    expect(SHUTTER_IDS).toHaveLength(16);
    expect(LIGHT_IDS.filter((i) => lightGroupOf(i) === 'Principaux')).toHaveLength(21);
    expect(LIGHT_IDS.filter((i) => lightGroupOf(i) === 'Indirects')).toHaveLength(12);
    expect(SHUTTER_IDS.filter((i) => shutterGroupOf(i) === 'Volets')).toHaveLength(14);
    expect(SHUTTER_IDS.filter((i) => shutterGroupOf(i) === 'Stores')).toEqual(['voletstore', 'store']);
  });

  test('@nr NR-portal-frontend-13 defaut : ordre du catalogue, rien de desactive', () => {
    const e = lightLayout();
    expect(e.ordered).toEqual([...LIGHT_IDS]);
    expect(e.disabled.size).toBe(0);
    expect(shutterLayout(DEFAULT_LAYOUT).ordered).toEqual([...SHUTTER_IDS]);
  });

  test('@nr NR-portal-frontend-13 ordre incomplet et identifiant inconnu : inconnus ignores, absents ajoutes a la fin', () => {
    const e = effectiveLayout(['a', 'b', 'c', 'd'], layoutOf(['c', 'zzz', 'a'], []));
    expect(e.ordered).toEqual(['c', 'a', 'b', 'd']);
  });

  test('@nr NR-portal-frontend-13 doublon dans order : premier exemplaire seulement', () => {
    expect(effectiveLayout(['a', 'b', 'c'], layoutOf(['b', 'a', 'b'], [])).ordered).toEqual(['b', 'a', 'c']);
  });

  test('@nr NR-portal-frontend-13 desactives : inconnus ignores, objets retires des groupes', () => {
    const e = lightLayout(layoutOf([], ['wc2', 'inconnu']));
    expect([...e.disabled]).toEqual(['wc2']);
    expect(e.isActive('wc2')).toBe(false);
    const items = LIGHT_IDS.slice(0, 21).map((id) => ({ id }));
    const active = e.apply(items);
    expect(active).toHaveLength(20);
    expect(active.some((i) => i.id === 'wc2')).toBe(false);
  });

  test('@nr NR-portal-frontend-13 tout desactive : groupe vide, ecran de gestion garde tous les objets', () => {
    const e = lightLayout(layoutOf([], [...LIGHT_IDS]));
    expect(e.apply(LIGHT_IDS.map((id) => ({ id })))).toEqual([]);
    expect(e.ordered).toHaveLength(33);
  });

  test('@nr NR-portal-frontend-13 ordre global applique dans chaque groupe sans changer de groupe', () => {
    // volet2salon avant volet1salon ; store en tête de l'ordre global
    const e = shutterLayout(layoutOf(['store', 'volet2salon', 'volet1salon'], []));
    const volets = e.apply(SHUTTER_IDS.slice(0, 14).map((id) => ({ id })));
    expect(volets.slice(0, 2).map((i) => i.id)).toEqual(['volet2salon', 'volet1salon']);
    expect(volets).toHaveLength(14);
    expect(e.apply(SHUTTER_IDS.slice(14).map((id) => ({ id }))).map((i) => i.id)).toEqual(['store', 'voletstore']);
    // Ecrans sans groupe : ordre global filtré
    expect(e.apply(SHUTTER_IDS.map((id) => ({ id })))[0].id).toBe('store');
  });

  test('@nr NR-portal-frontend-13 monter / descendre : echange avec le voisin du meme groupe', () => {
    const ordered = [...LIGHT_IDS];
    const up = moveInGroup(ordered, lightGroupOf, 'sam', -1);
    expect(up?.slice(8, 10)).toEqual(['sam', 'salon']);
    // Premier du groupe indirect : ne remonte pas dans le groupe principal
    expect(moveInGroup(ordered, lightGroupOf, 'isalonind', -1)).toBeNull();
    // Dernier du groupe principal : ne descend pas dans l'indirect
    expect(moveInGroup(ordered, lightGroupOf, 'dressing', 1)).toBeNull();
    expect(moveInGroup(ordered, lightGroupOf, 'idressing', 1)).toBeNull();
    // Voisin d'un autre groupe intercale dans l'ordre global : on saute au voisin du même groupe
    const mixed = ['voletstore', 'volet1salon', 'store', 'volet2salon'];
    expect(moveInGroup(mixed, shutterGroupOf, 'volet2salon', -1)).toEqual(['voletstore', 'volet2salon', 'store', 'volet1salon']);
  });

  test('@nr NR-portal-frontend-13 lecture : reponse illisible donne null, version et date conservees', () => {
    expect(parseLayout(null)).toBeNull();
    expect(parseLayout({ order: 'x', disabled: [] })).toBeNull();
    expect(parseLayout({ order: ['salon'], disabled: ['wc2'], version: 3, updated_at: '2026-11-07T10:15:30.123Z' })).toEqual({
      order: ['salon'],
      disabled: ['wc2'],
      version: 3,
      updated_at: '2026-11-07T10:15:30.123Z',
    });
    expect(parseLayout({ order: [], disabled: [], version: 0, updated_at: null })).toEqual(DEFAULT_LAYOUT);
  });

  test('@nr NR-portal-frontend-13 messages d erreur 400 / 403 / 503', () => {
    expect(layoutErrorMessage('lights', 403)).toContain("réservé à l'administrateur");
    expect(layoutErrorMessage('shutters', 503)).toContain('indisponible');
    expect(layoutErrorMessage('lights', 400, 'unknown_light')).toContain('inconnu');
    expect(layoutErrorMessage('lights', 400, 'invalid_layout')).toContain('refusée');
  });

  test('@nr NR-portal-frontend-13 reordered : faux par defaut, desactivation seule et order complet identique au catalogue', () => {
    expect(lightLayout().reordered).toBe(false);
    expect(lightLayout(layoutOf([...LIGHT_IDS], ['wc2'])).reordered).toBe(false);
    expect(lightLayout(layoutOf([], [])).reordered).toBe(false);
    const swapped = [...LIGHT_IDS];
    [swapped[8], swapped[9]] = [swapped[9], swapped[8]];
    expect(lightLayout(layoutOf(swapped, [])).reordered).toBe(true);
  });
});
