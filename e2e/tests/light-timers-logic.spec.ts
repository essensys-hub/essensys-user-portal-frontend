/**
 * Logique pure des temporisations (lumieres-temporisees-2026-11-003) : pas de navigateur, pas de réseau.
 * Aucun runner unitaire dans ce dépôt : Playwright exécute ces tests dans Node.
 * NR: NR-portal-frontend-10 essensys-hub/essensys-user-portal-frontend#39
 */
import { test, expect } from '@playwright/test';
import {
  LIGHT_TIMER_CATALOG,
  LIGHT_TIMER_SHORTCUTS,
  formatMinutes,
  hasLightTimer,
  isLightTimerAdmin,
  parseLightTimers,
  validateCustomMinutes,
} from '../../src/lights/lightTimers';

test.describe('temporisations : logique', () => {
  test('@nr NR-portal-frontend-10 catalogue : six lumieres, ordre et cles du contrat', () => {
    expect(LIGHT_TIMER_CATALOG.map((e) => [e.id, e.label, e.key])).toEqual([
      ['dressing', 'Dressing', 521],
      ['wc1', 'WC 1', 555],
      ['wc2', 'WC 2', 556],
      ['pieceserv', 'Service', 557],
      ['ann1', 'Annexe 1', 561],
      ['ann2', 'Annexe 2', 562],
    ]);
    expect(hasLightTimer('dressing')).toBe(true);
    expect(hasLightTimer('salon')).toBe(false);
    expect(hasLightTimer('idressing')).toBe(false);
  });

  test('@nr NR-portal-frontend-10 raccourcis 15, 30, 60 et 0 (Jamais)', () => {
    expect(LIGHT_TIMER_SHORTCUTS.map((s) => [s.minutes, s.label])).toEqual([
      [15, '15 min'],
      [30, '30 min'],
      [60, '1 h'],
      [0, 'Jamais'],
    ]);
  });

  test('@nr NR-portal-frontend-10 valeur libre : entier de 1 a 255 seulement', () => {
    expect(validateCustomMinutes('7')).toEqual({ ok: true, minutes: 7 });
    expect(validateCustomMinutes(' 255 ')).toEqual({ ok: true, minutes: 255 });
    expect(validateCustomMinutes('1')).toEqual({ ok: true, minutes: 1 });
    for (const bad of ['', '0', '256', '300', '-5', '7.5', '1e2', 'abc', '12 min']) {
      expect(validateCustomMinutes(bad).ok, `« ${bad} » doit etre refusee`).toBe(false);
    }
  });

  test('@nr NR-portal-frontend-10 formatage : 7 min, 1 h, Jamais, inconnue', () => {
    expect(formatMinutes(7)).toBe('7 min');
    expect(formatMinutes(15)).toBe('15 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(90)).toBe('90 min');
    expect(formatMinutes(0)).toBe('Jamais');
    expect(formatMinutes(null)).toBe('inconnue');
    expect(formatMinutes(undefined)).toBe('inconnue');
    expect(formatMinutes(300)).toBe('inconnue');
  });

  test('@nr NR-portal-frontend-10 roles : administrateur = admin_local ou admin_global', () => {
    expect(isLightTimerAdmin('admin_local')).toBe(true);
    expect(isLightTimerAdmin('admin_global')).toBe(true);
    for (const role of ['user', 'guest_local', 'support', '', undefined, null]) {
      expect(isLightTimerAdmin(role)).toBe(false);
    }
  });

  test('@nr NR-portal-frontend-10 lecture : null reste inconnue, jamais 0, ordre du catalogue', () => {
    const parsed = parseLightTimers({
      timers: [
        { id: 'ann2', minutes: 7 },
        { id: 'wc1', minutes: null },
        { id: 'dressing', minutes: 15 },
        { id: 'wc2', minutes: 0 },
        { id: 'ann1', minutes: 999 },
        { id: 'autre', minutes: 5 },
      ],
    });
    expect(parsed.map((t) => [t.id, t.minutes])).toEqual([
      ['dressing', 15],
      ['wc1', null],
      ['wc2', 0],
      ['pieceserv', null],
      ['ann1', null],
      ['ann2', 7],
    ]);
    expect(parseLightTimers(null).every((t) => t.minutes === null)).toBe(true);
  });
});
