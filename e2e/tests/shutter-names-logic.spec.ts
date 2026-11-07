/**
 * Logique pure des noms de volets (noms-volets-2026-11-005) : pas de navigateur, pas de réseau.
 * NR: NR-portal-frontend-12 essensys-hub/essensys-feature-lifecycle#41
 */
import { test, expect } from '@playwright/test';
import {
  SHUTTER_NAME_CATALOG,
  defaultName,
  displayName,
  parseShutterNames,
  shutterNameErrorMessage,
  validateShutterName,
} from '../../src/shutters/shutterNames';

test.describe('noms des volets : logique', () => {
  test('@nr NR-portal-frontend-12 catalogue : 16 volets et stores, ordre du contrat', () => {
    expect(SHUTTER_NAME_CATALOG).toHaveLength(16);
    expect(SHUTTER_NAME_CATALOG[0]).toEqual({ id: 'volet1salon', default: 'Volet 1 Salon' });
    expect(SHUTTER_NAME_CATALOG[7]).toEqual({ id: 'voletsdb', default: 'Volet Salle de Bain 1' });
    expect(SHUTTER_NAME_CATALOG[13]).toEqual({ id: 'voletbureau', default: 'Volet Bureau' });
    expect(SHUTTER_NAME_CATALOG[14]).toEqual({ id: 'voletstore', default: 'Volet "Store"' });
    expect(SHUTTER_NAME_CATALOG[15]).toEqual({ id: 'store', default: 'Store (banne)' });
    expect(new Set(SHUTTER_NAME_CATALOG.map((e) => e.id)).size).toBe(16);
  });

  test('@nr NR-portal-frontend-12 nom affiche : personnalise sinon origine', () => {
    expect(displayName('volet1salon')).toBe('Volet 1 Salon');
    expect(displayName('volet1salon', { volet1salon: 'Volet baie vitrée' })).toBe('Volet baie vitrée');
    expect(displayName('store', { volet1salon: 'Volet baie vitrée' })).toBe('Store (banne)');
    expect(displayName('voletstore', { voletstore: 'Store "nord"' })).toBe('Store "nord"');
    expect(defaultName('inconnu')).toBe('inconnu');
  });

  test('@nr NR-portal-frontend-12 lecture : repli sur les noms d origine', () => {
    expect(parseShutterNames(null)).toEqual({});
    expect(parseShutterNames({ shutters: 'x' })).toEqual({});
    const map = parseShutterNames({
      shutters: [
        { id: 'volet1salon', default: 'Volet 1 Salon', name: 'Volet baie vitrée' },
        { id: 'store', name: null },
        { id: 'volet2salon', name: 'a'.repeat(41) },
        { id: 'volet3salon', name: '<b>x</b>' },
        { id: 'autre', name: 'Inconnu' },
        { id: 'voletstore', name: 'Store "nord"' },
      ],
    });
    expect(map).toEqual({ volet1salon: 'Volet baie vitrée', voletstore: 'Store "nord"' });
    // Les noms de lumières ne sont jamais lus comme des noms de volets.
    expect(parseShutterNames({ lights: [{ id: 'volet1salon', name: 'x' }] })).toEqual({});
  });

  test('@nr NR-portal-frontend-12 regle du nom : 1 a 40 caracteres, sans controle ni chevrons', () => {
    expect(validateShutterName('  Volet baie vitrée  ')).toEqual({ ok: true, name: 'Volet baie vitrée' });
    expect(validateShutterName('a'.repeat(40)).ok).toBe(true);
    expect(validateShutterName('é'.repeat(40)).ok).toBe(true);
    expect(validateShutterName('a'.repeat(41)).ok).toBe(false);
    expect(validateShutterName('   ').ok).toBe(false);
    expect(validateShutterName('a\tb').ok).toBe(false);
    expect(validateShutterName('a<b').ok).toBe(false);
    expect(validateShutterName('a>b').ok).toBe(false);
    expect(validateShutterName('Store "nord"')).toEqual({ ok: true, name: 'Store "nord"' });
    expect(validateShutterName('a&b')).toEqual({ ok: true, name: 'a&b' });
  });

  test('@nr NR-portal-frontend-12 messages d erreur 400, 403 et 503', () => {
    expect(shutterNameErrorMessage(403)).toContain('administrateur');
    expect(shutterNameErrorMessage(503)).toContain('indisponibles');
    expect(shutterNameErrorMessage(400, 'invalid_name')).toContain('40 caractères');
    expect(shutterNameErrorMessage(400, 'unknown_shutter')).toContain('inconnu');
  });
});
