/**
 * Logique pure des noms de lumières (noms-lumieres-2026-11-004) : pas de navigateur, pas de réseau.
 * NR: NR-portal-frontend-11 essensys-hub/essensys-feature-lifecycle#41
 */
import { test, expect } from '@playwright/test';
import {
  LIGHT_NAME_CATALOG,
  defaultName,
  displayName,
  lightNameErrorMessage,
  parseLightNames,
  validateLightName,
} from '../../src/lights/lightNames';

test.describe('noms des lumières : logique', () => {
  test('@nr NR-portal-frontend-11 catalogue : 33 lumieres, ordre du contrat', () => {
    expect(LIGHT_NAME_CATALOG).toHaveLength(33);
    expect(LIGHT_NAME_CATALOG[0]).toEqual({ id: 'terrasse', default: 'Terrasse' });
    expect(LIGHT_NAME_CATALOG[20]).toEqual({ id: 'dressing', default: 'Dressing' });
    expect(LIGHT_NAME_CATALOG[21]).toEqual({ id: 'isalonind', default: 'Salon (indirect 1)' });
    expect(LIGHT_NAME_CATALOG[32]).toEqual({ id: 'idressing', default: 'Dressing (placards)' });
    expect(new Set(LIGHT_NAME_CATALOG.map((e) => e.id)).size).toBe(33);
  });

  test('@nr NR-portal-frontend-11 nom affiche : personnalise sinon origine', () => {
    expect(displayName('dressing')).toBe('Dressing');
    expect(displayName('dressing', { dressing: 'WC 3' })).toBe('WC 3');
    expect(displayName('salon', { dressing: 'WC 3' })).toBe('Salon');
    expect(defaultName('inconnue')).toBe('inconnue');
  });

  test('@nr NR-portal-frontend-11 lecture : repli sur les noms d origine', () => {
    expect(parseLightNames(null)).toEqual({});
    expect(parseLightNames({ lights: 'x' })).toEqual({});
    const map = parseLightNames({
      lights: [
        { id: 'dressing', default: 'Dressing', name: 'WC 3' },
        { id: 'salon', default: 'Salon', name: null },
        { id: 'wc1', name: 'a'.repeat(41) },
        { id: 'wc2', name: '<b>x</b>' },
        { id: 'autre', name: 'Inconnue' },
      ],
    });
    expect(map).toEqual({ dressing: 'WC 3' });
  });

  test('@nr NR-portal-frontend-11 regle du nom : 1 a 40 caracteres, sans controle ni chevrons', () => {
    expect(validateLightName('  WC 3  ')).toEqual({ ok: true, name: 'WC 3' });
    expect(validateLightName('a'.repeat(40)).ok).toBe(true);
    expect(validateLightName('é'.repeat(40)).ok).toBe(true);
    expect(validateLightName('a'.repeat(41)).ok).toBe(false);
    expect(validateLightName('   ').ok).toBe(false);
    expect(validateLightName('a\tb').ok).toBe(false);
    expect(validateLightName('a<b').ok).toBe(false);
    expect(validateLightName('a>b').ok).toBe(false);
    expect(validateLightName('a&b')).toEqual({ ok: true, name: 'a&b' });
  });

  test('@nr NR-portal-frontend-11 messages d erreur 400, 403 et 503', () => {
    expect(lightNameErrorMessage(403)).toContain("administrateur");
    expect(lightNameErrorMessage(503)).toContain('indisponibles');
    expect(lightNameErrorMessage(400, 'invalid_name')).toContain('40 caractères');
    expect(lightNameErrorMessage(400, 'unknown_light')).toContain('inconnue');
  });
});
