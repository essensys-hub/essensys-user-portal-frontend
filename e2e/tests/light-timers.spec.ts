/**
 * Temporisations des lumières (lumieres-temporisees-2026-11-003), portail cloud en mode démo.
 * NR: NR-portal-frontend-10 essensys-hub/essensys-user-portal-frontend#39
 */
import { test, expect, type Page } from '@playwright/test';
import { noArmoire, recordedCalls } from './noArmoire';

const IDS = ['dressing', 'wc1', 'wc2', 'pieceserv', 'ann1', 'ann2'];

const timerPuts = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.method === 'PUT' && c.url.includes('/api/portal/admin/lights/timers'));

/** Sous 1024 px (iPhone, iPad), la navigation est un tiroir ouvert par le bouton du bandeau. */
const isCompact = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;

/** Ouvre « Temporisations » par le menu (barre latérale ou tiroir). */
const clickTimersLink = async (page: Page) => {
  if (isCompact(page)) await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await page.getByRole('link', { name: 'Temporisations' }).click();
  await expect(page).toHaveURL(/\/lighting\/timers$/);
};

const openTimersFromMenu = async (page: Page) => {
  await page.goto('/dashboard');
  await clickTimersLink(page);
};

test.describe('temporisations des lumières', () => {
  test('@nr NR-portal-frontend-10 menu : les six lumieres et inconnue sans valeur', async ({ page }) => {
    const external = await noArmoire(page);
    await openTimersFromMenu(page);
    for (const id of IDS) {
      await expect(page.getByTestId(`light-timers-row-${id}`)).toBeVisible();
    }
    await expect(page.getByTestId('light-timers-list').locator('li')).toHaveCount(6);
    await expect(page.getByTestId('light-timer-dressing-value')).toHaveText('15 min');
    await expect(page.getByTestId('light-timer-wc2-value')).toHaveText('Jamais');
    await expect(page.getByTestId('light-timer-pieceserv-value')).toHaveText('1 h');
    await expect(page.getByTestId('light-timer-wc1-value')).toHaveText('inconnue');
    await expect(page.getByTestId('light-timer-ann1-value')).toHaveText('inconnue');
    expect(await timerPuts(page)).toHaveLength(0);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-10 Dressing : meme valeur dans le menu et la fiche, valeur libre 7', async ({ page }) => {
    const external = await noArmoire(page);
    await page.goto('/lighting/timers');
    const menuValue = await page.getByTestId('light-timer-dressing-value').innerText();
    expect(menuValue).toBe('15 min');

    await page.goto('/lighting');
    const toggle = page.getByTestId('light-timer-toggle-dressing');
    await expect(toggle).toContainText('15 min');
    await toggle.click();
    await expect(page.getByTestId('light-timer-dressing-value')).toHaveText(menuValue);

    await page.getByLabel('Autre durée (minutes, 1 à 255)').fill('7');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page.getByRole('status')).toContainText('Dressing : 7 min envoyée');
    const puts = await timerPuts(page);
    expect(puts).toHaveLength(1);
    expect(puts[0].url).toContain('/api/portal/admin/lights/timers/dressing');
    expect(puts[0].body).toEqual({ minutes: 7 });

    // Le menu central relit la même valeur (navigation dans l'application : le simulé garde son état).
    await clickTimersLink(page);
    await expect(page.getByTestId('light-timer-dressing-value')).toHaveText('7 min');
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-10 raccourcis : 15, 30, 1 h et Jamais envoient 15, 30, 60 et 0', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/lighting/timers');
    const row = page.getByTestId('light-timers-row-wc2');
    for (const [name, minutes] of [['30 min', 30], ['1 h', 60], ['15 min', 15], ['Jamais', 0]] as const) {
      await row.getByRole('button', { name, exact: true }).click();
      await expect.poll(async () => (await timerPuts(page)).at(-1)?.body).toEqual({ minutes });
    }
    expect(await timerPuts(page)).toHaveLength(4);
  });

  test('@nr NR-portal-frontend-10 valeur libre 300 et 0 refusees sans requete', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/lighting/timers');
    const row = page.getByTestId('light-timers-row-ann1');
    const input = row.getByLabel('Autre durée (minutes, 1 à 255)');
    for (const bad of ['300', '0', 'abc', '']) {
      await input.fill(bad);
      await row.getByRole('button', { name: 'Appliquer' }).click();
      await expect(row.getByRole('alert')).toBeVisible();
    }
    await expect(row.getByTestId('light-timer-ann1-value')).toHaveText('inconnue');
    expect(await timerPuts(page)).toHaveLength(0);
  });

  test('@nr NR-portal-frontend-10 relecture a 5 s confirme la valeur', async ({ page }) => {
    await noArmoire(page);
    await page.clock.install();
    await page.goto('/lighting/timers');
    const row = page.getByTestId('light-timers-row-wc1');
    await expect(row.getByTestId('light-timer-wc1-value')).toHaveText('inconnue');
    await row.getByRole('button', { name: '30 min', exact: true }).click();
    await expect(row.getByText("En attente de l'armoire")).toBeVisible();
    await page.clock.fastForward(5500);
    await expect(row.getByRole('status')).toContainText('confirmée par l\'armoire');
    await expect(row.getByTestId('light-timer-wc1-value')).toHaveText('30 min');
  });

  test('@nr NR-portal-frontend-10 la fiche n affiche le reglage que pour les six lumieres', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/lighting');
    for (const id of IDS) {
      await expect(page.getByTestId(`light-timer-toggle-${id}`)).toHaveCount(1);
    }
    await expect(page.locator('[data-testid^="light-timer-toggle-"]')).toHaveCount(6);
    await expect(page.getByTestId('light-salon').getByRole('button', { name: /Temporisation/ })).toHaveCount(0);
  });

  test('@nr NR-portal-frontend-10 masque pour un utilisateur simple', async ({ page }) => {
    const external = await noArmoire(page, { role: 'user' });
    await page.goto('/lighting');
    await expect(page.getByRole('heading', { name: 'Éclairages principaux' })).toBeVisible();
    await expect(page.locator('[data-testid^="light-timer-toggle-"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Temporisations' })).toHaveCount(0);
    // Le menu en tiroir (téléphone, tablette) ne le montre pas non plus.
    if (isCompact(page)) {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      await expect(page.getByRole('link', { name: 'Tests non-régression' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Temporisations' })).toHaveCount(0);
    }
    // Accès direct : message, aucune lecture ni écriture.
    await page.goto('/lighting/timers');
    await expect(page.getByText("réservé à l'administrateur de l'armoire")).toBeVisible();
    expect(await timerPuts(page)).toHaveLength(0);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-10 controles desactives hors ligne', async ({ page }) => {
    await noArmoire(page, { session: 'all-offline' });
    await page.goto('/lighting/timers');
    const row = page.getByTestId('light-timers-row-dressing');
    await expect(row.getByText('Armoire hors ligne')).toBeVisible();
    for (const name of ['15 min', '30 min', '1 h', 'Jamais', 'Appliquer']) {
      await expect(row.getByRole('button', { name, exact: true })).toBeDisabled();
    }
    await expect(row.getByLabel('Autre durée (minutes, 1 à 255)')).toBeDisabled();
  });
});
