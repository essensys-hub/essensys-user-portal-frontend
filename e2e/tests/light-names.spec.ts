/**
 * Noms personnalisés des lumières (noms-lumieres-2026-11-004), portail cloud en mode démo.
 * NR: NR-portal-frontend-11 essensys-hub/essensys-feature-lifecycle#41
 */
import { test, expect, type Page } from '@playwright/test';
import { noArmoire, recordedCalls } from './noArmoire';

const namePuts = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.method === 'PUT' && c.url.includes('/api/portal/admin/lights/names'));

/** Aucune écriture vers l'armoire : ni injection, ni action web, ni écriture dans la table d'échange. */
const armoireWrites = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => /\/inject|\/web\/actions|\/exchange/.test(c.url));

const isCompact = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;

const openDressingEditor = async (page: Page) => {
  await page.goto('/lighting');
  await page.getByTestId('light-name-toggle-dressing').click();
  return page.getByTestId('light-name-dressing');
};

test.describe('noms des lumières', () => {
  test('@nr NR-portal-frontend-11 Dressing renomme WC 3 : liste et Temporisations, puis remise a zero', async ({ page }) => {
    const external = await noArmoire(page);
    const editor = await openDressingEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('WC 3');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('status')).toContainText('Nom enregistré : WC 3');
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('WC 3');

    const puts = await namePuts(page);
    expect(puts).toHaveLength(1);
    expect(puts[0].url).toContain('/api/portal/admin/lights/names/dressing');
    expect(puts[0].body).toEqual({ name: 'WC 3' });

    // Le panneau de temporisation et l'écran Temporisations utilisent le nom affiché.
    await page.getByTestId('light-timer-toggle-dressing').click();
    await expect(page.getByLabel('Durée pour WC 3')).toBeVisible();
    if (isCompact(page)) await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await page.getByRole('link', { name: 'Temporisations' }).click();
    await expect(page).toHaveURL(/\/lighting\/timers$/);
    await expect(page.getByTestId('light-timers-row-dressing').getByRole('heading', { name: 'WC 3' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dressing', exact: true })).toHaveCount(0);

    // Remise à zéro : le nom d'origine réapparaît.
    await page.goto('/lighting');
    await page.getByTestId('light-name-toggle-dressing').click();
    // (navigation complète : le simulé repart de son état initial, le nom doit donc être refait)
    const again = page.getByTestId('light-name-dressing');
    await again.getByLabel(/^Nom \(1 à 40/).fill('WC 3');
    await again.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('WC 3');
    await again.getByRole('button', { name: "Nom d'origine" }).click();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('Dressing');
    expect((await namePuts(page)).at(-1)?.body).toEqual({ name: null });

    expect(await armoireWrites(page)).toEqual([]);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-11 41 caracteres refuse sans requete, 40 accepte', async ({ page }) => {
    await noArmoire(page);
    const editor = await openDressingEditor(page);
    const input = editor.getByLabel(/^Nom \(1 à 40/);
    await input.fill('a'.repeat(41));
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('alert')).toContainText('40 caractères');
    expect(await namePuts(page)).toHaveLength(0);
    await input.fill('   ');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('alert')).toBeVisible();
    expect(await namePuts(page)).toHaveLength(0);
    await input.fill('b'.repeat(40));
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('b'.repeat(40));
    expect(await namePuts(page)).toHaveLength(1);
  });

  test('@nr NR-portal-frontend-11 nom affiche comme texte brut', async ({ page }) => {
    await noArmoire(page);
    const editor = await openDressingEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('Tom &amp; Jerry');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('Tom &amp; Jerry');
  });

  test('@nr NR-portal-frontend-11 chevrons refuses avant envoi', async ({ page }) => {
    await noArmoire(page);
    const editor = await openDressingEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('<b>x</b>');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('alert')).toBeVisible();
    expect(await namePuts(page)).toHaveLength(0);
  });

  test('@nr NR-portal-frontend-11 non-administrateur : aucun champ de nom', async ({ page }) => {
    const external = await noArmoire(page, { role: 'user' });
    await page.goto('/lighting');
    await expect(page.getByRole('heading', { name: 'Éclairages principaux' })).toBeVisible();
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('Dressing');
    await expect(page.locator('[data-testid^="light-name-toggle-"]')).toHaveCount(0);
    await expect(page.getByLabel(/^Nom \(1 à 40/)).toHaveCount(0);
    expect(await namePuts(page)).toHaveLength(0);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-11 erreur 503 : message clair, nom inchange', async ({ page }) => {
    await noArmoire(page);
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names', 'unavailable'));
    const editor = await openDressingEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('WC 3');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('status')).toContainText('indisponibles');
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('Dressing');
  });

  test('@nr NR-portal-frontend-11 lecture impossible : noms d origine, sans blocage', async ({ page }) => {
    await noArmoire(page);
    await page.route('**/api/portal/lights/names', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/lighting');
    await expect(page.getByTestId('light-name-label-dressing')).toHaveText('Dressing');
    await expect(page.getByTestId('light-name-label-terrasse')).toHaveText('Terrasse');
    await expect(page.getByRole('heading', { name: 'Éclairages principaux' })).toBeVisible();
  });
});
