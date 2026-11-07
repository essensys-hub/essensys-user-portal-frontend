/**
 * Noms personnalisés des volets et stores (noms-volets-2026-11-005), portail cloud en mode démo.
 * NR: NR-portal-frontend-12 essensys-hub/essensys-feature-lifecycle#41
 */
import { test, expect, type Page } from '@playwright/test';
import { noArmoire, recordedCalls } from './noArmoire';

const namePuts = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.method === 'PUT' && c.url.includes('/api/portal/admin/shutters/names'));

/** Aucune écriture vers l'armoire : ni injection, ni action web, ni écriture dans la table d'échange. */
const armoireWrites = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => /\/inject|\/web\/actions|\/exchange/.test(c.url));

const openEditor = async (page: Page, id = 'volet1salon') => {
  await page.goto('/shutters');
  await page.getByTestId(`shutter-name-toggle-${id}`).click();
  return page.getByTestId(`shutter-name-${id}`);
};

test.describe('noms des volets', () => {
  test('@nr NR-portal-frontend-12 Volet 1 Salon renomme : liste, Temps de course et message, puis remise a zero', async ({ page }) => {
    const external = await noArmoire(page);
    // Commande acceptée par la session simulée (aucune armoire) pour lire le message de dernière action.
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_inject', 'live'));
    const editor = await openEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('Volet baie vitrée');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('status')).toContainText('Nom enregistré : Volet baie vitrée');
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText('Volet baie vitrée');
    await expect(page.getByTestId('shutter-time-name-volet1salon')).toHaveText('Volet baie vitrée');
    await expect(page.getByText('Volet 1 Salon', { exact: true })).toHaveCount(0);

    const puts = await namePuts(page);
    expect(puts).toHaveLength(1);
    expect(puts[0].url).toContain('/api/portal/admin/shutters/names/volet1salon');
    expect(puts[0].body).toEqual({ name: 'Volet baie vitrée' });

    // Le message après une commande utilise le nom affiché.
    await page.getByTestId('shutter-volet1salon').getByRole('button', { name: 'Ouvrir' }).click();
    await expect(page.getByText('Volet baie vitrée : Ouvert')).toBeVisible();

    // Message « temps de course réglé » avec le nom affiché.
    const timeCard = page.getByTestId('shutter-time-name-volet1salon').locator('xpath=ancestor::div[contains(@class,"justify-between")][1]');
    await timeCard.getByRole('spinbutton').fill('30');
    await timeCard.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('Volet baie vitrée : temps de course réglé à 30 s')).toBeVisible();

    // Remise à zéro : le nom d'origine réapparaît.
    await editor.getByRole('button', { name: "Nom d'origine" }).click();
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText('Volet 1 Salon');
    await expect(page.getByTestId('shutter-time-name-volet1salon')).toHaveText('Volet 1 Salon');
    expect((await namePuts(page)).at(-1)?.body).toEqual({ name: null });

    // Aucun ordre vers l'armoire pour le renommage ; seule la commande « Ouvrir » est une injection.
    const writes = await armoireWrites(page);
    expect(writes.filter((c) => /shutters\/names/.test(c.url))).toEqual([]);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-12 41 caracteres refuse sans requete, 40 accepte et lisible', async ({ page }) => {
    await noArmoire(page);
    const editor = await openEditor(page);
    const input = editor.getByLabel(/^Nom \(1 à 40/);
    await input.fill('a'.repeat(41));
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('alert')).toContainText('40 caractères');
    expect(await namePuts(page)).toHaveLength(0);
    await input.fill('   ');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('alert')).toBeVisible();
    expect(await namePuts(page)).toHaveLength(0);
    const long = 'W'.repeat(40);
    await input.fill(long);
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText(long);
    expect(await namePuts(page)).toHaveLength(1);

    // Un nom de 40 caractères ne masque pas les boutons et ne fait pas défiler la page en largeur.
    await expect(page.getByTestId('shutter-volet1salon').getByRole('button', { name: 'Ouvrir' })).toBeInViewport();
    await expect(page.getByTestId('shutter-volet1salon').getByRole('button', { name: 'Fermer' })).toBeInViewport();
    // La carte du volet reste dans l'écran (l'en-tête fixe du portail est hors sujet).
    const cardRight = await page.getByTestId('shutter-volet1salon').evaluate((e) => e.getBoundingClientRect().right);
    expect(cardRight).toBeLessThanOrEqual((page.viewportSize()?.width ?? 1280) + 1);
    const timeRow = page.getByTestId('shutter-time-name-volet1salon');
    await timeRow.scrollIntoViewIfNeeded();
    await expect(timeRow).toHaveText(long);
    await expect(timeRow).toBeInViewport();
  });

  test('@nr NR-portal-frontend-12 Store "nord" affiche tel quel, texte brut', async ({ page }) => {
    await noArmoire(page);
    const editor = await openEditor(page, 'voletstore');
    await editor.getByLabel(/^Nom \(1 à 40/).fill('Store "nord" &amp;');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-name-label-voletstore')).toHaveText('Store "nord" &amp;');
    await expect(page.getByTestId('shutter-time-name-voletstore')).toHaveText('Store "nord" &amp;');
    expect((await namePuts(page))[0].body).toEqual({ name: 'Store "nord" &amp;' });
  });

  test('@nr NR-portal-frontend-12 chevrons refuses avant envoi', async ({ page }) => {
    await noArmoire(page);
    const editor = await openEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('<b>x</b>');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('alert')).toBeVisible();
    expect(await namePuts(page)).toHaveLength(0);
  });

  test('@nr NR-portal-frontend-12 non-administrateur : aucun champ de nom', async ({ page }) => {
    const external = await noArmoire(page, { role: 'user' });
    await page.goto('/shutters');
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText('Volet 1 Salon');
    await expect(page.locator('[data-testid^="shutter-name-toggle-"]')).toHaveCount(0);
    await expect(page.getByLabel(/^Nom \(1 à 40/)).toHaveCount(0);
    expect(await namePuts(page)).toHaveLength(0);
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-12 erreur 503 : message clair, nom inchange', async ({ page }) => {
    await noArmoire(page);
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names', 'unavailable'));
    const editor = await openEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('Volet baie vitrée');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(editor.getByRole('status')).toContainText('indisponibles');
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText('Volet 1 Salon');
  });

  test('@nr NR-portal-frontend-12 lecture impossible : noms d origine, sans blocage', async ({ page }) => {
    await noArmoire(page);
    await page.route('**/api/portal/shutters/names', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/shutters');
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText('Volet 1 Salon');
    await expect(page.getByTestId('shutter-name-label-store')).toHaveText('Store (banne)');
    await expect(page.getByRole('heading', { name: 'Volets', exact: true })).toBeVisible();
  });

  test('@nr NR-portal-frontend-12 noms de lumieres inchanges apres renommage d un volet', async ({ page }) => {
    await noArmoire(page);
    const editor = await openEditor(page);
    await editor.getByLabel(/^Nom \(1 à 40/).fill('Volet baie vitrée');
    await editor.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-name-label-volet1salon')).toHaveText('Volet baie vitrée');
    const lights = await page.evaluate(async () => (await fetch('/api/portal/lights/names')).json());
    expect(lights.lights).toHaveLength(33);
    expect(lights.lights.every((l: { name: string | null }) => l.name === null)).toBe(true);
    expect((await namePuts(page)).every((c) => !c.url.includes('/lights/'))).toBe(true);
  });
});
