/**
 * Affichage des lumières et des volets (affichage-objets-2026-11-006), portail cloud en mode démo.
 * NR: NR-portal-frontend-13 essensys-hub/essensys-feature-lifecycle#41
 * NR: NR-portal-frontend-13 essensys-hub/essensys-feature-lifecycle#52
 */
import { test, expect, type Page } from '@playwright/test';
import { noArmoire, recordedCalls } from './noArmoire';

type Seed = { lights?: { order?: string[]; disabled?: string[] }; shutters?: { order?: string[]; disabled?: string[] } };

const seed = (page: Page, value: Seed) =>
  page.addInitScript((v) => sessionStorage.setItem('essensys_demo_layout_seed', JSON.stringify(v)), value);

const layoutPuts = async (page: Page, kind: 'lights' | 'shutters') =>
  (await recordedCalls(page)).filter((c) => c.method === 'PUT' && c.url.includes(`/api/portal/admin/${kind}/layout`));

const injections = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.method === 'POST' && c.url.includes('/api/portal/inject'));

const live = (page: Page) => page.addInitScript(() => sessionStorage.setItem('essensys_demo_inject', 'live'));

const lightRows = (page: Page) => page.locator('[data-testid^="light-"]:not([data-testid^="light-name"]):not([data-testid^="light-timer"]):not([data-testid^="light-timers"])');

test.describe('affichage des lumieres et des volets', () => {
  test('@nr NR-portal-frontend-13 lumiere desactivee : absente de la liste, de Tout allumer et de Temporisations', async ({ page }) => {
    const external = await noArmoire(page);
    await live(page);
    await seed(page, { lights: { disabled: ['wc2'] } });
    await page.goto('/lighting');
    await expect(page.getByTestId('light-wc1')).toBeVisible();
    await expect(page.getByTestId('light-wc2')).toHaveCount(0);
    await expect(page.getByText('WC 2', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Tout allumer' }).first().click();
    await expect(page.getByText(/Principaux : commandes envoyées/)).toBeVisible();
    const sent = await injections(page);
    expect(sent).toHaveLength(20);
    expect(sent.some((c) => (c.body as { k: number; v: string }).k === 615 && (c.body as { v: string }).v === '64')).toBe(false);

    await page.goto('/lighting/timers');
    await expect(page.getByTestId('light-timers-row-wc1')).toBeVisible();
    await expect(page.getByTestId('light-timers-row-wc2')).toHaveCount(0);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-13 volet desactive : absent de la liste, de Tout ouvrir et de Temps de course', async ({ page }) => {
    await noArmoire(page);
    await live(page);
    await seed(page, { shutters: { disabled: ['voletbureau'] } });
    await page.goto('/shutters');
    await expect(page.getByTestId('shutter-volet1salon')).toBeVisible();
    await expect(page.getByTestId('shutter-voletbureau')).toHaveCount(0);
    await expect(page.getByTestId('shutter-time-name-volet1salon')).toBeVisible();
    await expect(page.getByTestId('shutter-time-name-voletbureau')).toHaveCount(0);

    await page.getByRole('button', { name: 'Tout ouvrir' }).first().click();
    await expect(page.getByText('Volets : Tous ouverts')).toBeVisible();
    const sent = await injections(page);
    expect(sent).toHaveLength(13);
    // voletbureau : ouverture 617 / dvalue 32
    expect(sent.some((c) => (c.body as { k: number; v: string }).k === 617 && (c.body as { v: string }).v === '32')).toBe(false);
  });

  test('@nr NR-portal-frontend-13 groupe vide : texte, aucun bouton de groupe', async ({ page }) => {
    await noArmoire(page);
    const main = ['terrasse', 'entree', 'escalier', 'deg1', 'deg2', 'pieceserv', 'ann1', 'ann2', 'salon', 'sam', 'cuisine', 'sdb1', 'sdb2', 'wc1', 'wc2', 'bureau', 'gdchamb', 'ptchamb1', 'ptchamb2', 'ptchamb3', 'dressing'];
    await seed(page, { lights: { disabled: main } });
    await page.goto('/lighting');
    await expect(page.getByTestId('lights-empty-Principaux')).toHaveText('Aucune lumière activée');
    await expect(page.getByRole('button', { name: 'Tout allumer' })).toHaveCount(1); // groupe indirect seulement
    await expect(page.getByTestId('light-salon')).toHaveCount(0);
    await expect(page.getByTestId('light-isalonind')).toBeVisible();
  });

  test('@nr NR-portal-frontend-13 ordre choisi applique a la liste et a Temps de course', async ({ page }) => {
    await noArmoire(page);
    await seed(page, { shutters: { order: ['volet2salon', 'volet1salon'] } });
    await page.goto('/shutters');
    const rows = page.locator('[data-testid^="shutter-volet"][data-testid$="salon"]');
    await expect(rows.first()).toHaveAttribute('data-testid', 'shutter-volet2salon');
    const names = await page.locator('[data-testid^="shutter-time-name-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    expect(names.indexOf('shutter-time-name-volet2salon')).toBeLessThan(names.indexOf('shutter-time-name-volet1salon'));
  });

  test('@nr NR-portal-frontend-13 ancien cloud (404) : catalogue complet dans l ordre d origine, sans blocage', async ({ page }) => {
    await noArmoire(page);
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_layout', 'absent'));
    await page.goto('/lighting');
    await expect(page.getByTestId('light-terrasse')).toBeVisible();
    await expect(page.getByTestId('light-idressing')).toBeVisible();
    expect(await lightRows(page).count()).toBeGreaterThanOrEqual(33);
    await page.goto('/shutters');
    await expect(page.getByTestId('shutter-store')).toBeVisible();
  });

  test('@nr NR-portal-frontend-13 administrateur : desactiver, reactiver, monter et ordre d origine en une ecriture chacune', async ({ page }) => {
    const external = await noArmoire(page);
    await page.goto('/lighting');
    await page.getByTestId('layout-toggle-lights').click();
    const manager = page.getByTestId('layout-manager-lights');
    await expect(manager.locator('li')).toHaveCount(33);

    // Desactiver wc2 + monter sam, puis enregistrer : une seule ecriture
    await manager.getByTestId('layout-switch-wc2').uncheck();
    await manager.getByTestId('layout-up-sam').click();
    await expect(page.getByTestId('light-wc2')).toBeVisible(); // pas d'effet avant « Enregistrer »
    await manager.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(manager.getByRole('status')).toContainText('Disposition enregistrée');
    let puts = await layoutPuts(page, 'lights');
    expect(puts).toHaveLength(1);
    const body = puts[0].body as { order: string[]; disabled: string[] };
    expect(body.disabled).toEqual(['wc2']);
    expect(body.order).toHaveLength(33);
    expect(body.order.indexOf('sam')).toBeLessThan(body.order.indexOf('salon'));
    await expect(page.getByTestId('light-wc2')).toHaveCount(0);
    await expect(manager.getByTestId('layout-row-wc2')).toBeVisible(); // reste dans l'ecran de gestion
    const listed = await page.locator('[data-testid^="light-name-label-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    expect(listed.indexOf('light-name-label-sam')).toBeLessThan(listed.indexOf('light-name-label-salon'));

    // Reactivation
    await manager.getByTestId('layout-switch-wc2').check();
    await manager.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-wc2')).toBeVisible();
    expect((await layoutPuts(page, 'lights'))[1].body).toMatchObject({ disabled: [] });

    // Ordre d'origine : ecriture {reset:true}
    await manager.getByRole('button', { name: "Ordre d'origine" }).click();
    await manager.getByRole('button', { name: 'Enregistrer' }).click();
    puts = await layoutPuts(page, 'lights');
    expect(puts).toHaveLength(3);
    expect(puts[2].body).toEqual({ reset: true });
    // L'ecriture est asynchrone : on attend l'ordre d'origine plutot que de le lire tout de suite.
    await expect
      .poll(async () => {
        const after = await page.locator('[data-testid^="light-name-label-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
        return after.indexOf('light-name-label-salon') < after.indexOf('light-name-label-sam');
      })
      .toBe(true);

    // Aucun ordre vers l'armoire
    expect(await injections(page)).toEqual([]);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-13 volets : boutons de bord de groupe inactifs, reordonnancement enregistre', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/shutters');
    await page.getByTestId('layout-toggle-shutters').click();
    const manager = page.getByTestId('layout-manager-shutters');
    await expect(manager.locator('li')).toHaveCount(16);
    await expect(manager.getByTestId('layout-up-volet1salon')).toBeDisabled();
    await expect(manager.getByTestId('layout-down-voletbureau')).toBeDisabled();
    await expect(manager.getByTestId('layout-up-voletstore')).toBeDisabled();
    await expect(manager.getByTestId('layout-down-store')).toBeDisabled();
    await manager.getByTestId('layout-down-volet1salon').click();
    await manager.getByTestId('layout-switch-store').uncheck();
    await manager.getByRole('button', { name: 'Enregistrer' }).click();
    const puts = await layoutPuts(page, 'shutters');
    expect(puts).toHaveLength(1);
    expect(puts[0].body).toMatchObject({ disabled: ['store'] });
    expect((puts[0].body as { order: string[] }).order.slice(0, 2)).toEqual(['volet2salon', 'volet1salon']);
    await expect(page.getByTestId('shutter-store')).toHaveCount(0);
  });

  test('@nr NR-portal-frontend-13 erreur 503 et 403 : message clair, ecran ouvert, rien ne change', async ({ page }) => {
    await noArmoire(page);
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names', 'unavailable'));
    await page.goto('/lighting');
    await page.getByTestId('layout-toggle-lights').click();
    const manager = page.getByTestId('layout-manager-lights');
    await manager.getByTestId('layout-switch-wc2').uncheck();
    await manager.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(manager.getByRole('alert')).toContainText('indisponible');
    await expect(manager).toBeVisible();
    await expect(page.getByTestId('light-wc2')).toBeVisible();
  });

  test('@nr NR-portal-frontend-13 non-administrateur : ni bouton de gestion ni objets desactives', async ({ page }) => {
    const external = await noArmoire(page, { role: 'user' });
    await seed(page, { lights: { disabled: ['wc2'] }, shutters: { disabled: ['voletbureau'] } });
    await page.goto('/lighting');
    await expect(page.getByTestId('light-wc1')).toBeVisible();
    await expect(page.getByTestId('light-wc2')).toHaveCount(0);
    await expect(page.getByTestId('layout-toggle-lights')).toHaveCount(0);
    await page.goto('/shutters');
    await expect(page.getByTestId('shutter-voletbureau')).toHaveCount(0);
    await expect(page.getByTestId('layout-toggle-shutters')).toHaveCount(0);
    expect(await layoutPuts(page, 'lights')).toHaveLength(0);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-13 noms inchanges : nom personnalise affiche dans l ecran de gestion, nom de 40 caracteres lisible', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/lighting');
    const long = 'W'.repeat(40);
    await page.getByTestId('light-name-toggle-dressing').click();
    const editor = page.getByTestId('light-name-dressing');
    await editor.getByLabel(/^Nom \(1 à 40/).fill(long);
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText(long);
    await page.getByTestId('layout-toggle-lights').click();
    const manager = page.getByTestId('layout-manager-lights');
    await expect(manager.getByTestId('layout-name-dressing')).toHaveText(long);
    const row = manager.getByTestId('layout-row-dressing');
    await row.scrollIntoViewIfNeeded();
    // Le nom long passe a la ligne : l'interrupteur et les boutons restent dans la ligne, qui reste dans
    // l'ecran de gestion, lui-meme aussi large que les cartes de la page (la page de l'iPad Pro 11 est
    // deja plus large que son ecran, pour tous les ecrans : on compare donc aux cartes, pas a l'ecran).
    const box = async (loc: ReturnType<Page['locator']>) => loc.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    const rowBox = await box(row);
    for (const id of ['layout-switch-dressing', 'layout-up-dressing', 'layout-down-dressing']) {
      const b = await box(row.getByTestId(id));
      expect(b.left).toBeGreaterThanOrEqual(rowBox.left - 1);
      expect(b.right).toBeLessThanOrEqual(rowBox.right + 1);
    }
    const nameBox = await box(row.getByTestId('layout-name-dressing'));
    expect(nameBox.right).toBeLessThanOrEqual(rowBox.right + 1);
    const cardBox = await box(page.locator('div.space-y-6 > div').first());
    expect((await box(manager)).right).toBeLessThanOrEqual(cardBox.right + 1);

    // Reordonner n'a pas touche au nom
    await manager.getByTestId('layout-up-dressing').click();
    await manager.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText(long);
    const namePuts = (await recordedCalls(page)).filter((c) => c.method === 'PUT' && c.url.includes('/names/'));
    expect(namePuts).toHaveLength(1);
  });

  const timerRows = (page: Page) =>
    page.locator('[data-testid^="light-timers-row-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.replace('light-timers-row-', '')));

  test('@nr NR-portal-frontend-13 Temporisations : ordre propre par defaut, desactivation seule, reordonnancement puis reset', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/lighting/timers');
    await expect(page.getByTestId('light-timers-row-dressing')).toBeVisible();
    expect(await timerRows(page)).toEqual(['dressing', 'wc1', 'wc2', 'pieceserv', 'ann1', 'ann2']);

  });

  test('@nr NR-portal-frontend-13 Temporisations : desactivation seule (order complet) garde l ordre propre', async ({ page }) => {
    await noArmoire(page);
    const full = (await import('../../src/lights/lightLayout')).LIGHT_IDS;
    await seed(page, { lights: { order: [...full], disabled: ['wc1'] } });
    await page.goto('/lighting/timers');
    await expect(page.getByTestId('light-timers-row-dressing')).toBeVisible();
    expect(await timerRows(page)).toEqual(['dressing', 'wc2', 'pieceserv', 'ann1', 'ann2']);
  });

  test('@nr NR-portal-frontend-13 Temporisations : reordonnancement => ordre global filtre', async ({ page }) => {
    await noArmoire(page);
    // ann2 et wc2 remontes en tete ; wc1 desactive
    await seed(page, { lights: { order: ['ann2', 'wc2'], disabled: ['wc1'] } });
    await page.goto('/lighting/timers');
    await expect(page.getByTestId('light-timers-row-dressing')).toBeVisible();
    expect(await timerRows(page)).toEqual(['ann2', 'wc2', 'pieceserv', 'ann1', 'dressing']);
  });

  test('@nr NR-portal-frontend-13 Temporisations : reset (document vide) => ordre propre', async ({ page }) => {
    await noArmoire(page);
    await seed(page, { lights: { order: [], disabled: [] } });
    await page.goto('/lighting/timers');
    await expect(page.getByTestId('light-timers-row-dressing')).toBeVisible();
    expect(await timerRows(page)).toEqual(['dressing', 'wc1', 'wc2', 'pieceserv', 'ann1', 'ann2']);
  });
});
